# FaceStyle.fun Feature Benefit Reels — Design

## Goal

Produce 6 vertical (9:16, 1080×1920, 30fps) motion-graphics videos for facestyle.fun, each explaining one feature and its benefit in a more elaborate/longer format (~20-30s) than the earlier 5-video batch. These use real Kling-generated young-model photos as the visual centerpiece of each video (one bold full-bleed photo at a time, not a grid), combined with animated text and voiceover.

These are a new, third batch — separate from the 5 typographic-only reels in `out/feature-reels/` and the 5 trending-hairstyle reels in `out/feature-reels-v2/`.

## The 6 features

1. **Instant AI Render** — studio-grade hairstyle preview in under 20 seconds. Removes the "waiting" friction.
2. **Privacy-First** — your photos, your control. Removes the trust/fear friction of uploading a selfie.
3. **Hairstyle-Only Try-On** — see any cut or color on your actual face before committing. Core product feature.
4. **Dress Try-On** — see yourself in an outfit before you buy it. Confirmed real feature (`data/styles/dresses.csv`, `Galllery/women/` in the facestyle-cam-ai repo).
5. **Hairstyle + Sunglasses Matching** — complete look styling, hair and accessories matched together. Confirmed real feature (`data/styles/glasses.csv`, `data/styles/sunglasses.csv`).
6. **Play With Your Look** (closing/summary video) — mix hairstyle, dress, and glasses to find your best combo. Positioned as the finale that ties the other 5 together.

All 6 are B2C only — no salon/kiosk/B2B messaging, consistent with the existing feature-reel batches.

## Per-video structure

- Duration: ~20-30 seconds (600-900 frames @ 30fps), varies per script/photo pacing — longer and more elaborate than the prior batch's ~10-12s.
- Structure: **headline beat** (animated text, no photo yet) → **photo 1** (full-bleed, one bold photo with a short supporting line) → **photo 2** (full-bleed, second photo with the benefit statement) → **EndCard**. Exactly one photo fills the frame at a time — explicitly no 2×2/grid layout (this is a deliberate change from the existing `FeatureReel.tsx` grid pattern used for Feature 2 in the prior batch).
- One voiceover line per video (ElevenLabs TTS, same voice/model as the prior batch — premade voice `21m00Tcm4TlvDq8ikWAM` "Rachel", `eleven_multilingual_v2` — for brand cohesion across all three batches), scripted to match the longer runtime (roughly 45-65 words vs. the prior batch's ~15-20).
- Background music: reuse the user's existing `Style_Showcase_2026-07-27T061145.mp3` / `public/audio/feature-reels/music.mp3`, ducked under the voiceover exactly as in `FeatureReel.tsx` (same duck/ramp pattern).
- Text/motion graphics reuse `EASE_ENTER`/`EASE_EXIT` from `src/motion.ts` and `BRAND` palette from `src/config.ts`. Photo entrances use `spring` (matching the existing image-grid entrance pattern in `FeatureReel.tsx`, adapted to a single full-bleed photo instead of 4 small tiles).
- All 6 end on the existing `EndCard` component, unmodified — same pattern as both prior batches.

## Images

- 12 total (2 per video), generated via Kling (`kling-image-v3_0` model), aspect ratio `9:16`, depicting young adult models in a context matching each feature (plain selfie vs. styled result, hairstyle-only, dress result, hair+sunglasses combo, full mixed looks for the closer).
- Each generation job is charged; images are generated once during implementation and saved as static files under `public/images/feature-benefit-reels/`, not regenerated at render time.
- Prompts must explicitly specify "young adult" model, photorealistic, and the specific styling result per video — written out per-image in the implementation plan so each Kling call is deliberate (no trial/exploratory generations).

## Technical implementation

- **Voiceover generation**: extend `scripts/generate-voiceovers.mjs` (or add a sibling script) to generate 6 new longer voiceover lines, saved to `public/audio/feature-benefit-reels/`.
- **Images**: 12 Kling-generated photos saved to `public/images/feature-benefit-reels/`.
- **New component**: `src/compositions/FeatureBenefitReel.tsx` — schema-driven, similar shape to `FeatureReel.tsx` (headline/subline, voiceover src, music src, EndCard props) but with a `photos: [{src, caption}, {src, caption}]` structure instead of an `images: string[]` grid, and three internal `Sequence`s (headline, photo 1, photo 2) before the `EndCard` sequence.
- **Root.tsx**: 6 new `<Composition>` entries, each ~600-900 frames @ 1080×1920×30fps, with per-video `defaultProps`.
- **Audio in Remotion**: `<Audio>` for voiceover + music with volume keyframing to duck music under narration, matching `FeatureReel.tsx`.
- **Rendering**: existing `remotion render` CLI, one render per composition, output to `out/feature-benefit-reels/` (gitignored).

## Out of scope

- B2B/salon/kiosk messaging.
- Modifying the existing `FeatureReel.tsx` grid component or its 5 rendered videos, or the `feature-reels-v2` trending-hairstyle batch.
- New background music (reusing the existing track).
- Generating more than the 12 planned Kling images without explicit approval — if a prompt result is unusable, re-prompting is fine, but expanding the count requires checking back in.
