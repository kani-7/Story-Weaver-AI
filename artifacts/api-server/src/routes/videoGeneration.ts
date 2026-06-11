import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoProvider = "runway" | "kling" | "veo" | "pika" | "luma";

interface CharacterProfileRef {
  name: string;
  appearance?: string;
  distinctiveFeatures?: string;
  clothing?: string;
}

interface VideoGenerationRequestBody {
  sceneNumber: number;
  videoPrompt: string;
  provider?: VideoProvider;
  imageUrl?: string;
  duration?: 5 | 10;
  // Scene-to-Video Intelligence
  characterProfiles?: CharacterProfileRef[];
  characterVisualContinuity?: string;
  cameraMovement?: string;
  cinematicMood?: string;
  lightingStyle?: string;
  animationStyle?: string;
  dominantEmotion?: string;
  emotionalIntensity?: number;
  shotType?: string;
  pacingStyle?: string;
  // Motion Direction
  characterMovements?: string[];
  environmentalMotion?: string;
  cinematicTransition?: string;
  // Video Continuity
  clothingState?: string[];
  lightingState?: string;
  environmentState?: string;
  emotionalCarryOver?: string[];
}

interface VideoProviderResult {
  url: string;
  provider: VideoProvider;
  duration: number;
}

// ─── Scene-to-Video Intelligence ──────────────────────────────────────────────
// Builds a rich, motion-aware video prompt by synthesising all scene metadata:
// emotions, camera, mood, lighting, animation style, continuity state.

function buildMotionDirectionBlock(body: VideoGenerationRequestBody): string {
  const parts: string[] = [];

  // Camera motion
  if (body.cameraMovement) {
    const cameraMap: Record<string, string> = {
      Static: "static locked-off shot",
      "Dolly In": "smooth dolly push in toward subject",
      "Dolly Out": "slow dolly pull back revealing scene",
      "Crane Up": "majestic crane rise upward",
      Handheld: "subtle handheld shake for authenticity",
      Tracking: "smooth tracking shot following subject",
      Orbit: "cinematic orbit around subject",
    };
    parts.push(`camera motion: ${cameraMap[body.cameraMovement] ?? body.cameraMovement}`);
  }

  // Character movements from actions
  if (body.characterMovements && body.characterMovements.length > 0) {
    parts.push(`character motion: ${body.characterMovements.join(", ")}`);
  }

  // Environmental motion
  if (body.environmentalMotion) {
    parts.push(`environment: ${body.environmentalMotion}`);
  }

  // Cinematic transition
  if (body.cinematicTransition && body.cinematicTransition !== "Hard Cut") {
    const transMap: Record<string, string> = {
      "Fade In": "fade in from black",
      "Fade Out": "fade out to black",
      Dissolve: "smooth dissolve transition",
      "Match Cut": "match cut on action",
      "Dream Ripple": "rippling dream transition",
      "Iris Transition": "iris wipe transition",
    };
    parts.push(`transition: ${transMap[body.cinematicTransition] ?? body.cinematicTransition}`);
  }

  return parts.length > 0 ? parts.join("; ") : "";
}

function buildVideoContinuityBlock(body: VideoGenerationRequestBody): string {
  const parts: string[] = [];

  // Character visual continuity (appearance consistency)
  if (body.characterVisualContinuity) {
    parts.push(`character continuity: ${body.characterVisualContinuity}`);
  } else if (body.clothingState && body.clothingState.length > 0) {
    parts.push(`clothing state: ${body.clothingState.join(", ")}`);
  }

  // Lighting continuity
  if (body.lightingState) {
    parts.push(`lighting: ${body.lightingState}`);
  }

  // Environment continuity
  if (body.environmentState) {
    parts.push(`environment: ${body.environmentState}`);
  }

  // Emotional continuity
  if (body.emotionalCarryOver && body.emotionalCarryOver.length > 0) {
    parts.push(`emotional carry: ${body.emotionalCarryOver.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("; ") : "";
}

function buildCharacterVisualBlock(body: VideoGenerationRequestBody): string {
  if (!body.characterProfiles || body.characterProfiles.length === 0) return "";
  return body.characterProfiles
    .map((c) => {
      const attrs = [c.appearance, c.distinctiveFeatures, c.clothing].filter(Boolean);
      return `[${c.name}: ${attrs.join(", ")}]`;
    })
    .join(" ");
}

function buildEnhancedVideoPrompt(body: VideoGenerationRequestBody): string {
  const sections: string[] = [];

  // 1. Base scene prompt
  sections.push(body.videoPrompt.trim());

  // 2. Cinematic context
  const cinematic: string[] = [];
  if (body.cinematicMood) cinematic.push(`mood: ${body.cinematicMood}`);
  if (body.lightingStyle) cinematic.push(`lighting: ${body.lightingStyle}`);
  if (body.animationStyle) cinematic.push(`style: ${body.animationStyle}`);
  if (body.shotType) cinematic.push(`shot: ${body.shotType}`);
  if (body.pacingStyle) cinematic.push(`pacing: ${body.pacingStyle}`);
  if (cinematic.length > 0) sections.push(cinematic.join(", "));

  // 3. Emotional direction
  if (body.dominantEmotion) {
    const intensity = body.emotionalIntensity ?? 0.5;
    const intensityLabel =
      intensity >= 0.8 ? "intense" : intensity >= 0.5 ? "moderate" : "subtle";
    sections.push(`emotional tone: ${intensityLabel} ${body.dominantEmotion}`);
  }

  // 4. Motion direction block
  const motion = buildMotionDirectionBlock(body);
  if (motion) sections.push(motion);

  // 5. Character visual references
  const charBlock = buildCharacterVisualBlock(body);
  if (charBlock) sections.push(`characters: ${charBlock}`);

  // 6. Video continuity block
  const continuity = buildVideoContinuityBlock(body);
  if (continuity) sections.push(continuity);

  return sections.join(". ");
}

// ─── Provider: Luma AI Dream Machine ──────────────────────────────────────────

async function generateWithLuma(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["LUMAAI_API_KEY"];
  if (!apiKey) throw new Error("LUMAAI_API_KEY is not set");

  const body: Record<string, unknown> = {
    prompt: prompt.slice(0, 2000),
    aspect_ratio: "16:9",
    loop: false,
  };

  if (imageUrl) {
    body.keyframes = {
      frame0: { type: "image", url: imageUrl },
    };
  }

  const createRes = await fetch(
    "https://api.lumaai.com/dream-machine/v1/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Luma AI error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id: string; state: string };

  // Poll for completion
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(
      `https://api.lumaai.com/dream-machine/v1/generations/${created.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      state: string;
      failure_reason?: string;
      assets?: { video?: string };
    };

    if (poll.state === "completed" && poll.assets?.video) {
      return { url: poll.assets.video, provider: "luma", duration };
    }
    if (poll.state === "failed") {
      throw new Error(`Luma AI generation failed: ${poll.failure_reason ?? "unknown"}`);
    }
  }

  throw new Error("Luma AI generation timed out after 200s");
}

// ─── Provider: Runway Gen-4 ───────────────────────────────────────────────────

async function generateWithRunway(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["RUNWAY_API_KEY"];
  if (!apiKey) throw new Error("RUNWAY_API_KEY is not set");

  const endpoint = imageUrl
    ? "https://api.dev.runwayml.com/v1/image_to_video"
    : "https://api.dev.runwayml.com/v1/text_to_video";

  const reqBody: Record<string, unknown> = {
    model: "gen4_turbo",
    promptText: prompt.slice(0, 1000),
    duration,
    ratio: "1280:720",
  };
  if (imageUrl) reqBody.promptImage = imageUrl;

  const createRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Runway error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id: string };

  // Poll for task completion
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${created.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": "2024-11-06",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      status: string;
      output?: string[];
      failure?: string;
    };

    if (poll.status === "SUCCEEDED" && poll.output?.[0]) {
      return { url: poll.output[0], provider: "runway", duration };
    }
    if (poll.status === "FAILED") {
      throw new Error(`Runway task failed: ${poll.failure ?? "unknown"}`);
    }
  }

  throw new Error("Runway generation timed out after 200s");
}

// ─── Provider: Kling AI ───────────────────────────────────────────────────────

async function generateWithKling(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const accessKey = process.env["KLING_ACCESS_KEY"];
  const secretKey = process.env["KLING_SECRET_KEY"];
  if (!accessKey || !secretKey) throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY are required");

  const { createHmac } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })
  ).toString("base64url");
  const sig = createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");
  const token = `${header}.${payload}.${sig}`;

  const endpoint = imageUrl
    ? "https://api.klingai.com/v1/videos/image2video"
    : "https://api.klingai.com/v1/videos/text2video";

  const reqBody: Record<string, unknown> = {
    prompt: prompt.slice(0, 2500),
    model_name: "kling-v1",
    mode: "std",
    duration: String(duration),
    cfg_scale: 0.5,
  };
  if (imageUrl) reqBody.image_url = imageUrl;

  const createRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Kling error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { data?: { task_id?: string } };
  const taskId = created.data?.task_id;
  if (!taskId) throw new Error("Kling returned no task_id");

  const pollEndpoint = imageUrl
    ? `https://api.klingai.com/v1/videos/image2video/${taskId}`
    : `https://api.klingai.com/v1/videos/text2video/${taskId}`;

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    // Refresh token
    const now2 = Math.floor(Date.now() / 1000);
    const p2 = Buffer.from(
      JSON.stringify({ iss: accessKey, exp: now2 + 1800, nbf: now2 - 5 })
    ).toString("base64url");
    const sig2 = createHmac("sha256", secretKey)
      .update(`${header}.${p2}`)
      .digest("base64url");
    const token2 = `${header}.${p2}.${sig2}`;

    const pollRes = await fetch(pollEndpoint, {
      headers: { Authorization: `Bearer ${token2}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      data?: {
        task_status?: string;
        task_result?: { videos?: Array<{ url: string; duration: string }> };
      };
    };

    const status = poll.data?.task_status;
    if (status === "succeed" && poll.data?.task_result?.videos?.[0]?.url) {
      const vid = poll.data.task_result.videos[0];
      return {
        url: vid.url,
        provider: "kling",
        duration: parseFloat(vid.duration) || duration,
      };
    }
    if (status === "failed") throw new Error("Kling generation failed");
  }

  throw new Error("Kling generation timed out after 200s");
}

// ─── Provider: Pika ───────────────────────────────────────────────────────────

async function generateWithPika(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["PIKA_API_KEY"];
  if (!apiKey) throw new Error("PIKA_API_KEY is not set");

  const reqBody: Record<string, unknown> = {
    promptText: prompt.slice(0, 1500),
    options: {
      aspectRatio: "16:9",
      duration,
      frameRate: 24,
      resolution: "1080p",
    },
  };
  if (imageUrl) reqBody.image = imageUrl;

  const createRes = await fetch("https://api.pika.art/v1/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Pika error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id?: string; taskId?: string };
  const taskId = created.id ?? created.taskId;
  if (!taskId) throw new Error("Pika returned no task id");

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`https://api.pika.art/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      status?: string;
      state?: string;
      video?: { url?: string };
      output?: { url?: string };
    };

    const status = poll.status ?? poll.state;
    const url = poll.video?.url ?? poll.output?.url;

    if ((status === "completed" || status === "succeeded") && url) {
      return { url, provider: "pika", duration };
    }
    if (status === "failed" || status === "error") {
      throw new Error("Pika generation failed");
    }
  }

  throw new Error("Pika generation timed out after 200s");
}

// ─── Provider: Veo (Google) ───────────────────────────────────────────────────

async function generateWithVeo(
  prompt: string,
  _imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["VEO_API_KEY"] ?? process.env["GOOGLE_AI_API_KEY"];
  if (!apiKey) throw new Error("VEO_API_KEY (or GOOGLE_AI_API_KEY) is not set");

  // Veo 2 via Google AI Developer API
  const createRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt.slice(0, 1000) }],
        parameters: {
          aspectRatio: "16:9",
          durationSeconds: duration,
          personGeneration: "allow_adults",
          numberOfVideos: 1,
        },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Veo error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { name?: string };
  const operationName = created.name;
  if (!operationName) throw new Error("Veo returned no operation name");

  // Poll long-running operation
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      done?: boolean;
      error?: { message: string };
      response?: { predictions?: Array<{ video?: { uri?: string; mimeType?: string } }> };
    };

    if (poll.error) throw new Error(`Veo operation error: ${poll.error.message}`);

    if (poll.done && poll.response?.predictions?.[0]?.video?.uri) {
      return {
        url: poll.response.predictions[0].video.uri,
        provider: "veo",
        duration,
      };
    }
  }

  throw new Error("Veo generation timed out after 200s");
}

// ─── Provider Router ──────────────────────────────────────────────────────────

async function generateVideo(
  provider: VideoProvider,
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  switch (provider) {
    case "runway":
      return generateWithRunway(prompt, imageUrl, duration);
    case "kling":
      return generateWithKling(prompt, imageUrl, duration);
    case "veo":
      return generateWithVeo(prompt, imageUrl, duration);
    case "pika":
      return generateWithPika(prompt, imageUrl, duration);
    case "luma":
    default:
      return generateWithLuma(prompt, imageUrl, duration);
  }
}

// ─── In-memory dedup (keyed by sceneNumber + provider) ────────────────────────

const inFlightVideoRequests = new Map<string, Promise<VideoProviderResult>>();

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/storyboard/generate-video", async (req, res): Promise<void> => {
  const body = req.body as VideoGenerationRequestBody;

  if (!body.sceneNumber || !body.videoPrompt) {
    res.status(400).json({ error: "sceneNumber and videoPrompt are required" });
    return;
  }

  const provider: VideoProvider = body.provider ?? "luma";
  const validProviders: VideoProvider[] = ["runway", "kling", "veo", "pika", "luma"];
  if (!validProviders.includes(provider)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` });
    return;
  }

  const duration = body.duration ?? 5;
  const dedupeKey = `video-scene-${body.sceneNumber}-${provider}`;
  const enhancedPrompt = buildEnhancedVideoPrompt(body);
  const startTime = Date.now();

  let generationPromise = inFlightVideoRequests.get(dedupeKey);
  if (!generationPromise) {
    generationPromise = generateVideo(provider, enhancedPrompt, body.imageUrl, duration).finally(
      () => { inFlightVideoRequests.delete(dedupeKey); }
    );
    inFlightVideoRequests.set(dedupeKey, generationPromise);
  }

  try {
    const result = await generationPromise;

    res.json({
      videoStatus: "success",
      videoUrl: result.url,
      videoProvider: result.provider,
      videoDuration: result.duration,
      generationProgress: 100,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown video generation error";

    res.json({
      videoStatus: "error",
      videoProvider: provider,
      videoDuration: 0,
      generationProgress: 0,
      generationError: errorMsg,
    });
  }
});

export default router;
