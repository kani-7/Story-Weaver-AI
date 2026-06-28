import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { AnalyzeStoryBody, AnalyzeStoryResponse } from "@workspace/api-zod";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

const OUTPUT_LANG_NAMES: Record<string, string> = {
  en: "English",
  si: "Sinhala (සිංහල)",
  ta: "Tamil (தமிழ்)",
};

export const validationMetrics = {
  validationPassed: 0,
  validationFailed: 0,
  retrySuccess: 0,
  retryFailed: 0,
};

function sanitizeGeminiResponse(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Response must be an object");
  }

  const obj = raw as Record<string, unknown>;

  if (obj.productionReadinessScore !== undefined && obj.productionScore === undefined) {
    obj.productionScore = obj.productionReadinessScore;
  }

  if (obj.genre === undefined) {
    obj.genre = "Drama";
  }
  if (obj.logline === undefined) {
    const title = (obj.title as string) ?? "";
    obj.logline = `A story about ${title.toLowerCase()}`;
  }

  const scenes = obj.scenes;
  if (Array.isArray(scenes)) {
    obj.scenes = scenes.map((scene: Record<string, unknown>) => {
      if (scene.description !== undefined && scene.setting === undefined) {
        scene.setting = scene.description;
      }

      if (Array.isArray(scene.narration)) {
        scene.narration = scene.narration.join(" ");
      }

      if (Array.isArray(scene.thoughts) && !Array.isArray(scene.internalThoughts)) {
        scene.internalThoughts = scene.thoughts;
      }

      if (Array.isArray(scene.actions) && !Array.isArray(scene.characterActions)) {
        scene.characterActions = scene.actions;
      }

      if (Array.isArray(scene.emotions) && !Array.isArray(scene.characterEmotions)) {
        scene.characterEmotions = scene.emotions;
      }

      if (scene.visualPrompt !== undefined && scene.directorNote === undefined) {
        scene.directorNote = scene.visualPrompt;
      }

      if (typeof scene.imagePrompt === "object" && scene.imagePrompt !== null) {
        const imagePrompt = scene.imagePrompt as Record<string, unknown>;
        if (Array.isArray(imagePrompt.visualEffects)) {
          imagePrompt.visualEffects = (imagePrompt.visualEffects as unknown[]).join(", ");
        }
        if (imagePrompt.imageGenerationScore === undefined) {
          imagePrompt.imageGenerationScore = 75;
        }
      }

      if (typeof scene.storyboardFrameMetadata === "object" && scene.storyboardFrameMetadata !== null) {
        const frame = scene.storyboardFrameMetadata as Record<string, unknown>;
        if (frame.lensStyle !== undefined && frame.lensStyleFrame === undefined) {
          frame.lensStyleFrame = frame.lensStyle;
        }
        if (frame.cinematicCompositionNotes !== undefined && frame.compositionNotes === undefined) {
          frame.compositionNotes = frame.cinematicCompositionNotes;
        }
      }

      return scene;
    });
  }

  if (typeof obj.visualProductionReport === "object" && obj.visualProductionReport !== null) {
    const report = obj.visualProductionReport as Record<string, unknown>;

    if (Array.isArray(report.strongestVisualScenes)) {
      report.strongestVisualScenes = report.strongestVisualScenes.map((s: unknown) =>
        typeof s === "string" ? parseInt(s, 10) || 0 : s
      ).filter((n: unknown) => typeof n === "number");
    }
    if (Array.isArray(report.weakestVisualScenes)) {
      report.weakestVisualScenes = report.weakestVisualScenes.map((s: unknown) =>
        typeof s === "string" ? parseInt(s, 10) || 0 : s
      ).filter((n: unknown) => typeof n === "number");
    }

    if (report.animationComplexityNotes && !report.animationComplexity) {
      report.animationComplexity = Array.isArray(report.animationComplexityNotes)
        ? (report.animationComplexityNotes as unknown[]).join("; ")
        : report.animationComplexityNotes;
    }
    if (report.renderingDifficultyNotes && !report.renderingDifficulty) {
      report.renderingDifficulty = Array.isArray(report.renderingDifficultyNotes)
        ? (report.renderingDifficultyNotes as unknown[]).join("; ")
        : report.renderingDifficultyNotes;
    }
  }

  if (typeof obj.productionScore !== "number") {
    obj.productionScore = 75;
  }

  return obj;
}

function parseJSONWithFallback(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // Continue
      }
    }

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        // Continue
      }
    }

    const cleaned = text
      .replace(/[\n\r]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/:\s*"([^"]*)"/g, (match, val) =>
        match.replace(val, val.replace(/"/g, '\\"')));

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error(`Failed to parse JSON after all fallbacks: ${err}`);
    }
  }
}

async function callGemini(prompt: string): Promise<unknown> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 32768, responseMimeType: "application/json" },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return parseJSONWithFallback(text);
}

router.post("/storyboard/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { story, outputLanguage = "en" } = parsed.data;

  const outputLanguageName = OUTPUT_LANG_NAMES[outputLanguage] ?? "English";

  const prompt = `You are a professional storyboard director. Analyze this story and output ONLY valid JSON with these EXACT field names:
- title, genre, logline, characters, scenes, productionScore, movieReadinessReport, visualProductionReport
- scenes: sceneNumber, sceneType (Present|Flashback|Dream|Imagination), title, setting, directorNote, narration (STRING not array), dialogue, internalThoughts, internalMonologue, characterActions, characterEmotions, audio, continuityCheck, cinematicCamera, shotList, tensionAnalysis, continuityMemory, exportReadiness, imagePrompt, storyboardFrameMetadata
- imagePrompt: visualEffects MUST be STRING, imageGenerationScore MUST be number
- storyboardFrameMetadata: lensStyleFrame and compositionNotes
- visualProductionReport: strongestVisualScenes and weakestVisualScenes MUST be NUMBER arrays
- Return ONLY JSON - no markdown, no code blocks

Output JSON structure:
{
  "title": "Story title",
  "genre": "Genre",
  "logline": "One-sentence summary",
  "characters": [{"characterId": "slug", "name": "Name", "species": "Species", "appearance": "3-4 sentences", "clothing": "Clothing", "personality": "2-3 sentences", "distinctiveFeatures": "2-4 markers", "voiceStyle": "ENGLISH ONLY voice description"}],
  "scenes": [{"sceneNumber": 1, "sceneType": "Present", "title": "Scene title", "setting": "Where and when", "directorNote": "ENGLISH ONLY 40-80 word visual prompt", "narration": "Single string narration or empty", "dialogue": [{"character": "Name", "line": "Dialogue", "vocalEmotion": "ENGLISH", "vocalIntensity": 0.75, "speechSpeed": "normal", "pauseTiming": "ENGLISH", "whisperDetection": false, "shoutDetection": false}], "internalThoughts": [{"character": "Name", "thought": "Brief thought"}], "internalMonologue": [{"character": "Name", "monologue": "Extended inner voice"}], "characterActions": [{"character": "Name", "action": "Action"}], "characterEmotions": [{"character": "Name", "emotion": "Emotion", "confidence": 0.85}], "audio": {"backgroundAmbience": ["sound"], "backgroundMusic": "ENGLISH", "soundEffects": ["sfx"]}, "continuityCheck": {"status": "Pass", "issues": []}, "cinematicCamera": {"shotType": "Medium Shot", "cameraAngle": "Eye Level", "cameraMovement": "Static", "lensStyle": "35mm cinematic", "framingStyle": "ENGLISH", "lightingStyle": "ENGLISH", "pacingStyle": "ENGLISH"}, "shotList": [{"shotNumber": 1, "shotDescription": "ENGLISH", "shotPurpose": "ENGLISH", "estimatedDuration": "3 seconds", "transitionType": "Hard Cut"}], "tensionAnalysis": {"tensionCurve": "ENGLISH", "emotionalIntensity": 0.65, "pacingBalance": "ENGLISH"}, "continuityMemory": {"clothingState": ["Char: state"], "weatherState": "ENGLISH", "environmentState": "ENGLISH", "objectsPresent": ["obj"], "injuryState": ["Char: uninjured"], "emotionalCarryOver": [], "lightingState": "ENGLISH", "timeOfDay": "ENGLISH", "continuityWarnings": [], "continuityResolutionSuggestions": []}, "exportReadiness": {"screenplayReady": true, "storyboardReady": true, "animationPipelineReady": true, "voicePipelineReady": true, "editingPipelineReady": true}, "imagePrompt": {"sceneImagePrompt": "ENGLISH 80-150 words", "colorPalette": "ENGLISH", "environmentDetail": "ENGLISH", "characterPositioning": "ENGLISH", "facialExpressionDetail": "ENGLISH", "cinematicMood": "ENGLISH", "visualEffects": "ENGLISH string", "renderStyle": "ENGLISH", "animationStyle": "ENGLISH", "visualEngine": "PresentEngine", "characterVisualContinuity": "ENGLISH", "imageGenerationScore": 85}, "storyboardFrameMetadata": {"aspectRatio": "ENGLISH", "focalLength": "ENGLISH", "depthOfField": "ENGLISH", "lensStyleFrame": "ENGLISH", "compositionNotes": "ENGLISH"}, "flashbackIndicator": "optional", "transitionIn": "optional", "returnToPresent": "optional"}],
  "productionScore": 85,
  "movieReadinessReport": {"strengths": ["strength"], "weaknesses": ["weakness"], "missingElements": [], "productionNotes": "ENGLISH"},
  "visualProductionReport": {"strongestVisualScenes": [1, 2], "weakestVisualScenes": [3], "consistencyRisks": ["risk"], "animationComplexity": "ENGLISH", "renderingDifficulty": "ENGLISH", "cinematicStrengths": ["strength"]}
}

Story:
${story}

STRICT RULES:
1. narration MUST be STRING not array
2. visualEffects MUST be STRING not array
3. strongestVisualScenes and weakestVisualScenes MUST be NUMBER arrays
4. imageGenerationScore MUST be number 0-100
5. vocalIntensity, confidence, emotionalIntensity MUST be numbers 0-1
6. Return ONLY JSON - no markdown, no code blocks, no explanation
`;

  let raw: unknown;
  try {
    raw = await callGemini(prompt);
  } catch (err) {
    req.log.error({ err }, "Gemini API error (attempt 1)");
    res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
    return;
  }

  let sanitized: Record<string, unknown>;
  try {
    sanitized = sanitizeGeminiResponse(raw);
  } catch (err) {
    req.log.error({ err, raw }, "JSON sanitization failed");
    res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    return;
  }

  let validated = AnalyzeStoryResponse.safeParse(sanitized);

  if (!validated.success) {
    validationMetrics.validationFailed++;
    req.log.warn(
      { zodErrors: validated.error.issues, attempt: 1 },
      "Storyboard validation failed after sanitization - retrying"
    );

    let raw2: unknown;
    try {
      raw2 = await callGemini(prompt);
    } catch (err) {
      validationMetrics.retryFailed++;
      req.log.error({ err }, "Gemini API error (attempt 2)");
      res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
      return;
    }

    let sanitized2: Record<string, unknown>;
    try {
      sanitized2 = sanitizeGeminiResponse(raw2);
    } catch (err) {
      req.log.error({ err, raw: raw2 }, "JSON sanitization failed on retry");
      res.status(500).json({ error: "Failed to parse AI response on retry. Please try again." });
      return;
    }

    validated = AnalyzeStoryResponse.safeParse(sanitized2);

    if (!validated.success) {
      validationMetrics.retryFailed++;
      req.log.error(
        { zodErrors: validated.error.issues, attempt: 2 },
        "Storyboard validation failed after retry - returning error"
      );
      res.status(500).json({
        error: "AI response did not meet the required structure after two attempts. Please try again.",
        details: validated.error.issues.slice(0, 3).map(i => i.message),
      });
      return;
    }

    validationMetrics.retrySuccess++;
    req.log.info(
      { attempt: 2, metrics: { ...validationMetrics } },
      "Storyboard validation passed after retry"
    );
  } else {
    validationMetrics.validationPassed++;
    req.log.info(
      { attempt: 1, metrics: { ...validationMetrics } },
      "Storyboard validation passed"
    );
  }

  const storyboardId = randomUUID();
  const response = validated.data as Record<string, unknown>;
  response.storyboardId = storyboardId;

  res.json(response);
});

export default router;
