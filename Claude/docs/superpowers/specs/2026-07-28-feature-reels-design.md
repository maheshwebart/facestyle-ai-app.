# FaceStyle.fun Feature Reels — Design

## Goal

Produce 5 vertical (9:16, 1080×1920, 30fps) motion-graphics videos for facestyle.fun, each showcasing one B2C feature through text, motion graphics, and voiceover narration. These are separate from the 15 existing before/after transformation reels — these are pure feature-explainer/marketing reels.

## The 5 features

1. **Instant AI Try-On** — snap a selfie, see a new hairstyle in seconds.
2. **One Selfie, Multiple Looks** — try many hairstyles from a single photo. Uses the 4 real sample images the user generated and downloaded (`facestyle-*.png` in Downloads — same selfie pose/background, 4 different hairstyles) as a carousel/grid reveal.
3. **Before/After Confidence** — see your transformation side-by-side before committing to a cut.
4. **Huge Style Library** — dozens of trending cuts/colors to browse and try.
5. **Try Before You Commit** — closing CTA reel: no bad haircuts, no guesswork, try free at facestyle.fun.

All 5 are B2C only — no salon/kiosk/B2B messaging.

## Per-video structure

- Duration: ~10-12 seconds (300-360 frames @ 30fps), varies slightly per script length.
- One short, punchy voiceover line per video (not a full paragraph) — ElevenLabs TTS, single consistent voice across all 5 for brand cohesion.
- Background music: the user's own `Style_Showcase_2026-07-27T061145.mp3` (from Downloads, ElevenLabs-generated, 60s), trimmed to each video's length and ducked under the voiceover (lower volume while narration plays).
- Text/motion graphics synced to narration beats — reusing the existing spring-based entrance/exit patterns (`EASE_ENTER`/`EASE_EXIT` from `src/motion.ts`) and `BRAND` palette from `src/config.ts`.
- Video 2 ("One Selfie, Multiple Looks") uses the 4 real downloaded selfie images as actual visual content in a grid/carousel reveal. The other 4 videos are text/motion/shape-driven — no real photos required, but the user has approved generating additional images via Kling if a specific video needs one (e.g. a library/grid of style thumbnails for video 4). Only generate images if a video genuinely needs one; default to typographic/motion treatment first.
- All 5 end on the existing `EndCard` component for consistent branding — same pattern as `SocialClip` (branded segment → hard cut to end card).

## Technical implementation

- **Voiceover generation**: `scripts/generate-voiceovers.mjs` — reads 5 short scripts, calls ElevenLabs TTS (`ELEVENLABS_API_KEY` from `.env`, already verified working and gitignored), saves MP3s to `public/audio/feature-reels/`. One picked voice (energetic/warm, fitting a beauty-tech brand) reused across all 5 calls.
- **Assets**: the 4 downloaded selfie images copied into `public/images/feature-reels/`. `Style_Showcase` music copied into `public/audio/feature-reels/music.mp3`.
- **New component**: `src/compositions/FeatureReel.tsx` — one schema-driven component powering all 5 reels (title/headline, supporting text beats, voiceover audio src, optional image set for the carousel variant, music src). Differences between the 5 videos are data (props), not separate components.
- **Root.tsx**: 5 new `<Composition>` entries, each ~300-360 frames @ 1080×1920×30fps, with per-video `defaultProps` (script text, audio file, image set where applicable).
- **Audio in Remotion**: use `@remotion/media` (already a dependency) for `<Audio>`/`<Video>` playback of the voiceover + music tracks, with volume keyframing to duck music under narration.
- **Rendering**: existing `remotion render` CLI, one render per composition — output to `out/` (matches existing gitignored pattern).

## Out of scope

- B2B/salon/kiosk messaging.
- New music generation (reusing the user's existing ElevenLabs music track, not requesting new ones unless the trimmed 60s track doesn't cover all 5 needs — it does, since each video only needs ~10-12s and can reuse/loop the same track).
- Editing or re-rendering the existing 15 before/after reels.
