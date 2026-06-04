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
Before generating any scenes, build a complete Character Consistency Profile for EVERY named or meaningfully described character. These profiles are the canonical reference; scenes must never contradict them.

Field-by-field requirements (ALL fields mandatory, ALL in ${outputLanguageName} except characterId):

• characterId — English lowercase hyphenated slug, 1-3 words, unique across all characters (e.g. "silver-fox", "old-keeper", "twin-sisters"). Never reuse; used by the system to track cross-scene consistency.

• name — The character's name exactly as adapted to ${outputLanguageName}. Use this identical spelling in every scene's "characters" array without variation.

• species — The character's species or archetype in ${outputLanguageName} (e.g. "Red Fox", "Human", "Ancient Dragon", "Sentient Robot"). One noun phrase only.

• appearance — Write 3-4 sentences covering ALL of:
  (a) Height, build, and overall body shape
  (b) Face: shape, eye color, brow, jaw, notable facial features
  (c) Skin / fur / scales / hair: exact color, texture, any gradient or pattern
  (d) One immediately striking physical trait a viewer notices first
  Be precise enough that an artist can draw this character cold, without asking follow-up questions.

• clothing — Describe garments, accessories, footwear, and any carried items that are mentioned or clearly implied by context. Include colors and condition (worn, pristine, etc.). Write "—" ONLY if the character genuinely has no clothing and none is implied.

• personality — Write 2-3 sentences covering:
  (a) Core motivation: what fundamentally drives this character
  (b) Emotional baseline: how they present to the world and relate to others
  (c) A behavioral tell or quirk that surfaces under pressure or strong emotion
  This must read as a character study, not a list of adjectives.

• distinctiveFeatures — List exactly 2-4 specific, artist-reproducible visual markers as short precise phrases. Each marker must be concrete and unique enough to identify this character in a crowd. Examples of correct phrasing: "a diagonal scar bisecting the left eyebrow", "iridescent blue-tipped tail feathers that shimmer when moving", "always carries a cracked leather satchel over the right shoulder", "one amber eye and one pale grey eye". These EXACT markers must appear verbatim in every visualPrompt where this character appears.

═══════════════════════════════════════════════
INTERNAL THOUGHT DETECTION RULES
═══════════════════════════════════════════════
- Quoted text is NOT always spoken dialogue. Decide carefully whether each quoted passage is spoken aloud or is a private thought.
- Internal Thought: narration says "thought", "wondered", "realized", "felt", "said to himself/herself", or context shows it is not spoken aloud.
- Dialogue: character physically speaks to another character, calls out, shouts, or replies aloud.
- Do NOT merge Thoughts and Dialogue.
- Each scene's "thoughts" array lists every Internal Thought in that scene. Return "thoughts": [] if none.

═══════════════════════════════════════════════
SCENE TYPE DETECTION RULES
═══════════════════════════════════════════════
Every scene MUST be assigned exactly one sceneType from: "Present", "Flashback", "Dream", "Imagination".

Detection guidance:
- "Present": The scene takes place in the current narrative timeline. Default when no temporal shift is detected.
- "Flashback": The scene depicts a past event, memory, or recollection. Detect via: past-tense narration stepping back in time, phrases like "remembered", "recalled", "years ago", "when he/she was young", "in those days", character mentally revisiting a prior event, or any explicit statement that time has jumped backward.
- "Dream": The scene occurs within a character's dream or sleep state. Detect via: a character sleeping then experiencing events, surreal or impossible imagery within a sleep context, waking up from the events depicted, or narration explicitly naming it a dream/nightmare.
- "Imagination": The scene occurs in a character's active imagination, fantasy, or hypothetical mental projection while awake. Detect via: phrases like "imagined", "pictured", "fantasized", "what if", "envisioned", or a character consciously constructing a scenario in their mind.

FLASHBACK / DREAM / IMAGINATION SCENE EXTRA FIELDS (required when sceneType ≠ "Present"):
- flashbackIndicator (English): A concise on-screen text card or narrator cue that marks the temporal/mental shift for the audience. Examples: "Five Years Earlier", "In Her Memory", "A Dream", "His Imagination". Keep it under 6 words, evocative, and precise.
- transitionInstructions (English): Specific cinematic technique instructions for ENTERING this non-present scene. Describe the exact visual/audio transition: e.g., "Slow dissolve to sepia-toned footage with a soft whoosh sound; edges vignette inward as the frame desaturates", "Hard cut to grainy super-8 footage; a muffled echo effect on all audio". Be specific enough for a director of photography to execute it.
- returnToPresentInstructions (English): Specific cinematic technique instructions for EXITING this non-present scene and returning to the present timeline. Describe the exact visual/audio technique: e.g., "Match-cut on the character's eyes snapping open; color floods back in a single frame", "Fade to white, then dissolve to the present scene with ambient sound rising". Be specific enough for a director of photography to execute it.

DIRECTOR'S NOTE (visualPrompt) RULES FOR NON-PRESENT SCENES:
- For "Flashback" scenes: include the specific color grade (desaturated, sepia, warm-faded), film grain or texture level, and framing style (e.g., tighter crop, softer focus) that signals a memory. Note any aged or period-appropriate set dressing.
- For "Dream" scenes: describe the surreal, heightened, or distorted visual language — unusual color, impossible geometry, lighting that defies logic — that distinguishes the dream from reality.
- For "Imagination" scenes: describe how the imagined world differs visually from the present — idealized colors, exaggerated scale, stylized rendering — that makes the subjective mental image legible to the audience.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "A short cinematic title in ${outputLanguageName}",
  "characters": [
    {
      "characterId": "english-lowercase-slug",
      "name": "Character name in ${outputLanguageName}",
      "species": "Species or archetype in ${outputLanguageName}",
      "appearance": "3-4 sentences: height/build, face/eyes, coloring/texture, striking first impression — all in ${outputLanguageName}",
      "clothing": "Garments, accessories, carried items with colors and condition in ${outputLanguageName}, or — if none",
      "personality": "2-3 sentences: core motivation, emotional baseline, behavioral tell — in ${outputLanguageName}",
      "distinctiveFeatures": "2-4 precise artist-reproducible markers as short phrases in ${outputLanguageName}, used verbatim in every scene's visualPrompt"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneType": "Present",
      "title": "Short scene title in ${outputLanguageName}",
      "description": "2-3 sentences describing this scene in ${outputLanguageName}",
      "characters": ["Character name exactly as in the profile"],
      "visualPrompt": "ENGLISH ONLY. Vivid 3D cartoon production prompt referencing each present character's distinctiveFeatures and appearance. Include lighting, camera angle, environment, character poses, mood, color palette. For non-Present scenes include temporal/mental-shift visual language as described in the rules above. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition.",
      "thoughts": [
        {
          "character": "Character name exactly as in the profile",
          "thought": "Internal thought text in ${outputLanguageName}"
        }
      ],
      "flashbackIndicator": "ONLY for sceneType Flashback/Dream/Imagination — short on-screen text card in English, omit for Present",
      "transitionInstructions": "ONLY for sceneType Flashback/Dream/Imagination — English cinematic entry transition instructions, omit for Present",
      "returnToPresentInstructions": "ONLY for sceneType Flashback/Dream/Imagination — English cinematic exit/return instructions, omit for Present"
    }
  ]
}

Final rules:
- Extract all named or described characters; give each a unique English characterId
- Divide the story into 3-8 meaningful scenes
- Every scene MUST have "sceneType" — default is "Present" when no temporal or mental shift is detected
- Every scene MUST have "thoughts" (empty array if none)
- Scenes with sceneType "Flashback", "Dream", or "Imagination" MUST include "flashbackIndicator", "transitionInstructions", and "returnToPresentInstructions"
- Scenes with sceneType "Present" MUST NOT include "flashbackIndicator", "transitionInstructions", or "returnToPresentInstructions"
- Each visualPrompt: English only, 40-80 words, vivid, references character distinctiveFeatures; non-Present scenes include the appropriate temporal/mental visual language
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
