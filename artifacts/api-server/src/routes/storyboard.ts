import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { AnalyzeStoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
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

  const {
    story,
    storyLanguage = "auto",
    directorNotesLanguage = "en",
  } = parsed.data;

  const directorNotesLanguageName = LANG_NAMES[directorNotesLanguage] ?? "English";

  const storyLanguageInstruction =
    storyLanguage === "auto" || !storyLanguage
      ? `Detect the language of the story automatically. The story may be written in Sinhala (සිංහල), Tamil (தமிழ்), English, or any other language.`
      : `The user has explicitly selected "${LANG_NAMES[storyLanguage] ?? storyLanguage}" as the story language. Treat the story as written in that language.`;

  const prompt = `You are a professional storyboard director and visual storyteller with full multilingual capability. Analyze the following story and produce a structured storyboard.

STORY LANGUAGE RULES (highest priority):
1. ${storyLanguageInstruction}
2. You MUST write ALL output fields — title, character names, character descriptions, scene titles, scene descriptions, and thoughts — in the EXACT SAME LANGUAGE as the story (or the explicitly selected story language above).
3. Do NOT translate those fields into English or any other language unless the story is already in English.
4. For Sinhala: preserve all Sinhala Unicode characters (U+0D80–U+0DFF) exactly. Do not romanize or transliterate.
5. For Tamil: preserve all Tamil Unicode characters (U+0B80–U+0BFF) exactly. Do not romanize or transliterate.
6. Character names MUST be written exactly as they appear in the story — same script, same spelling, no transliteration.

DIRECTOR NOTES LANGUAGE (independent rule — controls visualPrompt only):
- The "visualPrompt" field MUST be written in ${directorNotesLanguageName}, regardless of the story language.
- All other fields (title, character names, descriptions, scene titles, scene descriptions, thoughts) remain in the story's language.
- If ${directorNotesLanguageName} is Sinhala or Tamil, preserve their Unicode characters exactly in the visualPrompt too.

Story:
"""
${story}
"""

INTERNAL THOUGHT DETECTION RULES:
- Quoted text is NOT always spoken dialogue. Carefully decide whether each quoted passage is spoken aloud or is a private thought inside a character's mind.
- A passage is an Internal Thought when: the narration says the character "thought", "wondered", "asked himself/herself", "realized", "felt", "said to himself/herself", or similar — OR when the context clearly shows the character is not speaking aloud.
- A passage is Dialogue when: the character physically speaks to another character, calls out, shouts, replies, or says something aloud.
- Internal Thoughts must be classified separately from Dialogue. Do not merge them together.
- Each scene's "thoughts" array must list every Internal Thought that occurs in that scene, with the exact character who thought it.
- If a scene has no Internal Thoughts, return an empty array: "thoughts": []

CHARACTER CONSISTENCY PROFILE RULES:
- Before generating scenes, build a complete Character Consistency Profile for EVERY named or described character.
- Each profile MUST include: characterId, name, species, appearance, clothing, personality, distinctiveFeatures.
- characterId: a short unique slug in English lowercase (e.g. "fox", "old-man", "queen"). Never reuse the same id for different characters.
- name: the character's name exactly as it appears in the story (same script, same spelling).
- species: the character's species or type (e.g. "Fox", "Human", "Dragon", "Robot"). Use the story's language.
- appearance: 1-2 sentences describing build, face, eyes, fur/skin/hair color, and overall look. Use the story's language.
- clothing: describe garments, accessories, footwear if mentioned or clearly implied. Write "—" only if the character has no clothing and none is implied. Use the story's language.
- personality: 1-2 sentences on temperament, values, and how they act under pressure. Use the story's language.
- distinctiveFeatures: 1 sentence listing unique visual markers (scars, patterns, markings, unusual eyes, etc.) that must appear consistently in every scene. Use the story's language.
- These profiles are the ground truth. Every scene's visualPrompt MUST reference the character's distinctiveFeatures and appearance for any character present in that scene, ensuring visual consistency across all scenes.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "A short cinematic title for this story (in the story's language)",
  "characters": [
    {
      "characterId": "unique-slug",
      "name": "Character name exactly as it appears in the story",
      "species": "Species or character type (in the story's language)",
      "appearance": "Build, face, coloring, and overall look (in the story's language)",
      "clothing": "Garments and accessories, or — if none",
      "personality": "Temperament and behavioral traits (in the story's language)",
      "distinctiveFeatures": "Unique visual markers that must appear in every scene (in the story's language)"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Short scene title (in the story's language)",
      "description": "2-3 sentences describing what happens in this scene (in the story's language)",
      "characters": ["Character name 1", "Character name 2"],
      "visualPrompt": "A detailed visual prompt in ${directorNotesLanguageName}. MUST reference the appearance and distinctiveFeatures of every character present. Describe lighting, camera angle, environment, character poses, mood, color palette. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition, dramatic lighting.",
      "thoughts": [
        {
          "character": "Character name exactly as in the story",
          "thought": "The exact internal thought text, in the story's language"
        }
      ]
    }
  ]
}

Rules:
- Extract all named or described characters; give each a unique characterId
- Divide the story into 3-8 meaningful scenes
- Each visual prompt must be vivid, specific, and 40-80 words long, and must include the character's distinctiveFeatures for every character present in that scene
- Visual prompts should specify: 3D cartoon style, lighting type, camera angle, environment details, character expressions and poses, color palette
- Every scene MUST include a "thoughts" field (empty array if no internal thoughts in that scene)
- Scene "characters" arrays must use the EXACT same name spelling as in the character profiles
- Preserve all Unicode characters exactly — never escape, romanize, or drop non-ASCII characters
- Return ONLY the JSON object, nothing else
- The JSON must be valid UTF-8 encoded with all original script characters intact`;

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
