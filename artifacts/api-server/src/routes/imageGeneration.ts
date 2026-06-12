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
  providerChain?: string[];
  retryable?: boolean;
}

// ─── Structured Logging ─────────────────────────────────────────────────────────

interface GenLogEvent {
  provider: string;
  sceneNumber?: number;
  promptLen: number;
  durationMs?: number;
  status: "attempt" | "ok" | "err" | "fallback" | "skip";
  model?: string;
  httpStatus?: number;
  imageUrl?: string;
  error?: string;
}

function logGen(event: GenLogEvent): void {
  const parts: string[] = [
    `[imageGen] provider=${event.provider}`,
    `status=${event.status}`,
    `prompt_len=${event.promptLen}`,
  ];
  if (event.sceneNumber !== undefined) parts.push(`scene=${event.sceneNumber}`);
  if (event.model) parts.push(`model=${event.model}`);
  if (event.httpStatus !== undefined) parts.push(`http=${event.httpStatus}`);
  if (event.durationMs !== undefined) parts.push(`time=${(event.durationMs / 1000).toFixed(2)}s`);
  if (event.imageUrl) parts.push(`url=${event.imageUrl.slice(0, 80)}${event.imageUrl.length > 80 ? "…" : ""}`);
  if (event.error) parts.push(`error="${event.error.slice(0, 120)}"`);

  const msg = parts.join(" | ");
  if (event.status === "err") {
    console.error(msg);
  } else if (event.status === "fallback" || event.status === "skip") {
    console.warn(msg);
  } else {
    console.info(msg);
  }
}

// ─── Provider Error (non-retryable support) ─────────────────────────────────────

class ProviderError extends Error {
  public readonly httpStatus: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    httpStatus: number,
    retryable: boolean,
    userMessage: string
  ) {
    super(message);
    this.name = "ProviderError";
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.userMessage = userMessage;
  }
}

function classifyHttpError(status: number, provider: ImageProvider, body: string): ProviderError {
  const short = body.slice(0, 200);
  switch (status) {
    case 400:
      return new ProviderError(
        `${provider} HTTP 400: ${short}`,
        400,
        false,
        `${provider}: invalid request — your prompt may contain unsupported content.`
      );
    case 401:
    case 403:
      return new ProviderError(
        `${provider} HTTP ${status}: unauthorized`,
        status,
        false,
        `${provider}: API key is invalid or missing. Check your credentials.`
      );
    case 402:
      return new ProviderError(
        `${provider} HTTP 402: payment required`,
        402,
        false,
        `${provider}: this model requires a paid plan. Trying a different provider.`
      );
    case 429:
      return new ProviderError(
        `${provider} HTTP 429: rate limited`,
        429,
        true,
        `${provider}: rate limit reached. Retrying shortly…`
      );
    case 503:
    case 502:
    case 504:
      return new ProviderError(
        `${provider} HTTP ${status}: service unavailable`,
        status,
        true,
        `${provider}: temporarily unavailable. Retrying…`
      );
    default:
      return new ProviderError(
        `${provider} HTTP ${status}: ${short}`,
        status,
        status >= 500,
        `${provider}: generation failed (HTTP ${status}).`
      );
  }
}

// ─── Prompt Sanitisation ────────────────────────────────────────────────────────

function sanitizePrompt(text: string, maxLen: number): string {
  return text.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

// ─── Image URL Validator ────────────────────────────────────────────────────────

function validateImageUrl(url: string | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/");
}

// ─── Retry with Exponential Backoff (respects non-retryable errors) ─────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1500,
  retryAfterMs?: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Do not retry non-retryable ProviderErrors
      if (err instanceof ProviderError && !err.retryable) {
        throw err;
      }
      if (attempt < maxAttempts - 1) {
        let delay = baseDelayMs * Math.pow(2, attempt);
        // Honour the Retry-After hint if provided
        if (retryAfterMs && retryAfterMs > 0) {
          delay = Math.max(delay, retryAfterMs);
        }
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
// Model fallback: turbo → flux-schnell → (no model param = default free model)
// 402 on a specific model = non-retryable → skip to next model immediately.

async function attemptPollinationsModel(prompt: string, model: string | null): Promise<ProviderResult> {
  const seed = Math.floor(Math.random() * 999999);
  const shortPrompt = sanitizePrompt(prompt, 800);
  const encodedPrompt = encodeURIComponent(shortPrompt);
  const modelParam = model ? `&model=${model}` : "";
  const url =
    `https://image.pollinations.ai/prompt/${encodedPrompt}` +
    `?width=1216&height=832${modelParam}&nologo=true&seed=${seed}&enhance=false`;

  const t0 = Date.now();
  logGen({ provider: "pollinations", promptLen: shortPrompt.length, status: "attempt", model: model ?? "default" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (networkErr) {
    clearTimeout(timeout);
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    logGen({ provider: "pollinations", promptLen: shortPrompt.length, status: "err", model: model ?? "default", error: msg });
    throw new ProviderError(`Pollinations network error: ${msg}`, 0, true, "Pollinations: network error. Retrying…");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logGen({ provider: "pollinations", promptLen: shortPrompt.length, status: "err", model: model ?? "default", httpStatus: response.status, error: body.slice(0, 120) });
    throw classifyHttpError(response.status, "pollinations", body);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    const body = await response.text().catch(() => "");
    await response.arrayBuffer().catch(() => null);
    logGen({ provider: "pollinations", promptLen: shortPrompt.length, status: "err", model: model ?? "default", error: `Unexpected content-type: ${contentType}` });
    throw new ProviderError(
      `Pollinations bad content-type: ${contentType} — ${body.slice(0, 80)}`,
      0,
      true,
      "Pollinations returned unexpected response. Retrying…"
    );
  }

  await response.arrayBuffer().catch(() => null);
  logGen({ provider: "pollinations", promptLen: shortPrompt.length, status: "ok", model: model ?? "default", durationMs: Date.now() - t0, imageUrl: url });
  return { url, provider: "pollinations" };
}

async function generateWithPollinations(prompt: string): Promise<ProviderResult> {
  const modelSequence: Array<string | null> = ["turbo", "flux-schnell", null];

  for (const model of modelSequence) {
    try {
      return await withRetry(() => attemptPollinationsModel(prompt, model), 2, 1500);
    } catch (err) {
      if (err instanceof ProviderError && !err.retryable) {
        // 402 / 400 on this model — skip immediately, do NOT retry
        logGen({ provider: "pollinations", promptLen: prompt.length, status: "skip", model: model ?? "default", error: err.message });
        continue;
      }
      // Retryable exhausted — try next model
      logGen({ provider: "pollinations", promptLen: prompt.length, status: "skip", model: model ?? "default", error: err instanceof Error ? err.message : String(err) });
    }
  }

  throw new ProviderError(
    "Pollinations: all models exhausted",
    0,
    false,
    "Pollinations is currently unavailable. Try a different provider, or try again in a moment."
  );
}

// ─── Provider: OpenAI DALL-E 3 ────────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new ProviderError("OPENAI_API_KEY not set", 0, false, "OpenAI API key is not configured.");

  const t0 = Date.now();
  const safePrompt = sanitizePrompt(prompt, 4000);
  logGen({ provider: "openai", promptLen: safePrompt.length, status: "attempt" });

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: safePrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
      }),
      signal: AbortSignal.timeout(70000),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    logGen({ provider: "openai", promptLen: safePrompt.length, status: "err", error: msg });
    throw new ProviderError(`OpenAI network error: ${msg}`, 0, true, "OpenAI: network error. Retrying…");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logGen({ provider: "openai", promptLen: safePrompt.length, status: "err", httpStatus: response.status, error: body.slice(0, 120) });
    throw classifyHttpError(response.status, "openai", body);
  }

  const data = (await response.json()) as { data?: Array<{ url?: string }> };
  const imageUrl = data.data?.[0]?.url;
  if (!validateImageUrl(imageUrl)) {
    logGen({ provider: "openai", promptLen: safePrompt.length, status: "err", error: "No valid image URL in response" });
    throw new ProviderError("OpenAI returned no image URL", 0, false, "OpenAI: no image URL in response.");
  }

  logGen({ provider: "openai", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl });
  return { url: imageUrl, provider: "openai" };
}

// ─── Provider: Stability AI ───────────────────────────────────────────────────

async function generateWithStability(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["STABILITY_API_KEY"];
  if (!apiKey) throw new ProviderError("STABILITY_API_KEY not set", 0, false, "Stability AI API key is not configured.");

  const t0 = Date.now();
  const safePrompt = sanitizePrompt(prompt, 10000);
  logGen({ provider: "stability", promptLen: safePrompt.length, status: "attempt" });

  const fd = new FormData();
  fd.append("prompt", safePrompt);
  fd.append("output_format", "jpeg");
  fd.append("aspect_ratio", "16:9");

  let response: Response;
  try {
    response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/ultra", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: fd,
      signal: AbortSignal.timeout(70000),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    logGen({ provider: "stability", promptLen: safePrompt.length, status: "err", error: msg });
    throw new ProviderError(`Stability AI network error: ${msg}`, 0, true, "Stability AI: network error. Retrying…");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logGen({ provider: "stability", promptLen: safePrompt.length, status: "err", httpStatus: response.status, error: body.slice(0, 120) });
    throw classifyHttpError(response.status, "stability", body);
  }

  // Unified response parser: new API uses `image`, old uses `artifacts[].base64`
  const raw = (await response.json()) as {
    image?: string;
    artifacts?: Array<{ base64?: string; seed?: number; finishReason?: string }>;
  };

  const base64 = raw.image ?? raw.artifacts?.[0]?.base64;
  if (!base64) {
    logGen({ provider: "stability", promptLen: safePrompt.length, status: "err", error: "No image data in response" });
    throw new ProviderError("Stability AI returned no image data", 0, false, "Stability AI: no image data in response.");
  }

  const dataUrl = `data:image/jpeg;base64,${base64}`;
  logGen({ provider: "stability", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl: dataUrl.slice(0, 40) });
  return { url: dataUrl, provider: "stability" };
}

// ─── Provider: Replicate ──────────────────────────────────────────────────────

async function generateWithReplicate(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["REPLICATE_API_TOKEN"];
  if (!apiKey) throw new ProviderError("REPLICATE_API_TOKEN not set", 0, false, "Replicate API token is not configured.");

  const t0 = Date.now();
  const safePrompt = sanitizePrompt(prompt, 2000);
  logGen({ provider: "replicate", promptLen: safePrompt.length, status: "attempt" });

  let createRes: Response;
  try {
    createRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt: safePrompt,
            aspect_ratio: "16:9",
            output_format: "jpg",
            output_quality: 90,
            num_inference_steps: 4,
          },
        }),
        signal: AbortSignal.timeout(90000),
      }
    );
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    logGen({ provider: "replicate", promptLen: safePrompt.length, status: "err", error: msg });
    throw new ProviderError(`Replicate network error: ${msg}`, 0, true, "Replicate: network error. Retrying…");
  }

  if (!createRes.ok) {
    const body = await createRes.text().catch(() => "");
    logGen({ provider: "replicate", promptLen: safePrompt.length, status: "err", httpStatus: createRes.status, error: body.slice(0, 120) });
    throw classifyHttpError(createRes.status, "replicate", body);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    status: string;
    output?: string[];
    error?: string;
    urls?: { get: string };
  };

  if (prediction.error) {
    logGen({ provider: "replicate", promptLen: safePrompt.length, status: "err", error: prediction.error });
    throw new ProviderError(`Replicate prediction error: ${prediction.error}`, 0, false, `Replicate: ${prediction.error}`);
  }

  // If not immediately succeeded, poll
  if (prediction.status !== "succeeded" && prediction.urls?.get) {
    for (let attempt = 0; attempt < 25; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const pollRes = await fetch(prediction.urls!.get, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15000),
        });
        if (!pollRes.ok) continue;

        const polled = (await pollRes.json()) as {
          status: string;
          output?: unknown;
          error?: string;
        };

        if (polled.status === "failed") {
          throw new ProviderError(
            `Replicate prediction failed: ${polled.error ?? "unknown"}`,
            0,
            false,
            `Replicate: generation failed. ${polled.error ?? ""}`
          );
        }

        // output can be string[] or a single string
        const outputArr = Array.isArray(polled.output)
          ? (polled.output as string[])
          : typeof polled.output === "string"
          ? [polled.output]
          : [];

        if (polled.status === "succeeded" && outputArr.length > 0) {
          const imageUrl = outputArr[0];
          if (!validateImageUrl(imageUrl)) {
            throw new ProviderError("Replicate: invalid image URL in output", 0, false, "Replicate returned an invalid image URL.");
          }
          logGen({ provider: "replicate", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl });
          return { url: imageUrl, provider: "replicate" };
        }
      } catch (pollErr) {
        if (pollErr instanceof ProviderError) throw pollErr;
        // Network errors during polling → continue
      }
    }
    throw new ProviderError("Replicate prediction timed out", 0, false, "Replicate: generation timed out.");
  }

  // Immediate success (Prefer: wait header)
  const outputArr = Array.isArray(prediction.output)
    ? (prediction.output as string[])
    : typeof prediction.output === "string"
    ? [prediction.output]
    : [];

  const imageUrl = outputArr[0];
  if (!validateImageUrl(imageUrl)) {
    logGen({ provider: "replicate", promptLen: safePrompt.length, status: "err", error: "No valid image URL in output" });
    throw new ProviderError("Replicate returned no image URL", 0, false, "Replicate: no image URL in response.");
  }

  logGen({ provider: "replicate", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl });
  return { url: imageUrl, provider: "replicate" };
}

// ─── Provider: Fal.ai ────────────────────────────────────────────────────────

async function generateWithFal(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env["FAL_KEY"];
  if (!apiKey) throw new ProviderError("FAL_KEY not set", 0, false, "Fal.ai API key is not configured.");

  const t0 = Date.now();
  const safePrompt = sanitizePrompt(prompt, 2000);
  logGen({ provider: "fal", promptLen: safePrompt.length, status: "attempt" });

  let submitRes: Response;
  try {
    submitRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: safePrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
      signal: AbortSignal.timeout(90000),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    logGen({ provider: "fal", promptLen: safePrompt.length, status: "err", error: msg });
    throw new ProviderError(`Fal.ai network error: ${msg}`, 0, true, "Fal.ai: network error. Retrying…");
  }

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => "");
    logGen({ provider: "fal", promptLen: safePrompt.length, status: "err", httpStatus: submitRes.status, error: body.slice(0, 120) });
    throw classifyHttpError(submitRes.status, "fal", body);
  }

  const queued = (await submitRes.json()) as {
    request_id: string;
    response_url?: string;
    status?: string;
    images?: Array<{ url?: string }>;
  };

  // If images are already in the submit response (synchronous result)
  if (queued.images?.[0]?.url) {
    const imageUrl = queued.images[0].url!;
    if (!validateImageUrl(imageUrl)) throw new ProviderError("Fal.ai: invalid image URL in submit response", 0, false, "Fal.ai returned an invalid image URL.");
    logGen({ provider: "fal", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl });
    return { url: imageUrl, provider: "fal" };
  }

  const resultUrl =
    queued.response_url ??
    `https://queue.fal.run/fal-ai/flux/schnell/requests/${queued.request_id}`;

  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const pollRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });

      if (!pollRes.ok) continue;

      const data = (await pollRes.json()) as {
        status?: string;
        images?: Array<{ url?: string }>;
        error?: string;
      };

      if (data.error) {
        throw new ProviderError(`Fal.ai error: ${data.error}`, 0, false, `Fal.ai: ${data.error}`);
      }

      if (data.status === "FAILED") {
        throw new ProviderError("Fal.ai generation failed", 0, false, "Fal.ai: generation failed.");
      }

      const imageUrl = data.images?.[0]?.url;
      if (validateImageUrl(imageUrl)) {
        logGen({ provider: "fal", promptLen: safePrompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl });
        return { url: imageUrl, provider: "fal" };
      }
    } catch (pollErr) {
      if (pollErr instanceof ProviderError) throw pollErr;
    }
  }

  logGen({ provider: "fal", promptLen: safePrompt.length, status: "err", error: "Fal.ai timed out" });
  throw new ProviderError("Fal.ai generation timed out", 0, false, "Fal.ai: generation timed out.");
}

// ─── Fallback Chain ────────────────────────────────────────────────────────────

function buildFallbackChain(requestedProvider: ImageProvider): ImageProvider[] {
  // Priority: free provider first, then key-gated providers
  const priority: ImageProvider[] = ["pollinations", "openai", "stability", "replicate", "fal"];
  const hasKey: Record<ImageProvider, boolean> = {
    pollinations: true,
    openai: !!process.env["OPENAI_API_KEY"],
    stability: !!process.env["STABILITY_API_KEY"],
    replicate: !!process.env["REPLICATE_API_TOKEN"],
    fal: !!process.env["FAL_KEY"],
  };
  return priority.filter((p) => p !== requestedProvider && hasKey[p]);
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

// ─── Generate with Full Fallback Chain ───────────────────────────────────────
// Tries primary provider, then automatically falls back through available providers.
// Returns the result + the chain of providers that were attempted.

async function generateWithFallbackChain(
  requestedProvider: ImageProvider,
  prompt: string
): Promise<ProviderResult & { providerChain: string[] }> {
  const chain: string[] = [];
  const t0 = Date.now();

  // Primary attempt
  try {
    chain.push(requestedProvider);
    const result = await generateImage(requestedProvider, prompt);
    return { ...result, providerChain: chain };
  } catch (primaryErr) {
    const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    logGen({ provider: requestedProvider, promptLen: prompt.length, status: "err", error: errMsg });
  }

  // Fallback chain
  const fallbacks = buildFallbackChain(requestedProvider);
  logGen({ provider: requestedProvider, promptLen: prompt.length, status: "fallback", error: `Trying fallbacks: ${fallbacks.join(" → ")}` });

  for (const fb of fallbacks) {
    try {
      chain.push(fb);
      logGen({ provider: fb, promptLen: prompt.length, status: "attempt" });
      const result = await generateImage(fb, prompt);
      logGen({ provider: fb, promptLen: prompt.length, status: "ok", durationMs: Date.now() - t0, imageUrl: result.url });
      return { ...result, providerChain: chain };
    } catch (fbErr) {
      const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
      logGen({ provider: fb, promptLen: prompt.length, status: "err", error: fbMsg });
    }
  }

  throw new ProviderError(
    `All providers exhausted: ${chain.join(" → ")}`,
    0,
    false,
    `Image generation failed on all available providers (${chain.join(", ")}). Please try again later.`
  );
}

// ─── In-memory dedup cache (keyed by sceneNumber + provider, with expiry) ──────

interface InFlightEntry {
  promise: Promise<ProviderResult>;
  createdAt: number;
}

const inFlightMap = new Map<string, InFlightEntry>();
const IN_FLIGHT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function getOrCreateInFlight(key: string, factory: () => Promise<ProviderResult>): Promise<ProviderResult> {
  const now = Date.now();
  const existing = inFlightMap.get(key);

  // Evict stale entries
  if (existing && now - existing.createdAt > IN_FLIGHT_MAX_AGE_MS) {
    inFlightMap.delete(key);
  }

  if (!existing || now - existing.createdAt > IN_FLIGHT_MAX_AGE_MS) {
    const promise = factory().finally(() => inFlightMap.delete(key));
    inFlightMap.set(key, { promise, createdAt: now });
    return promise;
  }

  return existing.promise;
}

// ─── Batch Image Generation State ─────────────────────────────────────────────

interface BatchImageSceneInput {
  sceneNumber: number;
  sceneImagePrompt: string;
  colorPalette?: string;
  cinematicMood?: string;
  renderStyle?: string;
  visualEngine?: string;
  characterVisualContinuity?: string;
  previousClothingState?: string[];
  previousLightingState?: string;
  previousWeatherState?: string;
  previousEnvironmentState?: string;
  previousEmotionalCarryOver?: string[];
  previousPoseContext?: string;
}

interface BatchImageSceneResult {
  imageStatus: "pending" | "processing" | "success" | "error";
  imageUrl?: string;
  imageProvider?: string;
  generationTime?: number;
  generationError?: string;
  providerChain?: string[];
}

interface BatchImageState {
  batchGenerationStatus: "idle" | "running" | "completed" | "cancelled" | "failed";
  completedScenes: number[];
  failedScenes: number[];
  queuedScenes: number[];
  activeScene: number | undefined;
  queueProgress: number;
  estimatedTimeRemaining: number;
  totalScenes: number;
  sceneResults: Record<number, BatchImageSceneResult>;
}

let batchImageState: BatchImageState = {
  batchGenerationStatus: "idle",
  completedScenes: [],
  failedScenes: [],
  queuedScenes: [],
  activeScene: undefined,
  queueProgress: 0,
  estimatedTimeRemaining: 0,
  totalScenes: 0,
  sceneResults: {},
};

// Generation ID prevents ghost completions from stale/cancelled batch runs
let batchGenerationId = 0;

// ─── Continuity-Enhanced Prompt Builder ────────────────────────────────────────

function buildContinuityEnhancedPrompt(
  scene: BatchImageSceneInput,
  characterProfiles?: CharacterProfileRef[]
): string {
  const parts: string[] = [scene.sceneImagePrompt];

  const charBlock = buildCharacterReferenceBlock(characterProfiles, scene.characterVisualContinuity);
  if (charBlock) parts.push(charBlock);

  if (scene.colorPalette) parts.push(`color palette: ${scene.colorPalette}`);
  if (scene.cinematicMood) parts.push(`mood: ${scene.cinematicMood}`);
  if (scene.renderStyle) parts.push(`style: ${scene.renderStyle}`);

  // Continuity Engine
  const continuityParts: string[] = [];
  if (scene.previousClothingState?.length) {
    continuityParts.push(`clothing continuity: ${scene.previousClothingState.join(", ")}`);
  }
  if (scene.previousLightingState) {
    continuityParts.push(`lighting continuity: ${scene.previousLightingState}`);
  }
  if (scene.previousWeatherState) {
    continuityParts.push(`weather: ${scene.previousWeatherState}`);
  }
  if (scene.previousEnvironmentState) {
    continuityParts.push(`environment: ${scene.previousEnvironmentState}`);
  }
  if (scene.previousEmotionalCarryOver?.length) {
    continuityParts.push(`emotional state carry-over: ${scene.previousEmotionalCarryOver.join(", ")}`);
  }
  if (scene.previousPoseContext) {
    continuityParts.push(`pose continuity: ${scene.previousPoseContext}`);
  }
  if (continuityParts.length > 0) {
    parts.push(`CONTINUITY ENGINE — ${continuityParts.join(" | ")}`);
  }

  return parts.join(". ");
}

// ─── Batch Image Sequential Processor ─────────────────────────────────────────

async function processBatchImages(
  scenes: BatchImageSceneInput[],
  provider: ImageProvider,
  storyboardId: string | undefined,
  characterProfiles: CharacterProfileRef[] | undefined,
  myGenerationId: number
): Promise<void> {
  const total = scenes.length;
  const avgSecondsPerScene = 18;

  for (let idx = 0; idx < scenes.length; idx++) {
    // Cancelled or superseded by a new batch
    if (batchGenerationId !== myGenerationId) {
      console.info(`[batchImage] Generation ID changed (${myGenerationId} → ${batchGenerationId}), stopping stale batch.`);
      return;
    }
    if (batchImageState.batchGenerationStatus === "cancelled") {
      batchImageState.activeScene = undefined;
      batchImageState.queuedScenes = scenes.slice(idx).map(s => s.sceneNumber);
      return;
    }

    const scene = scenes[idx]!;
    const sceneNum = scene.sceneNumber;

    batchImageState.activeScene = sceneNum;
    batchImageState.queuedScenes = scenes.slice(idx + 1).map(s => s.sceneNumber);
    batchImageState.estimatedTimeRemaining = (total - idx - 1) * avgSecondsPerScene;
    batchImageState.sceneResults[sceneNum] = { imageStatus: "processing" };

    const startTime = Date.now();
    const enhancedPrompt = buildContinuityEnhancedPrompt(scene, characterProfiles);

    logGen({ provider, sceneNumber: sceneNum, promptLen: enhancedPrompt.length, status: "attempt" });

    let result: (ProviderResult & { providerChain: string[] }) | null = null;
    let errorMsg: string | null = null;

    try {
      result = await generateWithFallbackChain(provider, enhancedPrompt);
    } catch (err) {
      if (err instanceof ProviderError) {
        errorMsg = err.userMessage;
      } else {
        errorMsg = err instanceof Error ? err.message : "Generation failed";
      }
      logGen({ provider, sceneNumber: sceneNum, promptLen: enhancedPrompt.length, status: "err", error: errorMsg });
    }

    // Guard against stale batch overwriting new batch state
    if (batchGenerationId !== myGenerationId) return;

    const generationTime = (Date.now() - startTime) / 1000;

    if (result) {
      batchImageState.completedScenes.push(sceneNum);
      batchImageState.sceneResults[sceneNum] = {
        imageStatus: "success",
        imageUrl: result.url,
        imageProvider: result.provider,
        generationTime,
        providerChain: result.providerChain,
      };

      if (storyboardId) {
        try {
          const existing = await db.select().from(sceneImagesTable).where(
            and(eq(sceneImagesTable.storyboardId, storyboardId), eq(sceneImagesTable.sceneNumber, sceneNum))
          );
          const payload: InsertSceneImage = {
            storyboardId,
            sceneNumber: sceneNum,
            imageUrl: result.url,
            imageProvider: result.provider,
            generationTime: Math.round(generationTime),
            imageStatus: "success",
            generationError: null,
            prompt: scene.sceneImagePrompt,
            colorPalette: scene.colorPalette ?? null,
            cinematicMood: scene.cinematicMood ?? null,
            renderStyle: scene.renderStyle ?? null,
            visualEngine: scene.visualEngine ?? null,
            characterVisualContinuity: scene.characterVisualContinuity ?? null,
          };
          if (existing.length > 0) {
            await db.update(sceneImagesTable).set(payload).where(eq(sceneImagesTable.id, existing[0]!.id));
          } else {
            await db.insert(sceneImagesTable).values(payload);
          }
        } catch (dbErr) {
          console.warn(`[batchImage] DB persist failed for scene ${sceneNum}:`, dbErr);
        }
      }
    } else {
      batchImageState.failedScenes.push(sceneNum);
      batchImageState.sceneResults[sceneNum] = {
        imageStatus: "error",
        generationTime,
        generationError: errorMsg ?? "All providers failed",
      };
    }

    const completed = batchImageState.completedScenes.length + batchImageState.failedScenes.length;
    batchImageState.queueProgress = Math.round((completed / total) * 100);
  }

  if (batchGenerationId === myGenerationId) {
    batchImageState.batchGenerationStatus = "completed";
    batchImageState.activeScene = undefined;
    batchImageState.queuedScenes = [];
    batchImageState.estimatedTimeRemaining = 0;
    batchImageState.queueProgress = 100;
    console.info(
      `[batchImage] Batch complete: ${batchImageState.completedScenes.length} succeeded, ${batchImageState.failedScenes.length} failed`
    );
  }
}

// ─── Batch Image Routes ────────────────────────────────────────────────────────

router.post("/storyboard/batch-generate-images", async (req, res): Promise<void> => {
  const { scenes, provider, characterProfiles, storyboardId } = req.body as {
    scenes: BatchImageSceneInput[];
    provider?: ImageProvider;
    characterProfiles?: CharacterProfileRef[];
    storyboardId?: string;
  };

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    res.status(400).json({ error: "scenes array is required and must not be empty" });
    return;
  }

  // Validate each scene has required fields
  for (const s of scenes) {
    if (typeof s.sceneNumber !== "number" || !s.sceneImagePrompt) {
      res.status(400).json({ error: `Invalid scene entry: sceneNumber and sceneImagePrompt are required` });
      return;
    }
  }

  if (batchImageState.batchGenerationStatus === "running") {
    // Return current status — no duplicate run
    res.json(batchImageState);
    return;
  }

  const imageProvider: ImageProvider = provider ?? "pollinations";
  const validProviders: ImageProvider[] = ["stability", "openai", "replicate", "fal", "pollinations"];
  if (!validProviders.includes(imageProvider)) {
    res.status(400).json({ error: `Invalid provider: ${imageProvider}` });
    return;
  }

  // New generation ID to invalidate any stale in-progress callbacks
  const myId = ++batchGenerationId;

  batchImageState = {
    batchGenerationStatus: "running",
    completedScenes: [],
    failedScenes: [],
    queuedScenes: scenes.map(s => s.sceneNumber),
    activeScene: undefined,
    queueProgress: 0,
    estimatedTimeRemaining: scenes.length * 18,
    totalScenes: scenes.length,
    sceneResults: {},
  };

  processBatchImages(scenes, imageProvider, storyboardId, characterProfiles, myId).catch(err => {
    if (batchGenerationId === myId) {
      console.error(`[batchImage] Fatal error in batch processor:`, err);
      batchImageState.batchGenerationStatus = "failed";
    }
  });

  res.json(batchImageState);
});

router.get("/storyboard/batch-generate-images/status", (_req, res): void => {
  res.json(batchImageState);
});

router.post("/storyboard/batch-generate-images/cancel", (_req, res): void => {
  batchImageState.batchGenerationStatus = "cancelled";
  batchGenerationId++; // Invalidate current batch
  res.json({ ok: true, status: "cancelled" });
});

// ─── Single Scene Route ────────────────────────────────────────────────────────

router.post("/storyboard/generate-image", async (req, res): Promise<void> => {
  const body = req.body as ImageGenerationRequestBody;

  if (typeof body.sceneNumber !== "number" || !body.sceneImagePrompt) {
    res.status(400).json({ error: "sceneNumber (number) and sceneImagePrompt (string) are required" });
    return;
  }

  const validProviders: ImageProvider[] = ["stability", "openai", "replicate", "fal", "pollinations"];
  const provider: ImageProvider =
    body.provider && validProviders.includes(body.provider) ? body.provider : "pollinations";

  const enhancedPrompt = buildEnhancedPrompt(body);
  const dedupeKey = `scene-${body.sceneNumber}-${provider}`;
  const startTime = Date.now();

  logGen({ provider, sceneNumber: body.sceneNumber, promptLen: enhancedPrompt.length, status: "attempt" });

  let result: (ProviderResult & { providerChain: string[] }) | null = null;
  let userErrorMessage: string | null = null;

  try {
    const baseResult = await getOrCreateInFlight(dedupeKey, () =>
      generateWithFallbackChain(provider, enhancedPrompt)
    );
    result = baseResult as ProviderResult & { providerChain: string[] };
  } catch (err) {
    if (err instanceof ProviderError) {
      userErrorMessage = err.userMessage;
    } else {
      userErrorMessage = err instanceof Error ? err.message : "Image generation failed";
    }
    logGen({ provider, sceneNumber: body.sceneNumber, promptLen: enhancedPrompt.length, status: "err", error: userErrorMessage });
  }

  const generationTime = (Date.now() - startTime) / 1000;

  // Persist to DB
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
        generationError: result ? null : (userErrorMessage ?? "All providers failed"),
        prompt: body.sceneImagePrompt,
        colorPalette: body.colorPalette ?? null,
        cinematicMood: body.cinematicMood ?? null,
        renderStyle: body.renderStyle ?? null,
        visualEngine: body.visualEngine ?? null,
        characterVisualContinuity: body.characterVisualContinuity ?? null,
      };
      if (existing.length > 0) {
        await db.update(sceneImagesTable).set(payload).where(eq(sceneImagesTable.id, existing[0]!.id));
      } else {
        await db.insert(sceneImagesTable).values(payload);
      }
    } catch (dbErr) {
      req.log.warn({ err: dbErr }, "Failed to persist image result");
    }
  }

  if (result) {
    logGen({ provider: result.provider, sceneNumber: body.sceneNumber, promptLen: enhancedPrompt.length, status: "ok", durationMs: Date.now() - startTime * 1000, imageUrl: result.url });
    res.json({
      imageStatus: "success",
      imageUrl: result.url,
      imageProvider: result.provider,
      generationTime,
      providerChain: result.providerChain ?? [result.provider],
      retryable: false,
    });
  } else {
    res.json({
      imageStatus: "error",
      imageProvider: provider,
      generationTime,
      generationError: userErrorMessage ?? "Image generation failed on all providers.",
      providerChain: buildFallbackChain(provider).concat([provider]),
      retryable: true,
    });
  }
});

export default router;
