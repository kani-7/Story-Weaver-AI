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

  const prompt = `You are a professional storyboard director and visual storyteller. Analyze the following story and produce a structured storyboard.

Story:
"""
${story}
"""

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "A short cinematic title for this story",
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief physical and personality description"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Short scene title",
      "description": "2-3 sentences describing what happens in this scene",
      "characters": ["Character Name 1", "Character Name 2"],
      "visualPrompt": "A detailed 3D cartoon visual prompt for this scene. Describe lighting, camera angle, environment, character poses, mood, color palette. Style: vibrant 3D cartoon render, Pixar-inspired, cinematic composition, dramatic lighting."
    }
  ]
}

Rules:
- Extract all named or described characters from the story
- Divide the story into 3-8 meaningful scenes
- Each visual prompt must be vivid, specific, and 40-80 words long
- Visual prompts should specify: 3D cartoon style, lighting type, camera angle, environment details, character expressions and poses, color palette
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
