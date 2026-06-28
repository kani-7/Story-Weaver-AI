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

// ─── Validation Metrics ────────────────────────────────────────────────────────
export const validationMetrics = {
  validationPassed: 0,
  validationFailed: 0,
  retrySuccess: 0,
  retryFailed: 0,
};

// ─── Gemini Call Helper ────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<unknown> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 32768, responseMimeType: "application/json" },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text);
}

router.post("/storyboard/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { story, outputLanguage = "en" } = parsed.data;
  const outputLanguageName = OUTPUT_LANG_NAMES[outputLanguage] ?? "English";

  const prompt = `You are a professional storyboard director. Analyze the story below and output ONLY valid JSON using EXACTLY these field names. Story output language: ${outputLanguageName}. All camera, audio, and technical fields must be in English only.

Story:
"""
${story}
"""

Return ONLY this JSON structure (no markdown, no code blocks, no explanation):

{
  "title": "Story title in ${outputLanguageName}",
  "genre": "Genre in ${outputLanguageName}",
  "logline": "One-sentence summary in ${outputLanguageName}",
  "characters": [
    {
      "characterId": "english-lowercase-slug",
      "name": "Character name in ${outputLanguageName}",
      "species": "Species or archetype in ${outputLanguageName}",
      "appearance": "3-4 sentences in ${outputLanguageName}",
      "clothing": "Clothing in ${outputLanguageName}, or omit field if none",
      "personality": "2-3 sentences in ${outputLanguageName}",
      "distinctiveFeatures": "2-4 visual markers in ${outputLanguageName}",
      "voiceStyle": "ENGLISH ONLY: pitch, tempo, texture, accent, delivery style"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneType": "Present",
      "title": "Scene title in ${outputLanguageName}",
      "setting": "Where and when in ${outputLanguageName}",
      "directorNote": "ENGLISH ONLY: 40-80 words. Visual prompt including character distinctiveFeatures verbatim, lighting, camera angle, environment, mood. Pixar-style 3D render.",
      "narration": "Narrator text as a single string in ${outputLanguageName}, or empty string if none",
      "dialogue": [
        {
          "character": "Exact name from profile",
          "line": "Spoken words in ${outputLanguageName}, no quotation marks",
          "vocalEmotion": "ENGLISH ONLY: emotional quality e.g. grief-stricken, defiant, tender",
          "vocalIntensity": 0.75,
          "speechSpeed": "normal",
          "pauseTiming": "ENGLISH ONLY: e.g. dramatic pause before line",
          "whisperDetection": false,
          "shoutDetection": false
        }
      ],
      "internalThoughts": [
        { "character": "Exact name from profile", "thought": "Brief reflection in ${outputLanguageName}" }
      ],
      "internalMonologue": [
        { "character": "Exact name from profile", "monologue": "Extended inner voice in ${outputLanguageName}" }
      ],
      "characterActions": [
        { "character": "Named character ONLY", "action": "Present-tense physical action in ${outputLanguageName}" }
      ],
      "characterEmotions": [
        { "character": "Exact name from profile", "emotion": "Emotional state in ${outputLanguageName}", "confidence": 0.85 }
      ],
      "audio": {
        "backgroundAmbience": ["ENGLISH: ambient sound 1", "ENGLISH: ambient sound 2"],
        "backgroundMusic": "ENGLISH ONLY: tempo, instrumentation, emotional tone",
        "soundEffects": ["ENGLISH: specific sound effect"]
      },
      "continuityCheck": {
        "status": "Pass",
        "issues": []
      },
      "cinematicCamera": {
        "shotType": "Medium Shot",
        "cameraAngle": "Eye Level",
        "cameraMovement": "Static",
        "lensStyle": "35mm cinematic",
        "framingStyle": "ENGLISH ONLY: composition note",
        "lightingStyle": "ENGLISH ONLY: lighting mood",
        "pacingStyle": "ENGLISH ONLY: editorial pacing feel"
      },
      "shotList": [
        {
          "shotNumber": 1,
          "shotDescription": "ENGLISH ONLY: what the camera captures",
          "shotPurpose": "ENGLISH ONLY: narrative or emotional purpose",
          "estimatedDuration": "3 seconds",
          "transitionType": "Hard Cut"
        }
      ],
      "tensionAnalysis": {
        "tensionCurve": "ENGLISH ONLY: description of tension arc in this scene",
        "emotionalIntensity": 0.65,
        "pacingBalance": "ENGLISH ONLY: editorial pacing assessment"
      },
      "continuityMemory": {
        "clothingState": ["ENGLISH: Character A: current clothing state"],
        "weatherState": "ENGLISH ONLY: current weather conditions",
        "environmentState": "ENGLISH ONLY: current location and environment state",
        "objectsPresent": ["ENGLISH: key prop and state"],
        "injuryState": ["ENGLISH: Character A: uninjured"],
        "emotionalCarryOver": [],
        "lightingState": "ENGLISH ONLY: current ambient lighting",
        "timeOfDay": "ENGLISH ONLY: current time of day",
        "continuityWarnings": [],
        "continuityResolutionSuggestions": []
      },
      "exportReadiness": {
        "screenplayReady": true,
        "storyboardReady": true,
        "animationPipelineReady": true,
        "voicePipelineReady": true,
        "editingPipelineReady": true
      },
      "sceneImagePrompt": {
        "sceneImagePrompt": "ENGLISH ONLY: 80-150 words, paste-ready image prompt. Include character distinctiveFeatures verbatim, environment, lighting, color palette, camera angle, emotional mood, render style.",
        "colorPalette": "ENGLISH ONLY: specific named color palette",
        "environmentDetail": "ENGLISH ONLY: architecture/terrain, weather, key props, foreground/midground/background layers",
        "characterPositioning": "ENGLISH ONLY: exact positions, poses, facing directions, spatial relationships",
        "facialExpressionDetail": "ENGLISH ONLY: per-character brow position, eye openness, mouth state, jaw tension",
        "cinematicMood": "ENGLISH ONLY: compound mood phrase e.g. tense and claustrophobic with underlying dread",
        "visualEffects": "ENGLISH ONLY: specific visual effects as a single string, or empty string if none",
        "renderStyle": "ENGLISH ONLY: render style e.g. vibrant 3D Pixar-style cartoon render, PBR materials",
        "animationStyle": "ENGLISH ONLY: animation style e.g. fluid Disney 12-principles, secondary motion on hair",
        "visualEngine": "PresentEngine",
        "characterVisualContinuity": "ENGLISH ONLY: CharacterName: clothing/injury/wetness/emotional state",
        "imageGenerationScore": 85
      },
      "storyboardFrameMetadata": {
        "aspectRatio": "ENGLISH ONLY: e.g. 16:9 Widescreen",
        "focalLength": "ENGLISH ONLY: e.g. 85mm portrait",
        "depthOfField": "ENGLISH ONLY: e.g. shallow — subject sharp, background soft bokeh at f/1.8",
        "lensStyleFrame": "ENGLISH ONLY: e.g. anamorphic — oval bokeh and horizontal lens flares",
        "compositionNotes": "ENGLISH ONLY: subject placement, rule of thirds, negative space, foreground framing"
      }
    }
  ],
  "productionScore": 85,
  "movieReadinessReport": {
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "weaknesses": ["Specific weakness 1"],
    "missingElements": [],
    "productionNotes": "ENGLISH ONLY: 2-4 sentence paragraph of practical production advice."
  },
  "visualProductionReport": {
    "strongestVisualScenes": [1, 2],
    "weakestVisualScenes": [3],
    "consistencyRisks": ["ENGLISH: specific consistency risk"],
    "animationComplexity": "ENGLISH ONLY: overall animation complexity assessment as a single string",
    "renderingDifficulty": "ENGLISH ONLY: estimated rendering difficulty as a single string",
    "cinematicStrengths": ["ENGLISH: cinematic strength 1"]
  }
}

STRICT RULES:
- Output language for all human-readable story content: ${outputLanguageName}
- English ONLY for: directorNote, all audio fields, all camera fields, all shotList fields, all tensionAnalysis fields, all continuityMemory fields, all sceneImagePrompt fields, all storyboardFrameMetadata fields, all visualProductionReport fields, movieReadinessReport.productionNotes
- sceneType: exactly one of "Present" | "Flashback" | "Dream" | "Imagination"
- For non-Present scenes (Flashback/Dream/Imagination): add "flashbackIndicator" (ENGLISH, under 6 words), "transitionIn" (ENGLISH, cinematic entry technique), "returnToPresent" (ENGLISH, cinematic exit technique). Omit these three fields for Present scenes.
- vocalIntensity: number 0.00–1.00, never a string
- confidence: number 0.00–1.00, never a string
- emotionalIntensity: number 0.00–1.00, never a string
- imageGenerationScore: integer 0–100, never a string
- productionScore: integer 0–100, never a string
- visualEffects: MUST be a STRING, not an array
- strongestVisualScenes: MUST be an array of scene NUMBERS e.g. [1, 2], not strings
- weakestVisualScenes: MUST be an array of scene NUMBERS e.g. [3], not strings
- animationComplexity: MUST be a single string, not an array
- renderingDifficulty: MUST be a single string, not an array
- visualEngine MUST match sceneType: Present→"PresentEngine", Flashback→"FlashbackEngine", Dream→"DreamEngine", Imagination→"ImaginationEngine"
- sceneImagePrompt.sceneImagePrompt MUST include each present character's distinctiveFeatures verbatim
- Use [] for empty arrays. Use "" for empty narration.
- Divide the story into 3–8 meaningful scenes. Extract all named characters.
- Return ONLY the JSON object, nothing else.`;

  // ─── Generate storyboardId before validation ──────────────────────────────────
  const storyboardId = randomUUID();

  // ─── Attempt 1: Call Gemini ─────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await callGemini(prompt);
  } catch (err) {
    req.log.error({ err }, "Gemini API error (attempt 1)");
    res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
    return;
  }

  // ─── Inject storyboardId before validation (it is required by the schema) ────
  (raw as Record<string, unknown>).storyboardId = storyboardId;

  // ─── Attempt 1: Validate ────────────────────────────────────────────────────
  let validated = AnalyzeStoryResponse.safeParse(raw);

  if (!validated.success) {
    validationMetrics.validationFailed++;
    req.log.warn(
      { zodErrors: validated.error.issues, attempt: 1 },
      "Storyboard validation failed — retrying"
    );

    // ─── Attempt 2: Retry Gemini ───────────────────────────────────────────────
    let raw2: unknown;
    try {
      raw2 = await callGemini(prompt);
    } catch (err) {
      validationMetrics.retryFailed++;
      req.log.error({ err }, "Gemini API error (attempt 2)");
      res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
      return;
    }

    // ─── Inject storyboardId into retry response too ──────────────────────────
    (raw2 as Record<string, unknown>).storyboardId = storyboardId;

    // ─── Attempt 2: Validate ──────────────────────────────────────────────────
    validated = AnalyzeStoryResponse.safeParse(raw2);

    if (!validated.success) {
      validationMetrics.retryFailed++;
      req.log.error(
        { zodErrors: validated.error.issues, attempt: 2 },
        "Storyboard validation failed after retry — returning error"
      );
      res.status(500).json({
        error: "AI response did not meet the required structure after two attempts. Please try again.",
      });
      return;
    }

    // ─── Retry succeeded ───────────────────────────────────────────────────────
    validationMetrics.retrySuccess++;
    req.log.info(
      { attempt: 2, metrics: { ...validationMetrics } },
      "Storyboard validation passed after retry"
    );
  } else {
    // ─── First attempt succeeded ───────────────────────────────────────────────
    validationMetrics.validationPassed++;
    req.log.info(
      { attempt: 1, metrics: { ...validationMetrics } },
      "Storyboard validation passed"
    );
  }

  res.json(validated.data);
});

export default router;
