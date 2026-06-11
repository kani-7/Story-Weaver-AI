---
name: Scene field names
description: Correct field names on Scene sub-types — common wrong guesses that caused TypeScript errors.
---

# Correct Field Names on Scene Sub-Types

These are fields that are easy to guess wrong. Always check the generated `api.schemas.d.ts` before using sub-type fields.

## CharacterEmotion
| Wrong | Correct |
|---|---|
| `.intensity` | `.confidence` (float 0–1, not "intensity") |

The field is named `confidence` because it represents how certain the AI is about the emotion detection, not the emotional intensity of the character.

## CharacterAction
| Wrong | Correct |
|---|---|
| `.characterName` | `.character` |
| `.name` | `.character` |

## Scene
| Wrong | Correct |
|---|---|
| `.settingDescription` | `.description` (2-3 sentence scene description) |
| `.location` | not a top-level field — look in `continuityMemory.environmentState` |

## SceneContinuityMemory.clothingState
- Type is `string[]`, not `Record<string, string>`
- Do NOT wrap with `Object.values()` — pass directly
- Each entry is already a formatted string like "Character: clothing description"

## How to apply
When writing code that accesses Scene sub-type fields, always grep `api.schemas.d.ts` first:
```
grep -A10 "interface CharacterEmotion" lib/api-client-react/dist/generated/api.schemas.d.ts
```
