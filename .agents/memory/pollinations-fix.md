---
name: Pollinations image fix
description: Critical bugs found and fixed in the Pollinations free image provider — HEAD vs GET, URL length, CORS.
---

# Pollinations Image Generation Fixes

## Bug 1 — HEAD instead of GET
**Problem:** The original implementation used `fetch(url, { method: "HEAD" })` to "verify" the URL. Pollinations is a lazy-generation service — a HEAD request returns 200 immediately, *before* the image is actually generated. When the browser then tried to load that URL, generation started from scratch in the browser context, causing a race condition where the `<img>` element got a broken/loading response.

**Fix:** Use a real `GET` request. The server-side GET blocks until Pollinations streams back the full image, guaranteeing the URL is fully generated before we send it to the browser. We also verify `content-type` starts with `image/`.

**How to apply:** Any future provider that uses lazy generation (returns a URL before content is ready) must do a server-side GET to verify.

## Bug 2 — URL length limit
**Problem:** The enhanced prompt (base prompt + character references + mood + continuity) can be 3000–8000 chars. URL-encoded, this far exceeds browser URL limits (~2048 chars) and Pollinations' own server limits.

**Fix:** Truncate the base prompt to 800 characters *before* `encodeURIComponent()`. This keeps the final URL well under limits.

**How to apply:** Always truncate Pollinations prompts at ≤800 chars.

## Bug 3 — crossOrigin="anonymous" on img tags
**Problem:** Adding `crossOrigin="anonymous"` to `<img>` tags makes the browser send a CORS-preflight request. Pollinations does not return `Access-Control-Allow-Origin` headers that satisfy credentialed CORS preflight. Result: the browser silently blocks the image from displaying even though the URL is valid.

**Fix:** Remove `crossOrigin="anonymous"` from all Pollinations/external image tags. Only add it if you actually need to manipulate the image with Canvas API.

**Why:** `crossOrigin` is only needed for canvas `drawImage()` or `getImageData()`. For simple display in `<img>`, it is never needed and causes silent failures with providers that don't set full CORS headers.
