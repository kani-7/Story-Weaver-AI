import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { AnalyzeStoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/storyboard/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { story } = parsed.data;

  const prompt = `You are a professional storyboard director and visual storyteller with full multilingual capability. Analyze the following story and produce a structured storyboard.

LANGUAGE DETECTION AND RESPONSE RULES (highest priority):
1. Detect the language of the story automatically before doing anything else.
2. The story may be written in Sinhala (සිංහල), Tamil (தமிழ்), English, or any other language.
3. You MUST write ALL output fields — title, character names, character descriptions, scene titles, scene descriptions, and visualPrompt — in the EXACT SAME LANGUAGE as the input story.
4. Do NOT translate the story or any output into English or any other language unless the input story is already in English.
5. For Sinhala stories: preserve all Sinhala Unicode characters (U+0D80–U+0DFF) exactly. Do not romanize or transliterate.
6. For Tamil stories: preserve all Tamil Unicode characters (U+0B80–U+0BFF) exactly. Do not romanize or transliterate.
7. Character names must be written exactly as they appear in the story (same script, same spelling).
8. The visualPrompt field must also be written in the story's language. It should describe the visual scene richly enough for an artist to illustrate it.

Story:
"""
${story}
"""

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "A short cinematic title for this story (in the story's language)",
  "characters": [
    {
      "name": "Character name exactly as it appears in the story",
      "description": "Brief physical and personality description (in the story's language)"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Short scene title (in the story's language)",
      "description": "2-3 sentences describing what happens in this scene (in the story's language)",
      "characters": ["Character name 1", "Character name 2"],
      "visualPrompt": "A detailed visual prompt for this scene in the story's language. Describe lighting, camera angle, environment, character poses, mood, color palette. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition, dramatic lighting."
    }
  ]
}

Rules:
- Extract all named or described characters from the story
- Divide the story into 3-8 meaningful scenes
- Each visual prompt must be vivid, specific, and 40-80 words long
- Visual prompts should specify: 3D cartoon style, lighting type, camera angle, environment details, character expressions and poses, color palette
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
