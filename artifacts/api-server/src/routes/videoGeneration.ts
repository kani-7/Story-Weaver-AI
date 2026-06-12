import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoProvider = "runway" | "kling" | "luma" | "pika" | "haiper" | "stability" | "pixverse";

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
    case "pika":
      return generateWithPika(prompt, imageUrl, duration);
    case "haiper":
      return generateWithHaiper(prompt, imageUrl, duration);
    case "stability":
      return generateWithStabilityVideo(prompt, imageUrl, duration);
    case "pixverse":
      return generateWithPixverse(prompt, imageUrl, duration);
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
  const validProviders: VideoProvider[] = ["runway", "kling", "luma", "pika", "haiper", "stability", "pixverse"];
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

    const generationTime = ((Date.now() - startTime) / 1000);
    res.json({
      videoStatus: "success",
      videoUrl: result.url,
      videoProvider: result.provider,
      videoDuration: result.duration,
      generationTime,
      generationProgress: 100,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown video generation error";

    const generationTime = ((Date.now() - startTime) / 1000);
    res.json({
      videoStatus: "error",
      videoProvider: provider,
      videoDuration: 0,
      generationTime,
      generationProgress: 0,
      generationError: errorMsg,
    });
  }
});

// ─── Provider: Haiper (stub) ───────────────────────────────────────────────────

async function generateWithHaiper(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["HAIPER_API_KEY"];
  if (!apiKey) throw new Error("HAIPER_API_KEY is not set");

  const reqBody: Record<string, unknown> = {
    prompt: prompt.slice(0, 2000),
    duration,
    aspectRatio: "16:9",
  };
  if (imageUrl) reqBody.imageUrl = imageUrl;

  const createRes = await fetch("https://api.haiper.ai/v2/video", {
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
    throw new Error(`Haiper error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id?: string; videoId?: string };
  const videoId = created.id ?? created.videoId;
  if (!videoId) throw new Error("Haiper returned no video id");

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`https://api.haiper.ai/v2/video/${videoId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as { status?: string; videoUrl?: string; url?: string };
    if ((poll.status === "completed" || poll.status === "succeeded") && (poll.videoUrl || poll.url)) {
      return { url: poll.videoUrl || poll.url || "", provider: "haiper", duration };
    }
    if (poll.status === "failed" || poll.status === "error") {
      throw new Error("Haiper generation failed");
    }
  }

  throw new Error("Haiper generation timed out after 200s");
}

// ─── Provider: Stability Video (stub) ──────────────────────────────────────────

async function generateWithStabilityVideo(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["STABILITY_VIDEO_KEY"];
  if (!apiKey) throw new Error("STABILITY_VIDEO_KEY is not set");

  const reqBody: Record<string, unknown> = {
    prompt: prompt.slice(0, 2000),
    duration,
    aspectRatio: "16:9",
  };
  if (imageUrl) reqBody.imageUrl = imageUrl;

  const createRes = await fetch("https://api.stability.ai/v2beta/video/generation", {
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
    throw new Error(`Stability Video error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id?: string; generationId?: string };
  const generationId = created.id ?? created.generationId;
  if (!generationId) throw new Error("Stability Video returned no generation id");

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`https://api.stability.ai/v2beta/video/generation/${generationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as {
      status?: string;
      videoUrl?: string;
      url?: string;
      assets?: { video?: string };
    };
    const url = poll.videoUrl || poll.url || poll.assets?.video;
    if ((poll.status === "completed" || poll.status === "succeeded") && url) {
      return { url, provider: "stability", duration };
    }
    if (poll.status === "failed" || poll.status === "error") {
      throw new Error("Stability Video generation failed");
    }
  }

  throw new Error("Stability Video generation timed out after 200s");
}

// ─── Provider: PixVerse (stub) ──────────────────────────────────────────────────

async function generateWithPixverse(
  prompt: string,
  imageUrl: string | undefined,
  duration: number
): Promise<VideoProviderResult> {
  const apiKey = process.env["PIXVERSE_API_KEY"];
  if (!apiKey) throw new Error("PIXVERSE_API_KEY is not set");

  const reqBody: Record<string, unknown> = {
    prompt: prompt.slice(0, 2000),
    duration,
    aspectRatio: "16:9",
  };
  if (imageUrl) reqBody.imageUrl = imageUrl;

  const createRes = await fetch("https://api.pixverse.ai/v2/video", {
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
    throw new Error(`PixVerse error ${createRes.status}: ${err}`);
  }

  const created = (await createRes.json()) as { id?: string; videoId?: string; taskId?: string };
  const videoId = created.id ?? created.videoId ?? created.taskId;
  if (!videoId) throw new Error("PixVerse returned no video id");

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`https://api.pixverse.ai/v2/video/${videoId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;

    const poll = (await pollRes.json()) as { status?: string; videoUrl?: string; url?: string };
    if ((poll.status === "completed" || poll.status === "succeeded") && (poll.videoUrl || poll.url)) {
      return { url: poll.videoUrl || poll.url || "", provider: "pixverse", duration };
    }
    if (poll.status === "failed" || poll.status === "error") {
      throw new Error("PixVerse generation failed");
    }
  }

  throw new Error("PixVerse generation timed out after 200s");
}

// ─── Cinematic Continuity Engine ─────────────────────────────────────────────────
// Injects timeline memory and transition intelligence into the enhanced prompt

interface SceneWithTimeline {
  sceneNumber: number;
  videoPrompt: string;
  imageUrl?: string;
  // Scene intelligence
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
  // Motion
  characterMovements?: string[];
  environmentalMotion?: string;
  cinematicTransition?: string;
  // Continuity
  clothingState?: string[];
  lightingState?: string;
  environmentState?: string;
  emotionalCarryOver?: string[];
  // Timeline memory (from previous scene)
  previousCameraMovement?: string;
  previousEmotionalState?: string;
  previousVisualPalette?: string;
  previousEnvironmentState?: string;
  // Transition intelligence
  transitionType?: string;
}

function buildCinematicContinuityBlock(scene: SceneWithTimeline): string {
  const parts: string[] = [];

  // Character appearance continuity
  if (scene.characterVisualContinuity) {
    parts.push(`character consistency: ${scene.characterVisualContinuity}`);
  } else if (scene.clothingState && scene.clothingState.length > 0) {
    parts.push(`clothing: ${scene.clothingState.join(", ")}`);
  }

  // Emotional progression from previous scene
  if (scene.previousEmotionalState) {
    parts.push(`emotional arc: transitioning from "${scene.previousEmotionalState}" to "${scene.dominantEmotion ?? scene.videoPrompt.slice(0, 40)}"`);
  }

  // Camera language continuity
  if (scene.previousCameraMovement && scene.cameraMovement) {
    parts.push(`camera flow: from ${scene.previousCameraMovement} to ${scene.cameraMovement}`);
  } else if (scene.cameraMovement) {
    parts.push(`camera: ${scene.cameraMovement}`);
  }

  // Lighting evolution
  if (scene.previousVisualPalette && scene.lightingState) {
    parts.push(`lighting evolution: ${scene.previousVisualPalette} → ${scene.lightingState}`);
  } else if (scene.lightingState) {
    parts.push(`lighting: ${scene.lightingState}`);
  }

  // Environment continuity
  if (scene.previousEnvironmentState && scene.environmentState) {
    parts.push(`environment continuity: ${scene.previousEnvironmentState} → ${scene.environmentState}`);
  } else if (scene.environmentState) {
    parts.push(`environment: ${scene.environmentState}`);
  }

  // Color grading continuity
  if (scene.previousVisualPalette) {
    parts.push(`color palette: ${scene.previousVisualPalette}`);
  }

  // Cinematic mood continuity
  if (scene.cinematicMood) {
    parts.push(`cinematic mood: ${scene.cinematicMood}`);
  }

  // Weather continuity
  if (scene.environmentalMotion) {
    parts.push(`weather continuity: ${scene.environmentalMotion}`);
  }

  return parts.join(". ");
}

function buildTransitionBlock(transitionType: string | undefined): string {
  if (!transitionType) return "";
  const transitionMap: Record<string, string> = {
    fade: "begin with a soft fade in from black",
    dissolve: "dissolve into scene from previous frame",
    whip_pan: "enter with a fast whip pan from the left",
    cinematic_cut: "hard cut with immediate action in frame",
    dream_dissolve: "ethereal dissolve with soft light bloom",
    flashback_blur: "blur dissolve with desaturated color wash",
    match_cut: "match cut on action from previous scene",
  };
  return transitionMap[transitionType] ?? `transition: ${transitionType}`;
}

function buildCinematicEnhancedPrompt(scene: SceneWithTimeline): string {
  const sections: string[] = [];

  // 1. Transition intelligence
  const transition = buildTransitionBlock(scene.transitionType);
  if (transition) sections.push(transition);

  // 2. Base scene prompt
  sections.push(scene.videoPrompt.trim());

  // 3. Cinematic continuity engine
  const continuity = buildCinematicContinuityBlock(scene);
  if (continuity) sections.push(continuity);

  // 4. Motion direction
  const motionParts: string[] = [];
  if (scene.cameraMovement) {
    const cameraMap: Record<string, string> = {
      Static: "static locked-off shot",
      "Dolly In": "smooth dolly push in toward subject",
      "Dolly Out": "slow dolly pull back revealing scene",
      "Crane Up": "majestic crane rise upward",
      Handheld: "subtle handheld shake for authenticity",
      Tracking: "smooth tracking shot following subject",
      Orbit: "cinematic orbit around subject",
    };
    motionParts.push(`camera: ${cameraMap[scene.cameraMovement] ?? scene.cameraMovement}`);
  }
  if (scene.characterMovements && scene.characterMovements.length > 0) {
    motionParts.push(`character motion: ${scene.characterMovements.join(", ")}`);
  }
  if (scene.environmentalMotion) {
    motionParts.push(`environment: ${scene.environmentalMotion}`);
  }
  if (scene.cinematicTransition) {
    const transMap: Record<string, string> = {
      "Fade In": "fade in from black",
      "Fade Out": "fade out to black",
      Dissolve: "smooth dissolve transition",
      "Match Cut": "match cut on action",
      "Dream Ripple": "rippling dream transition",
      "Iris Transition": "iris wipe transition",
    };
    motionParts.push(`transition: ${transMap[scene.cinematicTransition] ?? scene.cinematicTransition}`);
  }
  if (motionParts.length > 0) {
    sections.push(motionParts.join("; "));
  }

  // 5. Emotional direction
  if (scene.dominantEmotion) {
    const intensity = scene.emotionalIntensity ?? 0.5;
    const intensityLabel = intensity >= 0.8 ? "intense" : intensity >= 0.5 ? "moderate" : "subtle";
    sections.push(`emotional tone: ${intensityLabel} ${scene.dominantEmotion}`);
  }

  // 6. Character visual references
  if (scene.characterProfiles && scene.characterProfiles.length > 0) {
    const charBlock = scene.characterProfiles
      .map((c) => {
        const attrs = [c.appearance, c.distinctiveFeatures, c.clothing].filter(Boolean);
        return `[${c.name}: ${attrs.join(", ")}]`;
      })
      .join(" ");
    sections.push(`characters: ${charBlock}`);
  }

  // 7. Cinematic context
  const cinematic: string[] = [];
  if (scene.cinematicMood) cinematic.push(`mood: ${scene.cinematicMood}`);
  if (scene.lightingStyle) cinematic.push(`lighting: ${scene.lightingStyle}`);
  if (scene.animationStyle) cinematic.push(`style: ${scene.animationStyle}`);
  if (scene.shotType) cinematic.push(`shot: ${scene.shotType}`);
  if (scene.pacingStyle) cinematic.push(`pacing: ${scene.pacingStyle}`);
  if (cinematic.length > 0) sections.push(cinematic.join(", "));

  return sections.join(". ");
}

// ─── Batch Video Generation Endpoint ─────────────────────────────────────────

interface BatchVideoGenerationBody {
  scenes: SceneWithTimeline[];
  provider?: VideoProvider;
  duration?: 5 | 10;
}

// In-memory batch queue state
interface BatchQueueState {
  status: "idle" | "running" | "paused" | "completed" | "cancelled";
  completedScenes: number[];
  failedScenes: number[];
  activeScene: number | null;
  sceneResults: Record<number, {
    videoStatus: string;
    videoUrl?: string;
    videoProvider?: string;
    videoDuration?: number;
    generationTime?: number;
    generationError?: string;
  }>;
  startTime: number;
  totalScenes: number;
}

const batchQueueState: BatchQueueState = {
  status: "idle",
  completedScenes: [],
  failedScenes: [],
  activeScene: null,
  sceneResults: {},
  startTime: 0,
  totalScenes: 0,
};

let batchCancelFlag = false;

router.post("/storyboard/batch-generate-videos", async (req, res): Promise<void> => {
  const body = req.body as BatchVideoGenerationBody;

  if (!body.scenes || body.scenes.length === 0) {
    res.status(400).json({ error: "scenes array is required" });
    return;
  }

  const provider: VideoProvider = body.provider ?? "luma";
  const validProviders: VideoProvider[] = ["runway", "kling", "luma", "pika", "haiper", "stability", "pixverse"];
  if (!validProviders.includes(provider)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` });
    return;
  }

  const duration = body.duration ?? 5;

  // Reset queue state
  batchQueueState.status = "running";
  batchQueueState.completedScenes = [];
  batchQueueState.failedScenes = [];
  batchQueueState.activeScene = null;
  batchQueueState.sceneResults = {};
  batchQueueState.startTime = Date.now();
  batchQueueState.totalScenes = body.scenes.length;
  batchCancelFlag = false;

  // Start sequential generation in background
  const runBatch = async () => {
    for (let i = 0; i < body.scenes.length; i++) {
      if (batchCancelFlag) {
        batchQueueState.status = "cancelled";
        break;
      }

      // Check for pause
      while (batchQueueState.status === "paused" && !batchCancelFlag) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (batchCancelFlag) {
        batchQueueState.status = "cancelled";
        break;
      }

      const scene = body.scenes[i]!;
      const sceneNum = scene.sceneNumber;
      batchQueueState.activeScene = sceneNum;

      const enhancedPrompt = buildCinematicEnhancedPrompt(scene);
      const startTime = Date.now();

      try {
        const result = await generateVideo(provider, enhancedPrompt, scene.imageUrl, duration);
        const generationTime = (Date.now() - startTime) / 1000;

        batchQueueState.completedScenes.push(sceneNum);
        batchQueueState.sceneResults[sceneNum] = {
          videoStatus: "success",
          videoUrl: result.url,
          videoProvider: result.provider,
          videoDuration: result.duration,
          generationTime,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown video generation error";
        const generationTime = (Date.now() - startTime) / 1000;

        batchQueueState.failedScenes.push(sceneNum);
        batchQueueState.sceneResults[sceneNum] = {
          videoStatus: "error",
          videoProvider: provider,
          videoDuration: 0,
          generationTime,
          generationError: errorMsg,
        };
      }
    }

    if (batchQueueState.status === "running") {
      batchQueueState.status = "completed";
    }
    batchQueueState.activeScene = null;
  };

  // Kick off async batch
  runBatch().catch(() => {
    batchQueueState.status = "completed";
  });

  // Return initial status immediately
  res.json({
    batchVideoStatus: "running",
    completedScenes: [],
    failedScenes: [],
    activeScene: body.scenes[0]?.sceneNumber ?? null,
    queueProgress: 0,
    estimatedRemainingTime: body.scenes.length * 45,
    sceneResults: {},
  });
});

// ─── Batch Status Endpoint ───────────────────────────────────────────────────

router.get("/storyboard/batch-generate-videos/status", (_req, res): void => {
  const completed = batchQueueState.completedScenes.length;
  const total = batchQueueState.totalScenes;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Estimate remaining time based on average
  const elapsed = (Date.now() - batchQueueState.startTime) / 1000;
  const avgPerScene = completed > 0 ? elapsed / completed : 45;
  const remaining = (total - completed) * avgPerScene;

  res.json({
    batchVideoStatus: batchQueueState.status,
    completedScenes: batchQueueState.completedScenes,
    failedScenes: batchQueueState.failedScenes,
    activeScene: batchQueueState.activeScene,
    queueProgress: progress,
    estimatedRemainingTime: Math.round(remaining),
    sceneResults: batchQueueState.sceneResults,
  });
});

// ─── Batch Control Endpoints ──────────────────────────────────────────────────

router.post("/storyboard/batch-generate-videos/pause", (_req, res): void => {
  if (batchQueueState.status === "running") {
    batchQueueState.status = "paused";
  }
  res.json({ success: true, status: batchQueueState.status });
});

router.post("/storyboard/batch-generate-videos/resume", (_req, res): void => {
  if (batchQueueState.status === "paused") {
    batchQueueState.status = "running";
  }
  res.json({ success: true, status: batchQueueState.status });
});

router.post("/storyboard/batch-generate-videos/cancel", (_req, res): void => {
  batchCancelFlag = true;
  batchQueueState.status = "cancelled";
  res.json({ success: true, status: batchQueueState.status });
});

export default router;
