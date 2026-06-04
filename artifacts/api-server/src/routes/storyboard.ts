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
- All fields marked ENGLISH ONLY must never contain any other language regardless of the output language setting.

═══════════════════════════════════════════════
LAYER 3 — OUTPUT LANGUAGE (user-selected: ${outputLanguageName})
═══════════════════════════════════════════════
- ALL human-readable output fields — title, species, appearance, clothing, personality, distinctiveFeatures, scene titles, scene descriptions, narration, dialogue, thoughts, internalMonologue, actions, emotions — MUST be written in ${outputLanguageName}.
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

Field-by-field requirements (ALL fields mandatory):

• characterId — English lowercase hyphenated slug, 1-3 words, unique across all characters (e.g. "silver-fox", "old-keeper"). Never reuse.

• name — The character's name adapted to ${outputLanguageName}. Use this identical spelling in every scene's "characters" array.

• species — The character's species or archetype in ${outputLanguageName}. One noun phrase only.

• appearance — 3-4 sentences covering height/build, face/eyes, coloring/texture, and one striking first impression. Precise enough that an artist can draw this character without follow-up questions. In ${outputLanguageName}.

• clothing — Garments, accessories, footwear, and carried items with colors and condition. Write "—" ONLY if the character genuinely has no clothing. In ${outputLanguageName}.

• personality — 2-3 sentences: core motivation, emotional baseline, behavioral tell under pressure. In ${outputLanguageName}.

• distinctiveFeatures — Exactly 2-4 specific, artist-reproducible visual markers as short precise phrases. These EXACT markers must appear verbatim in every visualPrompt where this character appears. In ${outputLanguageName}.

• voiceStyle — ENGLISH ONLY. One vivid sentence describing how this character sounds: pitch (deep/mid/high), tempo (slow/rapid/deliberate), texture (gravelly/smooth/breathy/nasal), any implied accent or regional quality, and emotional delivery style (measured/volatile/sardonic/earnest/detached). A voice actor must be able to use this directly.

═══════════════════════════════════════════════
SCENE TYPE DETECTION RULES
═══════════════════════════════════════════════
Every scene MUST be assigned exactly one sceneType: "Present", "Flashback", "Dream", or "Imagination".

- "Present": Current narrative timeline. Default when no shift detected.
- "Flashback": Past event, memory, or recollection. Detect via past-tense step-back, "remembered", "recalled", "years ago", "when he/she was young", etc.
- "Dream": Occurs within a character's dream or sleep state. Detect via: character sleeping then experiencing events, surreal imagery in sleep context, waking up from depicted events.
- "Imagination": Active imagination or hypothetical mental projection while awake. Detect via: "imagined", "pictured", "fantasized", "what if", "envisioned".

EXTRA FIELDS for non-Present scenes (Flashback/Dream/Imagination):
- flashbackIndicator (ENGLISH ONLY): On-screen text card marking the shift. Under 6 words. E.g. "Five Years Earlier", "In Her Memory", "A Dream".
- transitionInstructions (ENGLISH ONLY): Precise cinematic technique for ENTERING this scene. Specific enough for a director of photography.
- returnToPresentInstructions (ENGLISH ONLY): Precise cinematic technique for EXITING back to present. Specific enough for a director of photography.

VISUAL STYLE for non-Present scenes (ENGLISH ONLY):
For "Flashback" scenes add:
- flashbackVisualStyle: Color grade, film treatment, camera characteristics. E.g. "Warm sepia wash, 8mm film grain, softened edges with halation glow, shallow depth of field on faces; a subtle flicker every 3-4 seconds suggests archival footage."
- flashbackAudioStyle: Audio treatment suggesting memory. E.g. "All dialogue carries a slight reverb as if heard across a room; music is high-pass filtered removing bass; background ambience reduced to 20% normal level; a faint tape hiss underlies the entire scene."

For "Dream" scenes add:
- dreamVisualStyle: Visual treatment distinguishing the dream from reality. E.g. "Oversaturated, hyper-real color palette; architecture bends at impossible angles; characters cast no shadows; lens flares bloom unpredictably; slow-motion applied to emotionally charged moments."
- dreamAudioStyle: Audio treatment inside the dream. E.g. "Dialogue arrives 0.5 seconds delayed from lip movement; ambient sounds loop with slight pitch shift each cycle; music is atonal with sudden swells of clarity; the dreaming character's own voice sounds abnormally present and intimate."

DIRECTOR'S NOTE (visualPrompt) RULES FOR NON-PRESENT SCENES:
- Flashback: include color grade, film grain level, and framing style.
- Dream: describe the surreal, heightened, or distorted visual language.
- Imagination: describe how the imagined world visually differs from the present.

═══════════════════════════════════════════════
STORY INTELLIGENCE EXTRACTION RULES
═══════════════════════════════════════════════
For every scene, extract and strictly separate the story into SIX distinct layers. Never mix categories.

── NARRATION ──
Definition: Pure storytelling text from an external narrator. Descriptive prose setting the scene, providing context, advancing the story from outside any character's perspective.
Detect: Text NOT inside quotation marks, NOT attributed to a character, describes the world from third-person or omniscient viewpoint.
Format: Array of plain strings. Each entry is one continuous narrator passage.
Return [] if no narrator text.

── DIALOGUE ──
Definition: Words a character physically speaks aloud to another character or to the room. Actual audible communication.
Detect: Text in quotation marks where narrative says "said", "asked", "replied", "shouted", "whispered", "called out", or any verb of speaking.
Critical rule: Do NOT include internal thoughts here, even if in quotation marks. A character "saying to himself" silently is a Thought, not Dialogue.
Format: Array of objects with "character" (exact name from profile) and "line" (spoken words only, no quotation marks).
Return [] if no spoken dialogue.

── THOUGHTS ──
Definition: A character's brief, reactive, single-moment private reflection or unspoken feeling. Never heard by others.
Detect: "thought", "wondered", "realized", "felt", "said to himself/herself", "mused" — where the character is not speaking aloud.
Critical rule: Do NOT duplicate here anything in Dialogue. Thoughts = brief, reactive, single-moment. Do NOT include extended inner voice passages (those go in Internal Monologue).
Format: Array of objects with "character" and "thought".
Return [] if no brief internal thoughts.

── INTERNAL MONOLOGUE ──
Definition: Extended stream-of-consciousness where a character narrates their own experience from the inside — a flowing inner voice that may be fragmented, self-contradictory, or emotionally raw.
Detect: Extended passages simulating a character's ongoing inner dialogue with themselves: self-questioning, inner bargaining, replaying events in the mind, self-coaching under pressure, or any extended first-person inner narrative attributed to a character. These are longer and more sustained than Thoughts.
Critical rule: Do NOT duplicate here anything in Thoughts. Thoughts = brief, reactive. Internal Monologue = extended, flowing, self-directed inner voice. Return [] if only brief thoughts are present.
Format: Array of objects with "character" (exact name from profile) and "monologue" (inner voice passage in ${outputLanguageName}, no quotation marks, may be fragmented or elliptical).
Return [] if no internal monologue is present.

── ACTIONS ──
Definition: Physical actions, movements, or behaviors performed by NAMED characters. What the body does.
Detect: Verbs of physical activity — running, reaching, drawing a weapon, opening a door, falling, embracing, trembling, picking up objects.
Critical rule: ONLY named characters from the character profiles may appear in the "character" field. Do NOT use "Narrator" in actions. If an environmental event has no specific actor, omit it.
Format: Array of objects with "character" (exact name from profile ONLY) and "action" (concise present-tense description).
Return [] if no physical actions by named characters.

── EMOTIONS ──
Definition: Emotional states or feelings experienced by characters, detected from narration, behavior, or internal thought.
Detect: Explicit emotion words, implied emotions from behavior (hands trembling → fear; jaw clenched → anger), or emotional atmosphere.
Format: Array of objects with:
  - "character": exact name from profile
  - "emotion": short, precise label (e.g. "grief", "quiet determination", "fearful anticipation")
  - "confidence": float 0.00–1.00. Use 0.90–1.00 for explicitly stated emotions, 0.60–0.89 for clearly implied, 0.30–0.59 for inferred from subtle cues. Never use exactly 0 or 1.
Return [] if no emotions can be clearly detected.

── AUDIO INTELLIGENCE ──
Definition: Sound design specifications for this scene. All audio fields ENGLISH ONLY.
- "backgroundAmbience": Array of 2-5 concise strings naming continuous environmental sounds. For Flashback: softer, muted versions. For Dream: ethereal or distorted.
- "backgroundMusic": One string — tempo, instrumentation, emotional tone, genre reference. For Flashback: warped or echoed. For Dream: atonal or surreal.
- "soundEffects": Array of 1-6 specific event-triggered sound effects. Return [] only if scene is entirely static.

── CONTINUITY CHECK ──
Definition: A script supervisor's continuity review of this scene.
Examine: Character presence logic, prop/object tracking, spatial consistency, temporal consistency, costume/appearance consistency with profiles.
Format: Object with:
  - "status": "Pass" if no issues, "Warning" if minor issues or ambiguities, "Fail" if a clear continuity error exists
  - "issues": Array of concise English strings describing each issue. Return [] if status is "Pass".

═══════════════════════════════════════════════
PRODUCTION ASSESSMENT
═══════════════════════════════════════════════
After analyzing all scenes, generate two top-level assessment fields:

"productionReadinessScore": Integer 0–100 measuring overall production readiness. Consider: scene count and pacing, character depth and distinctiveness, dialogue quality, visual describability, structural completeness (setup/conflict/resolution), audio design richness, continuity cleanliness. Calibrate: 90–100 = festival-ready; 70–89 = solid draft needing polish; 50–69 = promising but incomplete; below 50 = significant development needed.

"movieReadinessReport": Object with:
  - "strengths": Array of 2–5 English strings, each naming one specific strength of this story as a film project.
  - "weaknesses": Array of 1–4 English strings, each naming one specific weakness or underdeveloped element.
  - "missingElements": Array of 0–3 English strings naming specific story elements that would strengthen the film but are absent (e.g. "antagonist motivation", "second-act midpoint reversal").
  - "productionNotes": Single English paragraph (2–4 sentences) of practical production advice — budget implications, visual style recommendations, tone guidance, or casting considerations.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "A short cinematic title in ${outputLanguageName}",
  "characters": [
    {
      "characterId": "english-lowercase-slug",
      "name": "Character name in ${outputLanguageName}",
      "species": "Species or archetype in ${outputLanguageName}",
      "appearance": "3-4 sentences in ${outputLanguageName}",
      "clothing": "Garments and accessories in ${outputLanguageName}, or —",
      "personality": "2-3 sentences in ${outputLanguageName}",
      "distinctiveFeatures": "2-4 precise markers in ${outputLanguageName}",
      "voiceStyle": "ENGLISH ONLY. One sentence: pitch, tempo, texture, accent, delivery style."
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneType": "Present",
      "title": "Short scene title in ${outputLanguageName}",
      "description": "2-3 sentences in ${outputLanguageName}",
      "characters": ["Character name exactly as in the profile"],
      "visualPrompt": "ENGLISH ONLY. 40-80 words. Vivid 3D cartoon production prompt referencing each present character's distinctiveFeatures. Include lighting, camera angle, environment, poses, mood, color palette. Non-Present scenes include temporal/mental visual language. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition.",
      "narration": ["Narrator passage in ${outputLanguageName}"],
      "dialogue": [
        { "character": "Exact name from profile", "line": "Spoken words in ${outputLanguageName}, no quotation marks" }
      ],
      "thoughts": [
        { "character": "Exact name from profile", "thought": "Brief internal reflection in ${outputLanguageName}, no quotation marks" }
      ],
      "internalMonologue": [
        { "character": "Exact name from profile", "monologue": "Extended inner voice passage in ${outputLanguageName}, no quotation marks, may be fragmented" }
      ],
      "actions": [
        { "character": "Named character ONLY — no Narrator", "action": "Concise present-tense physical action in ${outputLanguageName}" }
      ],
      "emotions": [
        { "character": "Exact name from profile", "emotion": "Precise emotional state in ${outputLanguageName}", "confidence": 0.85 }
      ],
      "audio": {
        "backgroundAmbience": ["ambient sound 1", "ambient sound 2"],
        "backgroundMusic": "ENGLISH ONLY: tempo, instrumentation, emotional tone",
        "soundEffects": ["specific sound effect 1"]
      },
      "continuityCheck": {
        "status": "Pass",
        "issues": []
      },
      "flashbackVisualStyle": "ONLY for Flashback scenes — ENGLISH ONLY color grade, film treatment, camera characteristics. Omit for Present/Dream/Imagination.",
      "flashbackAudioStyle": "ONLY for Flashback scenes — ENGLISH ONLY audio treatment. Omit for Present/Dream/Imagination.",
      "dreamVisualStyle": "ONLY for Dream scenes — ENGLISH ONLY visual treatment. Omit for Present/Flashback/Imagination.",
      "dreamAudioStyle": "ONLY for Dream scenes — ENGLISH ONLY audio treatment. Omit for Present/Flashback/Imagination.",
      "flashbackIndicator": "ONLY for Flashback/Dream/Imagination — English on-screen text card. Omit for Present.",
      "transitionInstructions": "ONLY for Flashback/Dream/Imagination — ENGLISH ONLY cinematic entry. Omit for Present.",
      "returnToPresentInstructions": "ONLY for Flashback/Dream/Imagination — ENGLISH ONLY cinematic exit. Omit for Present."
    }
  ],
  "productionReadinessScore": 85,
  "movieReadinessReport": {
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "weaknesses": ["Specific weakness 1"],
    "missingElements": ["Missing element if any"],
    "productionNotes": "ENGLISH ONLY. 2-4 sentence paragraph of practical production advice."
  }
}

Final rules:
- Extract all named or described characters; give each a unique English characterId
- Divide the story into 3-8 meaningful scenes
- Every scene MUST have "sceneType" — default "Present" when no shift detected
- Every scene MUST have all SIX arrays: "narration", "dialogue", "thoughts", "internalMonologue", "actions", "emotions" (use [] for empty)
- Every scene MUST have "audio" with all three fields
- Every scene MUST have "continuityCheck" with "status" and "issues"
- The SIX story layers are STRICTLY SEPARATED — no content appears in more than one layer
- Dialogue = audible speech only. Thoughts = brief reactive silent reflection. Internal Monologue = extended inner voice. Never merge.
- Actions MUST only contain named characters from the profile. NEVER use "Narrator" in actions.
- Emotion confidence MUST be a float 0.00–1.00, never a string
- All audio, continuity, voiceStyle, visual style, and production assessment fields are ENGLISH ONLY
- Flashback scenes MUST include flashbackVisualStyle and flashbackAudioStyle; Dream scenes MUST include dreamVisualStyle and dreamAudioStyle
- Present and Imagination scenes MUST NOT include flashbackVisualStyle, flashbackAudioStyle, dreamVisualStyle, or dreamAudioStyle
- Flashback/Dream/Imagination scenes MUST include flashbackIndicator, transitionInstructions, returnToPresentInstructions
- Present scenes MUST NOT include those three fields
- Each visualPrompt: English only, 40-80 words, vivid, references character distinctiveFeatures
- Scene "characters" arrays MUST use the EXACT same name as in the character profile
- Output language Unicode must be preserved exactly — never escape, romanize, or drop characters
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 16384, responseMimeType: "application/json" },
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
