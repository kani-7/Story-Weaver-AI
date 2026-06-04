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
- ALL human-readable output fields — title, species, appearance, clothing, personality, distinctiveFeatures, scene titles, scene descriptions, narration, dialogue, thoughts, actions, emotions — MUST be written in ${outputLanguageName}.
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
- transitionInstructions (English): Specific cinematic technique instructions for ENTERING this non-present scene. Describe the exact visual/audio transition. Be specific enough for a director of photography to execute it.
- returnToPresentInstructions (English): Specific cinematic technique instructions for EXITING this non-present scene and returning to the present timeline. Be specific enough for a director of photography to execute it.

DIRECTOR'S NOTE (visualPrompt) RULES FOR NON-PRESENT SCENES:
- For "Flashback" scenes: include the specific color grade (desaturated, sepia, warm-faded), film grain or texture level, and framing style that signals a memory.
- For "Dream" scenes: describe the surreal, heightened, or distorted visual language that distinguishes the dream from reality.
- For "Imagination" scenes: describe how the imagined world differs visually from the present.

═══════════════════════════════════════════════
STORY INTELLIGENCE EXTRACTION RULES
═══════════════════════════════════════════════
For every scene, extract and separate the story into five distinct layers. Each layer captures a different type of storytelling content. Apply these rules strictly — do NOT mix categories.

── NARRATION ──
Definition: Pure storytelling text from an external narrator. Descriptive prose that sets the scene, provides context, or advances the story from outside any character's perspective.
Detect: Text that is NOT inside quotation marks, NOT attributed to a character speaking or thinking, and describes the world/situation from a third-person or omniscient viewpoint.
Format: Array of plain strings. Each entry is one continuous narrator passage from the scene.
Return [] if the scene has no narrator text.

── DIALOGUE ──
Definition: Words that a character physically speaks aloud to another character or to the room. Must be actual spoken communication.
Detect: Text inside quotation marks where the narrative says "said", "asked", "replied", "shouted", "whispered", "called out", "answered", or any verb of speaking. The character must be producing audible sound.
Critical rule: Do NOT include internal thoughts here, even if they are in quotation marks. A character "saying to himself" silently is a Thought, not Dialogue.
Format: Array of objects with "character" (exact name from profile) and "line" (the spoken words only, without surrounding quotation marks).
Return [] if the scene has no spoken dialogue.

── THOUGHTS ──
Definition: A character's private internal monologue, silent reflection, or unspoken feeling. Never heard by other characters.
Detect: Text where narrative says "thought", "wondered", "realized", "felt", "said to himself/herself", "mused", "recalled", "asked himself/herself", or where context makes clear the character is not speaking aloud.
Critical rule: Do NOT duplicate here anything already captured in Dialogue. If a character speaks AND thinks, they appear in both arrays separately.
Format: Array of objects with "character" (exact name from profile) and "thought" (the internal thought text, without surrounding quotation marks).
Return [] if the scene has no internal thoughts.

── ACTIONS ──
Definition: Physical actions, movements, or behaviors performed by characters. What the body does, not what the mind thinks or the mouth says.
Detect: Verbs of physical activity — running, jumping, reaching, drawing a weapon, opening a door, falling, embracing, pointing, trembling, etc. Also include significant environmental interactions (character picks up an object, character enters a room).
Format: Array of objects with "character" (exact name from profile, or "Narrator" for environmental action with no specific actor) and "action" (a concise present-tense description of the physical act).
Return [] if the scene has no notable physical actions.

── EMOTIONS ──
Definition: Emotional states or feelings experienced by characters in this scene, as detected from narration, behavior, or internal thought.
Detect: Explicit emotion words ("felt afraid", "smiled with joy"), implied emotions from behavior (hands trembling → fear; jaw clenched → anger), or emotional atmosphere described by the narrator.
Format: Array of objects with:
  - "character": exact name from profile
  - "emotion": a short, precise label for the emotional state (e.g. "grief", "quiet determination", "fearful anticipation", "warm nostalgia")
  - "confidence": a float from 0.00 to 1.00 representing detection certainty. Use 0.90–1.00 for emotions explicitly stated in text ("felt terrified", "burst into tears"), 0.60–0.89 for emotions clearly implied by behavior or context, 0.30–0.59 for emotions inferred from subtle cues or atmosphere. Never use exactly 0 or 1.
Return [] if no emotions can be clearly detected.

── AUDIO INTELLIGENCE ──
Definition: Sound design specifications for this scene to guide audio production.
Generate three audio components for every scene. All audio fields are in English regardless of output language.

- "backgroundAmbience": Array of concise strings naming ambient environmental sounds that would be heard continuously in this scene's setting. Examples: "distant thunder rumbling", "river flowing over stones", "busy marketplace chatter", "wind through dry grass", "hospital corridor hum". List 2-5 items. For Flashback scenes use softer, more muted versions. For Dream scenes use ethereal or distorted ambience.

- "backgroundMusic": A single string describing the musical underscore for this scene. Include: tempo (slow/moderate/fast), instrumentation (strings, piano, drums, etc.), emotional tone, and any genre reference. Examples: "Slow, melancholy piano with sparse cello; reminiscent of a lullaby decaying into silence", "Tense, staccato strings building to a crescendo; action-thriller style", "Warm, gentle acoustic guitar with birdsong woven in; pastoral and hopeful". For Flashback: use soft, slightly warped or echoed music suggesting memory. For Dream: use ethereal, ambient, or surreal instrumentation.

- "soundEffects": Array of specific one-shot or intermittent sound effects triggered by events in this scene. Reference the actions and dialogue that trigger them. Examples: "sword drawn from scabbard", "door slams shut", "glass shatters on stone floor", "gasp of shock", "crowd falls silent". List 1-6 items. Return [] only if the scene is entirely static with no events.

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
      "visualPrompt": "ENGLISH ONLY. Vivid 3D cartoon production prompt referencing each present character's distinctiveFeatures and appearance. Include lighting, camera angle, environment, character poses, mood, color palette. For non-Present scenes include temporal/mental-shift visual language. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition.",
      "narration": [
        "Narrator passage text in ${outputLanguageName}"
      ],
      "dialogue": [
        {
          "character": "Character name exactly as in the profile",
          "line": "Spoken words only in ${outputLanguageName}, no quotation marks"
        }
      ],
      "thoughts": [
        {
          "character": "Character name exactly as in the profile",
          "thought": "Internal thought text in ${outputLanguageName}, no quotation marks"
        }
      ],
      "actions": [
        {
          "character": "Character name exactly as in the profile, or Narrator",
          "action": "Concise present-tense physical action in ${outputLanguageName}"
        }
      ],
      "emotions": [
        {
          "character": "Character name exactly as in the profile",
          "emotion": "Short precise emotional state label in ${outputLanguageName}",
          "confidence": 0.85
        }
      ],
      "audio": {
        "backgroundAmbience": ["ambient sound 1", "ambient sound 2"],
        "backgroundMusic": "English description of musical underscore: tempo, instrumentation, emotional tone",
        "soundEffects": ["specific sound effect 1", "specific sound effect 2"]
      },
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
- Every scene MUST have all five arrays: "narration", "dialogue", "thoughts", "actions", "emotions" (use [] for empty)
- Every scene MUST have "audio" with all three fields: "backgroundAmbience", "backgroundMusic", "soundEffects"
- The five story layers are STRICTLY SEPARATED — no content item appears in more than one array
- Dialogue = audible speech only. Thoughts = silent only. Never merge them.
- Emotion confidence MUST be a float 0.00–1.00, never a string
- All audio fields are ENGLISH ONLY regardless of output language
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
