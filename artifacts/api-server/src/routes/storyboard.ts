import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { AnalyzeStoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

const OUTPUT_LANG_NAMES: Record<string, string> = {
  en: "English",
  si: "Sinhala (සිංහල)",
  ta: "Tamil (தமிழ்)",
};

router.post("/storyboard/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { story, outputLanguage = "en" } = parsed.data;

  const outputLanguageName = OUTPUT_LANG_NAMES[outputLanguage] ?? "English";

  const prompt = `You are a professional storyboard director and visual storyteller. Analyze the following story and produce a structured storyboard.

This system uses a three-layer language architecture. Follow each layer's rules exactly and independently.

═══════════════════════════════════════════════
LAYER 1 — STORY INPUT (auto-detected, internal)
═══════════════════════════════════════════════
- Detect the language of the input story automatically (Sinhala, Tamil, English, or other).
- Read and understand the story in its original language.
- This detection is internal only. Do NOT carry the story language into any output field.

═══════════════════════════════════════════════
LAYER 2 — PRODUCTION PIPELINE (fixed English, internal)
═══════════════════════════════════════════════
- The "visualPrompt" field MUST always be written in English. This is fixed and cannot change.
- Write visual prompts as professional English production notes for a 3D animation studio.
- Visual prompts must reference the character's distinctiveFeatures and appearance for every character present in the scene to ensure cross-scene visual consistency.

═══════════════════════════════════════════════
LAYER 3 — OUTPUT LANGUAGE (user-selected: ${outputLanguageName})
═══════════════════════════════════════════════
- ALL human-readable output fields — title, species, appearance, clothing, personality, distinctiveFeatures, scene titles, scene descriptions, thought text — MUST be written in ${outputLanguageName}.
- This is independent of the story's original language. Translate or adapt as needed.
- Character names: transliterate or adapt to ${outputLanguageName} conventions. Use the same spelling consistently across every scene.
- For Sinhala output: preserve all Sinhala Unicode characters (U+0D80–U+0DFF) exactly.
- For Tamil output: preserve all Tamil Unicode characters (U+0B80–U+0BFF) exactly.

Story:
"""
${story}
"""

═══════════════════════════════════════════════
CHARACTER CONSISTENCY PROFILE RULES
═══════════════════════════════════════════════
- Before generating scenes, build a complete Character Consistency Profile for EVERY named or described character.
- Each profile MUST include all fields below.
- characterId: a short unique slug in English lowercase only (e.g. "fox", "old-man", "queen"). Never reuse the same id.
- name: character name in ${outputLanguageName} (transliterate from the story if needed). Use this exact spelling in every scene's "characters" array.
- species, appearance, clothing, personality, distinctiveFeatures: all in ${outputLanguageName}.
- clothing: describe garments and accessories if present or implied. Write "—" only if none exists.
- distinctiveFeatures: one sentence of unique visual markers (scars, markings, eye color, patterns) that an artist must reproduce identically in every scene.
- The profiles are the single source of truth. Every scene's visualPrompt MUST embed the distinctiveFeatures for each character present.

═══════════════════════════════════════════════
INTERNAL THOUGHT DETECTION RULES
═══════════════════════════════════════════════
- Quoted text is NOT always spoken dialogue. Decide carefully whether each quoted passage is spoken aloud or is a private thought.
- Internal Thought: narration says "thought", "wondered", "realized", "felt", "said to himself/herself", or context shows it is not spoken aloud.
- Dialogue: character physically speaks to another character, calls out, shouts, or replies aloud.
- Do NOT merge Thoughts and Dialogue.
- Each scene's "thoughts" array lists every Internal Thought in that scene. Return "thoughts": [] if none.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "A short cinematic title in ${outputLanguageName}",
  "characters": [
    {
      "characterId": "english-slug",
      "name": "Character name in ${outputLanguageName}",
      "species": "Species or type in ${outputLanguageName}",
      "appearance": "Build, face, coloring, overall look in ${outputLanguageName}",
      "clothing": "Garments and accessories in ${outputLanguageName}, or —",
      "personality": "Temperament and behavioral traits in ${outputLanguageName}",
      "distinctiveFeatures": "Unique visual markers in ${outputLanguageName}, used in every scene"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Short scene title in ${outputLanguageName}",
      "description": "2-3 sentences describing this scene in ${outputLanguageName}",
      "characters": ["Character name exactly as in the profile"],
      "visualPrompt": "ENGLISH ONLY. Vivid 3D cartoon production prompt referencing each present character's distinctiveFeatures and appearance. Include lighting, camera angle, environment, character poses, mood, color palette. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition.",
      "thoughts": [
        {
          "character": "Character name exactly as in the profile",
          "thought": "Internal thought text in ${outputLanguageName}"
        }
      ]
    }
  ]
}

Final rules:
- Extract all named or described characters; give each a unique English characterId
- Divide the story into 3-8 meaningful scenes
- Each visualPrompt: English only, 40-80 words, vivid, references character distinctiveFeatures
- Every scene MUST have "thoughts" (empty array if none)
- Scene "characters" arrays MUST use the EXACT same name as in the character profile
- Output language Unicode must be preserved exactly — never escape, romanize, or drop characters
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({ error: "No response from Gemini" });
      return;
    }

    let storyboard;
    try {
      storyboard = JSON.parse(text);
    } catch {
      req.log.error({ text }, "Failed to parse Gemini JSON response");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(storyboard);
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
  }
});

export default router;
