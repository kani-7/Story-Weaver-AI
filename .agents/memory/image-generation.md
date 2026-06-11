---
name: Image generation system
description: Multi-provider AI image generation for DreamFrame — architecture, dedup, character ref locking, localStorage persistence.
---

# Image Generation System

## Route
`artifacts/api-server/src/routes/imageGeneration.ts` — registered in `routes/index.ts`.

**POST /api/storyboard/generate-image** → `ImageGenerationResult`

## Provider module pattern
Each provider is a standalone `async function generateWith<Provider>(prompt): Promise<ProviderResult>`.  
`generateImage(provider, prompt)` is the router that dispatches to the right function.  
Adding a new provider = add a function + a case to the switch.

## Providers & required secrets
| Provider | Secret env var | Notes |
|---|---|---|
| pollinations | none | Free, HEAD-verifies URL |
| openai | `OPENAI_API_KEY` | DALL-E 3, 1792×1024 hd |
| stability | `STABILITY_API_KEY` | Ultra endpoint, returns base64 |
| replicate | `REPLICATE_API_TOKEN` | FLUX Schnell, polls with `Prefer: wait` |
| fal | `FAL_KEY` | FLUX Schnell via queue.fal.run, polls |

## Dedup / queue system
`inFlightRequests: Map<string, Promise<ProviderResult>>` keyed `scene-{N}-{provider}`.  
If same key is already in-flight, callers await the same promise. Auto-deleted on `.finally()`.

## Character reference locking
`buildCharacterReferenceBlock(profiles, continuityState)` assembles appearance + distinctiveFeatures + clothing per character into the prompt. `buildEnhancedPrompt(body)` concatenates base prompt + char block + colorPalette + cinematicMood + renderStyle.

## Frontend state (App.tsx)
- `imageStates: Record<sceneNumber, SceneImageState>` — status: idle|loading|success|error
- Persisted to `localStorage["dreamframe-image-states"]` — only `status:success` entries with imageUrl are saved/restored across refresh
- `selectedProvider` is global (one selector changes it for all scenes, per-scene can override after generation)
- `handleGenerateImage(scene)` guards against duplicate calls when status===loading

**Why:** Dedup prevents double billing; localStorage keeps images after page refresh without re-generating; character ref locking is the key differentiator for visual consistency across scenes.
