import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sceneImagesTable, type InsertSceneImage } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// ─── Types ─────────────────────────────────────────────────────────────────────

type ImageProvider = "stability" | "openai" | "replicate" | "fal" | "pollinations";

interface CharacterProfileRef {
  characterId?: string;
  name: string;
  appearance?: string;
  distinctiveFeatures?: string;
  clothing?: string;
}

interface ImageGenerationRequestBody {
  storyboardId?: string;
  sceneNumber: number;
  sceneImagePrompt: string;
  provider?: ImageProvider;
  characterProfiles?: CharacterProfileRef[];
  characterVisualContinuity?: string;
  colorPalette?: string;
  cinematicMood?: string;
  renderStyle?: string;
  visualEngine?: string;
}

interface ProviderResult {
  url: string;
  provider: ImageProvider;
}

// ─── Retry with Exponential Backoff ────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `[imageGen] attempt ${attempt + 1}/${maxAttempts} failed: ${err instanceof Error ? err.message : String(err)}. Retrying in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─── Character Reference Locking ───────────────────────────────────────────────

function buildCharacterReferenceBlock(
  characterProfiles?: CharacterProfileRef[],
  characterVisualContinuity?: string
): string {
  if (!characterProfiles || characterProfiles.length === 0) return "";

  const parts: string[] = [];

  for (const char of characterProfiles) {
    const lines: string[] = [`[${char.name}]`];
    if (char.appearance) lines.push(`appearance: ${char.appearance}`);
    if (char.distinctiveFeatures) lines.push(`distinctive features: ${char.distinctiveFeatures}`);
    if (char.clothing && char.clothing !== "—") lines.push(`clothing: ${char.clothing}`);
    parts.push(lines.join(", "));
  }

  let block = `CHARACTER REFERENCES — ${parts.join(" | ")}`;

  if (characterVisualContinuity) {
    block += ` | CONTINUITY STATE — ${characterVisualContinuity}`;
  }

  return block;
}

function buildEnhancedPrompt(body: ImageGenerationRequestBody): string {
  const parts: string[] = [body.sceneImagePrompt];

  const charBlock = buildCharacterReferenceBlock(
    body.characterProfiles,
    body.characterVisualContinuity
  );
  if (charBlock) parts.push(charBlock);

  if (body.colorPalette) parts.push(`color palette: ${body.colorPalette}`);
  if (body.cinematicMood) parts.push(`mood: ${body.cinematicMood}`);
  if (body.renderStyle) parts.push(`style: ${body.renderStyle}`);

  return parts.join(". ");
}

// ─── Provider: Pollinations (free, no API key) ─────────────────────────────────
// Uses the `turbo` model (SDXL Turbo) — free tier, no 402.
// `flux` has moved to a paid tier, so we do NOT use it.
// GET request forces lazy generation to complete before we return the URL.

async function attemptPollinations(prompt: string, model: string): Promise<ProviderResult> {
  const seed = Math.floor(Math.random() * 999999);
  const shortPrompt = prompt.slice(0, 800);
  const encodedPrompt = encodeURIComponent(shortPrompt);
  // nologo=true, enhance=false to keep it clean and deterministic
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1216&height=832&model=${model}&nologo=true&seed=${seed}&enhance=false`;

  console.info(`[Pollinations] GET model=${model} seed=${seed} prompt_len=${shortPrompt.length}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Log full body for debugging
    const body = await response.text().catch(() => "<unreadable>");
    console.error(`[Pollinations] HTTP ${response.status} (model=${model}): ${body}`);
    throw new Error(`Pollinations HTTP ${response.status} — ${body.slice(0, 200)}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    const body = await response.arrayBuffer().catch(() => null);
    console.error(`[Pollinations] Unexpected content-type: ${contentType}`);
    throw new Error(`Pollinations returned unexpected content-type: ${contentType}`);
  }

  // Consume the body so the connection is released cleanly
  await response.arrayBuffer().catch(() => null);

  return { url, provider: "pollinations" };
}

async function generateWithPollinations(prompt: string): Promise<ProviderResult> {
  // Model fallback order: turbo (SDXL Turbo, always free) → flux-schnell → default (no model param)
  // We try with retry+backoff on each model before moving to the next.
  const models = ["turbo", "flux-schnell"];

  for (const model of models) {
    try {
      return await withRetry(() => attemptPollinations(prompt, model), 2, 1500);
    } catch (err) {
      console.warn(`[Pollinations] model=${model} exhausted retries: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Last-ditch: try without a model param (Pollinations picks the default free model)
  const seed = Math.floor(Math.random() * 999999);
  const shortPrompt = prompt.slice(0, 800);
  const encodedPrompt = encodeURIComponent(shortPrompt);
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1216&height=832&nologo=true&seed=${seed}&enhance=false`;

  console.info(`[Pollinations] Trying without model param (default), seed=${seed}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let response: Response;
  try {
    response = await fetch(fallbackUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "<unreadable>");
    console.error(`[Pollinations] Final fallback HTTP ${response.status}: ${body}`);
    throw new Error(`Pollinations unavailable (HTTP ${response.status}). Response: ${body.slice(0, 200)}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    await response.arrayBuffer().catch(() => null);
    throw new Error(`Pollinations returned unexpected content-type: ${contentType}`);
  }

  await response.arrayBuffer().catch(() => null);
  return { url: fallbackUrl, provider: "pollinations" };
}

// ─── Provider: OpenAI DALL-E 3 ────────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1792x1024",
      quality: "hd",
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: Array<{ url: string }> };
  if (!data.data?.[0]?.url) throw new Error("OpenAI returned no image URL");

  return { url: data.data[0].url, provider: "openai" };
}

// ─── Provider: Stability AI ───────────────────────────────────────────────────

async function generateWithStability(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["STABILITY_API_KEY"];
  if (!apiKey) throw new Error("STABILITY_API_KEY is not set");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: (() => {
        const fd = new FormData();
        fd.append("prompt", prompt.slice(0, 10000));
        fd.append("output_format", "jpeg");
        fd.append("aspect_ratio", "16:9");
        return fd;
      })(),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stability AI error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { image?: string; artifacts?: Array<{ base64: string }> };

  const base64 = data.image ?? data.artifacts?.[0]?.base64;
  if (!base64) throw new Error("Stability AI returned no image data");

  const dataUrl = `data:image/jpeg;base64,${base64}`;
  return { url: dataUrl, provider: "stability" };
}

// ─── Provider: Replicate ──────────────────────────────────────────────────────

async function generateWithReplicate(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["REPLICATE_API_TOKEN"];
  if (!apiKey) throw new Error("REPLICATE_API_TOKEN is not set");

  const createRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: prompt.slice(0, 2000),
        aspect_ratio: "16:9",
        output_format: "jpg",
        output_quality: 90,
        num_inference_steps: 4,
      },
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate error ${createRes.status}: ${err}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    status: string;
    output?: string[];
    urls?: { get: string };
  };

  if (prediction.status !== "succeeded" && prediction.urls?.get) {
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(prediction.urls!.get, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });
      const polled = (await pollRes.json()) as { status: string; output?: string[] };
      if (polled.status === "succeeded" && polled.output?.[0]) {
        return { url: polled.output[0], provider: "replicate" };
      }
      if (polled.status === "failed") throw new Error("Replicate prediction failed");
    }
    throw new Error("Replicate prediction timed out");
  }

  const imageUrl = prediction.output?.[0];
  if (!imageUrl) throw new Error("Replicate returned no image URL");

  return { url: imageUrl, provider: "replicate" };
}

// ─── Provider: Fal.ai ────────────────────────────────────────────────────────

async function generateWithFal(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["FAL_KEY"];
  if (!apiKey) throw new Error("FAL_KEY is not set");

  const submitRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.slice(0, 2000),
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Fal.ai error ${submitRes.status}: ${err}`);
  }

  const queued = (await submitRes.json()) as { request_id: string; response_url?: string };

  const resultUrl = queued.response_url ?? `https://queue.fal.run/fal-ai/flux/schnell/requests/${queued.request_id}`;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(resultUrl, {
      headers: { Authorization: `Key ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) continue;
    const data = (await pollRes.json()) as {
      status?: string;
      images?: Array<{ url: string }>;
    };

    if (data.images?.[0]?.url) {
      return { url: data.images[0].url, provider: "fal" };
    }
    if (data.status === "FAILED") throw new Error("Fal.ai generation failed");
  }

  throw new Error("Fal.ai generation timed out");
}

// ─── Fallback Chain ────────────────────────────────────────────────────────────
// After the requested provider fails, try other providers in priority order,
// skipping any that require an API key that isn't configured.

function buildFallbackChain(requestedProvider: ImageProvider): ImageProvider[] {
  const all: ImageProvider[] = ["pollinations", "openai", "stability", "replicate", "fal"];
  const hasKey: Record<ImageProvider, boolean> = {
    pollinations: true,
    openai: !!process.env["OPENAI_API_KEY"],
    stability: !!process.env["STABILITY_API_KEY"],
    replicate: !!process.env["REPLICATE_API_TOKEN"],
    fal: !!process.env["FAL_KEY"],
  };
  return all.filter((p) => p !== requestedProvider && hasKey[p]);
}

// ─── Provider Router ──────────────────────────────────────────────────────────

async function generateImage(
  provider: ImageProvider,
  enhancedPrompt: string
): Promise<ProviderResult> {
  switch (provider) {
    case "openai":
      return generateWithOpenAI(enhancedPrompt);
    case "stability":
      return generateWithStability(enhancedPrompt);
    case "replicate":
      return generateWithReplicate(enhancedPrompt);
    case "fal":
      return generateWithFal(enhancedPrompt);
    case "pollinations":
    default:
      return generateWithPollinations(enhancedPrompt);
  }
}

// ─── In-memory dedup cache (keyed by sceneNumber + provider) ──────────────────

const inFlightRequests = new Map<string, Promise<ProviderResult>>();

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/storyboard/generate-image", async (req, res): Promise<void> => {
  const body = req.body as ImageGenerationRequestBody;

  if (!body.sceneNumber || !body.sceneImagePrompt) {
    res.status(400).json({ error: "sceneNumber and sceneImagePrompt are required" });
    return;
  }

  const provider: ImageProvider = body.provider ?? "pollinations";
  const validProviders: ImageProvider[] = ["stability", "openai", "replicate", "fal", "pollinations"];
  if (!validProviders.includes(provider)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` });
    return;
  }

  const dedupeKey = `scene-${body.sceneNumber}-${provider}`;
  const enhancedPrompt = buildEnhancedPrompt(body);
  const startTime = Date.now();

  // ── Attempt primary provider (with dedup) ──────────────────────────────────
  let generationPromise = inFlightRequests.get(dedupeKey);
  if (!generationPromise) {
    generationPromise = generateImage(provider, enhancedPrompt).finally(() => {
      inFlightRequests.delete(dedupeKey);
    });
    inFlightRequests.set(dedupeKey, generationPromise);
  }

  let result: ProviderResult | null = null;
  let primaryError: string | null = null;

  try {
    result = await generationPromise;
  } catch (err: unknown) {
    primaryError = err instanceof Error ? err.message : "Unknown generation error";
    console.warn(`[imageGen] Primary provider "${provider}" failed: ${primaryError}`);

    // ── Fallback chain ────────────────────────────────────────────────────────
    const fallbacks = buildFallbackChain(provider);
    console.info(`[imageGen] Trying fallback chain: ${fallbacks.join(" → ")}`);

    for (const fallbackProvider of fallbacks) {
      const fbKey = `scene-${body.sceneNumber}-${fallbackProvider}-fallback`;
      try {
        console.info(`[imageGen] Attempting fallback: ${fallbackProvider}`);
        let fbPromise = inFlightRequests.get(fbKey);
        if (!fbPromise) {
          fbPromise = generateImage(fallbackProvider, enhancedPrompt).finally(() => {
            inFlightRequests.delete(fbKey);
          });
          inFlightRequests.set(fbKey, fbPromise);
        }
        result = await fbPromise;
        console.info(`[imageGen] Fallback succeeded with: ${fallbackProvider}`);
        break;
      } catch (fbErr) {
        console.warn(`[imageGen] Fallback "${fallbackProvider}" also failed: ${fbErr instanceof Error ? fbErr.message : String(fbErr)}`);
      }
    }
  }

  const generationTime = (Date.now() - startTime) / 1000;

  // ── Persist result to DB ──────────────────────────────────────────────────
  if (body.storyboardId) {
    try {
      const existing = await db.select().from(sceneImagesTable).where(
        and(
          eq(sceneImagesTable.storyboardId, body.storyboardId),
          eq(sceneImagesTable.sceneNumber, body.sceneNumber)
        )
      );

      const payload: InsertSceneImage = {
        storyboardId: body.storyboardId,
        sceneNumber: body.sceneNumber,
        imageUrl: result?.url ?? null,
        imageProvider: result?.provider ?? provider,
        generationTime: Math.round(generationTime),
        imageStatus: result ? "success" : "error",
        generationError: result ? null : (primaryError ?? "All providers failed"),
        prompt: body.sceneImagePrompt,
        colorPalette: body.colorPalette ?? null,
        cinematicMood: body.cinematicMood ?? null,
        renderStyle: body.renderStyle ?? null,
        visualEngine: body.visualEngine ?? null,
        characterVisualContinuity: body.characterVisualContinuity ?? null,
      };

      if (existing.length > 0) {
        await db.update(sceneImagesTable).set(payload).where(eq(sceneImagesTable.id, existing[0].id));
      } else {
        await db.insert(sceneImagesTable).values(payload);
      }
    } catch (dbErr) {
      req.log.warn({ err: dbErr }, "Failed to persist image result");
    }
  }

  // ── Respond — never crash the UI ──────────────────────────────────────────
  if (result) {
    res.json({
      imageStatus: "success",
      imageUrl: result.url,
      imageProvider: result.provider,
      generationTime,
    });
  } else {
    // All providers failed — return structured error, not a 5xx
    const userMessage =
      provider === "pollinations"
        ? "Pollinations image generation is currently unavailable. Try again in a moment, or select a different provider."
        : `Image generation failed (${provider}). ${primaryError ?? ""}`;

    res.json({
      imageStatus: "error",
      imageProvider: provider,
      generationTime,
      generationError: userMessage,
    });
  }
});

export default router;
