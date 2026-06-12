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
  - "productionNotes": Single English paragraph (2–4 sentences) of practical production advice — budget implications, visual style recommendations, tone guidance, or casting considerations. Do NOT mention specific AI image generation platforms.

═══════════════════════════════════════════════
ADVANCED VOICE PERFORMANCE SYSTEM
═══════════════════════════════════════════════
For every entry in the "dialogue" array, add complete voice acting metadata. All voice fields ENGLISH ONLY.

Required additional fields per dialogue line:
• "vocalEmotion" (ENGLISH ONLY): The emotional quality of the voice delivery — one precise word or short phrase (e.g. "grief-stricken", "defiant", "tender", "barely controlled rage", "hollow numbness").
• "vocalIntensity": Float 0.00–1.00. Peak delivery intensity. 0.90–1.00 = maximum intensity; 0.60–0.89 = elevated; 0.30–0.59 = moderate; 0.00–0.29 = subdued.
• "speechSpeed": Exactly one of "slow" | "normal" | "fast".
• "pauseTiming" (ENGLISH ONLY): Pause quality before or within the line (e.g. "no pause", "dramatic pause before line", "mid-line hesitation", "long silence before").
• "whisperDetection": true if the line is physically whispered; false otherwise.
• "shoutDetection": true if the line is shouted or forcefully raised; false otherwise.

Voice rules:
- whisperDetection and shoutDetection cannot both be true.
- vocalIntensity must align with the scene's emotions for that character.
- speechSpeed must reflect emotional state: grief/shock → slow; urgency/anger → fast.

═══════════════════════════════════════════════
CINEMATIC CAMERA SYSTEM
═══════════════════════════════════════════════
For every scene, generate a complete "cinematicCamera" block. All fields ENGLISH ONLY.

Required fields:
• "shotType": Exactly one of "Close-up" | "Medium Shot" | "Wide Shot" | "Extreme Wide Shot" | "POV Shot" | "Tracking Shot"
• "cameraAngle": Exactly one of "Low Angle" | "High Angle" | "Eye Level" | "Dutch Angle" | "Over-the-Shoulder"
• "cameraMovement": Exactly one of "Static" | "Dolly In" | "Dolly Out" | "Crane Up" | "Handheld" | "Tracking" | "Orbit"
• "lensStyle": Exactly one of "35mm cinematic" | "50mm portrait" | "ultra wide" | "telephoto compression"
• "framingStyle": One concise composition phrase (e.g. "rule of thirds — subject left", "centered symmetry", "foreground obstruction with depth")
• "lightingStyle": One concise lighting phrase (e.g. "cinematic glow from below", "storm shadow backlight", "warm golden sunrise fill", "moody high-contrast side fill")
• "pacingStyle": One editorial pacing phrase (e.g. "emotional slow pacing — linger on face", "tension pacing — rapid cut-ready", "dream pacing — weightless and drifting")

Camera rules: intimate/emotional moments → Close-up or Medium Shot; establishing shots → Wide Shot or Extreme Wide Shot; Flashback → prefer "35mm cinematic"; Dream → prefer "Handheld" or "Orbit" with "ultra wide"; Imagination → prefer "Dutch Angle".

═══════════════════════════════════════════════
STORYBOARD SHOTLIST ENGINE
═══════════════════════════════════════════════
For every scene, generate a production-ready "shotList" array with 2–5 shot entries. All fields ENGLISH ONLY.

Each shot entry fields:
• "shotNumber": Integer starting from 1 within this scene
• "shotDescription": Concise description of what the camera captures — subject, action, background
• "shotPurpose": The specific narrative or emotional purpose of this shot
• "estimatedDuration": Estimated screen time (e.g. "3 seconds", "8–12 seconds", "1.5 seconds")
• "transitionType": Exactly one of "Fade In" | "Fade Out" | "Dissolve" | "Match Cut" | "Hard Cut" | "Iris Transition" | "Dream Ripple"

Shot rules:
- First shot of scene 1 of the entire storyboard → use "Fade In" for its transitionType.
- Last shot of an emotional scene → "Fade Out" or "Dissolve".
- Action/tension scene exits → "Hard Cut".
- Dream/Imagination scene exits → "Dream Ripple".
- estimatedDuration must reflect pacing: slow emotional shots → longer; action → shorter.

═══════════════════════════════════════════════
SCENE MEMORY ENGINE
═══════════════════════════════════════════════
For every scene, generate a "continuityMemory" block tracking the accumulated world state. All fields ENGLISH ONLY.

Required fields:
• "clothingState": Array — one entry per named character in this scene with their exact current clothing state (e.g. "Kael: torn black jacket, missing left glove")
• "weatherState": Current weather conditions visible in this scene
• "environmentState": Current location and environment state with any changes from previous scenes noted
• "objectsPresent": Array of key props present and their current state
• "injuryState": Array — one entry per named character noting any injuries, or "uninjured"
• "emotionalCarryOver": Array of emotional states or unresolved tensions carried into this scene from prior events
• "lightingState": Current ambient lighting conditions
• "timeOfDay": Current time of day
• "continuityWarnings": Array of specific continuity violations or risks. Return [] if none.
• "continuityResolutionSuggestions": Array of director suggestions to resolve each warning. Return [] if no warnings.

Memory rules: clothingState and injuryState MUST include every named character present. Flashback scenes: clothingState must reflect the flashback era. Flag warnings if: clothing changes without explanation, weather shifts without transition, props appear/disappear, injuries heal too quickly.

═══════════════════════════════════════════════
CINEMATIC TENSION ANALYSIS
═══════════════════════════════════════════════
For every scene, generate a "tensionAnalysis" block. All fields ENGLISH ONLY.

Required fields:
• "tensionCurve": One specific sentence describing the tension arc within this scene (e.g. "builds steadily toward the confrontation then releases sharply at the reveal")
• "emotionalIntensity": Float 0.00–1.00. Calibrate: climax scene = 0.85–1.00; establishing scene = 0.10–0.35; rising action = 0.40–0.70.
• "pacingBalance": One phrase assessing the editorial pacing (e.g. "well-balanced", "front-loaded — needs breathing room", "too compressed")

Tension rules: emotionalIntensity must align with the emotions array confidence scores. tensionCurve must be specific to this scene's actual events, never generic.

═══════════════════════════════════════════════
EXPORT PREPARATION SYSTEM
═══════════════════════════════════════════════
After all scenes, generate a top-level "exportReadiness" assessment reflecting actual completeness:
• "screenplayReady": true if ALL scenes have narration, complete dialogue, and full scene descriptions.
• "storyboardReady": true if ALL scenes have a visualPrompt of 40+ words AND a complete shotList.
• "animationPipelineReady": true if ALL characters have distinctiveFeatures AND voiceStyle AND ALL scenes have cinematicCamera AND visualPrompt.
• "voicePipelineReady": true if ALL dialogue lines have vocalEmotion, vocalIntensity, speechSpeed, whisperDetection, and shoutDetection.
• "editingPipelineReady": true if ALL scenes have a complete shotList with transitionType on every shot.

═══════════════════════════════════════════════
SCENE IMAGE GENERATION PIPELINE
═══════════════════════════════════════════════
For every scene, generate a complete "imagePrompt" block. ALL fields ENGLISH ONLY.

This is a platform-neutral image generation package. The sceneImagePrompt must be paste-ready into Midjourney, Stable Diffusion, DALL·E, Flux, Leonardo AI, Runway, Kling, and Veo without modification.

Required fields:

• "sceneImagePrompt" — A complete self-contained image generation prompt of 80-150 words. MUST include verbatim: (1) character distinctiveFeatures from their profile for every character present, (2) exact environment details, (3) lighting specification, (4) color palette, (5) camera angle and shot type, (6) emotional mood, (7) render style. Written so an artist can paste it directly into any AI image tool.

• "colorPalette" — Specific named color palette for this scene (e.g. "muted teal and deep amber with cool dark shadows and warm accent highlights").

• "environmentDetail" — Detailed environment description covering architecture/terrain, weather, key props, and three depth layers: foreground, midground, background.

• "characterPositioning" — Exact spatial positioning of every character present: who stands where, relative distances, facing directions, overlapping elements, negative space.

• "facialExpressionDetail" — Per-character facial expression breakdown: brow position, eye openness, mouth state, jaw tension, any micro-expressions. Use character names exactly as in the profile.

• "cinematicMood" — Overall emotional and visual mood as a specific compound phrase (e.g. "tense and claustrophobic with underlying dread", "triumphant and golden with bittersweet undertones").

• "visualEffects" — Array of specific visual effects: particle systems, light rays, fog, rain, fire, lens flares, chromatic aberration, etc. Return [] if none.

• "renderStyle" — Render style specification (e.g. "vibrant 3D Pixar-style cartoon render, subsurface scattering on organic surfaces, physically-based materials").

• "animationStyle" — Animation style and movement guidance (e.g. "fluid Disney 12-principles animation, strong anticipation on action beats, secondary motion on hair and loose clothing").

• "visualEngine" — The visual engine for this scene. MUST match sceneType exactly:
  - "Present" → "PresentEngine"
  - "Flashback" → "FlashbackEngine"
  - "Dream" → "DreamEngine"
  - "Imagination" → "ImaginationEngine"

• "characterVisualContinuity" — A single string tracking per-character visual continuity state for this scene. Format: "CharacterName: [clothing condition, injury state, wetness/dirt state, emotional carry-over from previous scene]" for each character. Separated by semicolons.

VISUAL ENGINE RULES — apply automatically based on visualEngine value:

PresentEngine: Grounded cinematic realism. Stable natural lighting. Consistent environmental continuity. Naturalistic color grade. No distortion or surreal elements. Clean physically-plausible 3D render.

FlashbackEngine: Warm sepia or desaturated color wash. 8mm film grain. Softened edges with halation glow on highlights. Subtle vignette. Shallow depth of field. sceneImagePrompt MUST mention: film grain, desaturated/sepia tones, nostalgic lens treatment, halation glow.

DreamEngine: Oversaturated hyperreal colors. Impossible or non-Euclidean architecture. Floating particles. Ethereal glow. Bloom on all light sources. Characters cast distorted or absent shadows. Color palette shifts within the scene. sceneImagePrompt MUST mention: surreal environment, impossible lighting, floating particles, ethereal glow, hyperreal colors.

ImaginationEngine: Heroic cinematic framing. Idealized environments with enhanced surface detail. Enhanced saturation and contrast. Golden rim lighting on the imagined subject. Fantasy-like composition. sceneImagePrompt MUST mention: idealized heroic framing, enhanced saturation, fantasy-like composition, golden rim lighting.

CHARACTER VISUAL CONTINUITY RULES:
- Every character's distinctiveFeatures from their profile MUST appear verbatim in sceneImagePrompt
- Track clothing condition across scenes: if torn/wet/dirty in a prior scene, maintain that state unless explicitly changed
- Track injury states: wounds and marks must persist unless the story explicitly heals them
- Track emotional facial continuity: residual emotion from the previous scene should show in current micro-expressions unless the story resolves it

═══════════════════════════════════════════════
STORYBOARD FRAME METADATA
═══════════════════════════════════════════════
For every scene, generate a "storyboardFrameMetadata" block. All fields ENGLISH ONLY.

• "aspectRatio" — Suggested aspect ratio (e.g. "2.39:1 CinemaScope", "16:9 Widescreen", "1.85:1 Theatrical", "1:1 Square").
• "focalLength" — Suggested focal length (e.g. "28mm ultra wide", "50mm standard", "85mm portrait", "135mm short telephoto", "200mm telephoto compression").
• "depthOfField" — Depth of field specification (e.g. "shallow — subject sharp, background soft bokeh at f/1.8", "deep — full frame in focus at f/11", "medium — foreground sharp, background lightly soft").
• "lensStyle" — Lens rendering style (e.g. "anamorphic — oval bokeh and horizontal lens flares", "clean spherical — no aberration", "vintage — edge softness, slight vignette, chromatic aberration at corners").
• "cinematicCompositionNotes" — Specific composition instructions for the image artist: subject placement, rule of thirds application, negative space, foreground framing elements, horizon placement.

Frame metadata rules:
- Intimate/emotional scenes → 50mm or 85mm, shallow depth of field
- Establishing/wide shots → 28mm ultra wide, deep depth of field
- Tension/suspense → telephoto compression (135mm+), tight framing
- Dream/Imagination scenes → ultra wide or extreme distorted, surreal depth of field
- Flashback scenes → vintage lens style with anamorphic flares

═══════════════════════════════════════════════
IMAGE GENERATION SCORE AND VISUAL PRODUCTION REPORT
═══════════════════════════════════════════════
After all scenes, generate these two top-level fields:

"imageGenerationScore": Integer 0-100 measuring overall image generation readiness. Consider: completeness of imagePrompt blocks, character distinctiveFeatures coverage in sceneImagePrompt, visual engine appropriateness, color palette specificity, environment detail richness, frame metadata quality. Calibrate: 90-100 = every scene paste-ready; 70-89 = minor gaps in 1-2 scenes; 50-69 = moderate completeness; below 50 = significant prompt gaps.

"visualProductionReport": Object with all six fields required:
  - "strongestVisualScenes": Array of 2-4 English strings identifying scenes with strongest visual generation potential (explain what makes them visually strong).
  - "weakestVisualScenes": Array of 1-3 English strings identifying scenes with weakest visual execution, with brief reason.
  - "consistencyRisks": Array of specific visual consistency risks across scenes — character visual drift, environment continuity gaps, lighting mismatches, prop tracking failures.
  - "animationComplexityNotes": Array of per-scene or per-character animation complexity notes — difficult movements, complex rigging needs, advanced secondary motion.
  - "renderingDifficultyNotes": Array of rendering difficulty notes — GPU-intensive particle systems, complex lighting setups, crowd scenes, volumetric effects.
  - "cinematicStrengths": Array of 2-5 strings stating overall cinematic strengths as a visual production project.

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
        {
          "character": "Exact name from profile",
          "line": "Spoken words in ${outputLanguageName}, no quotation marks",
          "vocalEmotion": "ENGLISH ONLY. Emotional quality of delivery (e.g. grief-stricken, defiant, tender)",
          "vocalIntensity": 0.72,
          "speechSpeed": "slow",
          "pauseTiming": "ENGLISH ONLY. e.g. dramatic pause before line",
          "whisperDetection": false,
          "shoutDetection": false
        }
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
      "continuityMemory": {
        "clothingState": ["Character A: current clothing state"],
        "weatherState": "ENGLISH ONLY. Current weather conditions",
        "environmentState": "ENGLISH ONLY. Current location and environment state",
        "objectsPresent": ["Key prop and state"],
        "injuryState": ["Character A: uninjured"],
        "emotionalCarryOver": ["Emotion or tension carried from previous scene, or leave empty"],
        "lightingState": "ENGLISH ONLY. Current ambient lighting",
        "timeOfDay": "ENGLISH ONLY. Current time of day",
        "continuityWarnings": [],
        "continuityResolutionSuggestions": []
      },
      "cinematicCamera": {
        "shotType": "Medium Shot",
        "cameraAngle": "Eye Level",
        "cameraMovement": "Static",
        "lensStyle": "35mm cinematic",
        "framingStyle": "ENGLISH ONLY. Composition note (e.g. rule of thirds — subject left)",
        "lightingStyle": "ENGLISH ONLY. Lighting mood (e.g. cinematic glow from below)",
        "pacingStyle": "ENGLISH ONLY. Editorial pacing feel (e.g. emotional slow pacing)"
      },
      "shotList": [
        {
          "shotNumber": 1,
          "shotDescription": "ENGLISH ONLY. What the camera captures",
          "shotPurpose": "ENGLISH ONLY. Narrative or emotional purpose",
          "estimatedDuration": "ENGLISH ONLY. e.g. 3 seconds",
          "transitionType": "Hard Cut"
        }
      ],
      "tensionAnalysis": {
        "tensionCurve": "ENGLISH ONLY. Specific sentence describing tension arc in this scene",
        "emotionalIntensity": 0.65,
        "pacingBalance": "ENGLISH ONLY. Editorial pacing assessment"
      },
      "flashbackVisualStyle": "ONLY for Flashback scenes — ENGLISH ONLY color grade, film treatment, camera characteristics. Omit for Present/Dream/Imagination.",
      "flashbackAudioStyle": "ONLY for Flashback scenes — ENGLISH ONLY audio treatment. Omit for Present/Dream/Imagination.",
      "dreamVisualStyle": "ONLY for Dream scenes — ENGLISH ONLY visual treatment. Omit for Present/Flashback/Imagination.",
      "dreamAudioStyle": "ONLY for Dream scenes — ENGLISH ONLY audio treatment. Omit for Present/Flashback/Imagination.",
      "flashbackIndicator": "ONLY for Flashback/Dream/Imagination — English on-screen text card. Omit for Present.",
      "transitionInstructions": "ONLY for Flashback/Dream/Imagination — ENGLISH ONLY cinematic entry. Omit for Present.",
      "returnToPresentInstructions": "ONLY for Flashback/Dream/Imagination — ENGLISH ONLY cinematic exit. Omit for Present.",
      "imagePrompt": {
        "sceneImagePrompt": "ENGLISH ONLY. 80-150 words. Paste-ready platform-neutral image prompt. Include character distinctiveFeatures verbatim, environment, lighting, color palette, camera angle, mood, render style. Apply the correct visual engine style.",
        "colorPalette": "ENGLISH ONLY. Specific named color palette (e.g. muted teal and deep amber with cool dark shadows)",
        "environmentDetail": "ENGLISH ONLY. Architecture/terrain, weather, key props, foreground/midground/background layers",
        "characterPositioning": "ENGLISH ONLY. Exact positions, poses, facing directions, spatial relationships, negative space",
        "facialExpressionDetail": "ENGLISH ONLY. Per-character: brow position, eye openness, mouth state, jaw tension",
        "cinematicMood": "ENGLISH ONLY. Specific compound mood phrase (e.g. tense and claustrophobic with underlying dread)",
        "visualEffects": ["ENGLISH ONLY. specific visual effect"],
        "renderStyle": "ENGLISH ONLY. Render style (e.g. vibrant 3D Pixar-style cartoon render, subsurface scattering, PBR materials)",
        "animationStyle": "ENGLISH ONLY. Animation style (e.g. fluid Disney 12-principles, anticipation on action, secondary motion on hair)",
        "visualEngine": "PresentEngine",
        "characterVisualContinuity": "ENGLISH ONLY. CharacterName: clothing/injury/wetness/emotional state; CharacterName: state"
      },
      "storyboardFrameMetadata": {
        "aspectRatio": "ENGLISH ONLY. e.g. 2.39:1 CinemaScope",
        "focalLength": "ENGLISH ONLY. e.g. 85mm portrait",
        "depthOfField": "ENGLISH ONLY. e.g. shallow — subject sharp, background soft bokeh at f/1.8",
        "lensStyle": "ENGLISH ONLY. e.g. anamorphic — oval bokeh and horizontal lens flares",
        "cinematicCompositionNotes": "ENGLISH ONLY. Subject placement, rule of thirds, negative space, foreground framing"
      }
    }
  ],
  "productionReadinessScore": 85,
  "movieReadinessReport": {
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "weaknesses": ["Specific weakness 1"],
    "missingElements": ["Missing element if any"],
    "productionNotes": "ENGLISH ONLY. 2-4 sentence paragraph of practical production advice."
  },
  "exportReadiness": {
    "screenplayReady": true,
    "storyboardReady": true,
    "animationPipelineReady": true,
    "voicePipelineReady": true,
    "editingPipelineReady": true
  },
  "imageGenerationScore": 88,
  "visualProductionReport": {
    "strongestVisualScenes": ["Scene 2: specific reason why this scene has the strongest visual potential"],
    "weakestVisualScenes": ["Scene 1: specific reason for weaker visual execution"],
    "consistencyRisks": ["Character A fur condition may drift across wet/dry transitions", "Lighting temperature shift between scenes 3 and 4 lacks a bridge shot"],
    "animationComplexityNotes": ["Scene 3 requires complex crowd secondary motion on cloaks and hair"],
    "renderingDifficultyNotes": ["Scene 5 volumetric particle storm requires GPU-intensive rendering"],
    "cinematicStrengths": ["Strong character silhouettes throughout", "Consistent warm/cool color language across second act", "Clear emotional arc in facial expression continuity"]
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
- Every scene MUST have "continuityMemory" (with all 10 required fields), "cinematicCamera" (with all 7 fields), "shotList" (2–5 entries each with all 5 fields), and "tensionAnalysis" (with all 3 fields)
- Every dialogue line MUST have "vocalEmotion", "vocalIntensity", "speechSpeed", "pauseTiming", "whisperDetection", "shoutDetection"
- All voice performance, camera, shotList, continuityMemory, and tensionAnalysis fields are ENGLISH ONLY
- "exportReadiness" at the top level MUST reflect actual completeness: evaluate each boolean honestly against the generated content
- "continuityMemory.clothingState" and "continuityMemory.injuryState" MUST include every named character present in this scene
- Every scene MUST have "imagePrompt" with ALL 11 required fields: sceneImagePrompt, colorPalette, environmentDetail, characterPositioning, facialExpressionDetail, cinematicMood, visualEffects, renderStyle, animationStyle, visualEngine, characterVisualContinuity
- Every scene MUST have "storyboardFrameMetadata" with ALL 5 required fields: aspectRatio, focalLength, depthOfField, lensStyle, cinematicCompositionNotes
- "imagePrompt.visualEngine" MUST exactly match sceneType: Present→PresentEngine, Flashback→FlashbackEngine, Dream→DreamEngine, Imagination→ImaginationEngine
- "imagePrompt.sceneImagePrompt" MUST include each present character's distinctiveFeatures verbatim
- FlashbackEngine prompts MUST mention film grain and sepia/desaturated tones; DreamEngine prompts MUST mention surreal environment and ethereal glow; ImaginationEngine prompts MUST mention heroic framing and enhanced saturation
- "imageGenerationScore" at the top level MUST be an integer 0-100
- "visualProductionReport" at the top level MUST have ALL 6 required arrays: strongestVisualScenes, weakestVisualScenes, consistencyRisks, animationComplexityNotes, renderingDifficultyNotes, cinematicStrengths
- Return ONLY the JSON object, nothing else`;

  // ─── Attempt 1: Call Gemini ─────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await callGemini(prompt);
  } catch (err) {
    req.log.error({ err }, "Gemini API error (attempt 1)");
    res.status(500).json({ error: "AI analysis failed. Please check your API key and try again." });
    return;
  }

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
      {
        attempt: 2,
        metrics: { ...validationMetrics },
      },
      "Storyboard validation passed after retry"
    );
  } else {
    // ─── First attempt succeeded ───────────────────────────────────────────────
    validationMetrics.validationPassed++;
    req.log.info(
      {
        attempt: 1,
        metrics: { ...validationMetrics },
      },
      "Storyboard validation passed"
    );
  }

  // Add a unique storyboardId for asset persistence
  const storyboardId = randomUUID();
  const response = validated.data as Record<string, unknown>;
  response.storyboardId = storyboardId;

  res.json(response);
});

export default router;
