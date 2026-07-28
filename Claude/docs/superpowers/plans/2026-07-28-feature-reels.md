# Feature Reels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 vertical (1080×1920, 30fps) B2C feature-explainer reels for facestyle.fun, each combining ElevenLabs voiceover, background music, and code-driven motion graphics, ending on the existing `EndCard` component.

**Architecture:** One flexible `FeatureReel` composition (schema-driven props: headline, subline, voiceover audio, optional image set, end-card copy) renders all 5 videos — the differences between them are data, not code. Each composition has two internal `Sequence`s: a "body" (headline/subline/optional image grid, synced to voiceover) and an `EndCard` hold, mirroring the existing `SocialClip` pattern.

**Tech Stack:** Remotion 4 (`AbsoluteFill`, `Sequence`, `Audio`, `Img`, `spring`, `interpolate`), Zod schemas, `@remotion/google-fonts/Inter`, Node 24 (`--env-file`) + native `fetch` for the ElevenLabs TTS script.

## Global Constraints

- B2C only — no salon/kiosk/B2B messaging in any copy (per spec).
- Reuse the existing motion system: `EASE_ENTER`/`EASE_EXIT` from `src/motion.ts`, `BRAND` colors from `src/config.ts`. Do not invent new easing curves.
- Reuse the existing `EndCard` component unmodified for the closing segment of every video.
- `ELEVENLABS_API_KEY` lives only in `.env` (gitignored). Never hardcode it, never print it, never commit it.
- Voice: ElevenLabs premade voice `21m00Tcm4TlvDq8ikWAM` ("Rachel"), model `eleven_multilingual_v2`, used for all 5 videos.
- All new public assets go under `public/audio/feature-reels/` and `public/images/feature-reels/` (already created and populated — see Task 1).

---

## Current State (already done during planning — verify, don't redo)

The following exist on disk already, generated while researching this plan:

- `.env` — contains `ELEVENLABS_API_KEY` (verified working, gitignored via `.gitignore`).
- `scripts/generate-voiceovers.mjs` — the canonical voiceover-generation script (Node `fetch` fails in this sandboxed shell with a connect-timeout; the files below were generated via an equivalent `curl` loop as a workaround, but the `.mjs` script is what should be run/maintained going forward — see Task 2 for how to verify it).
- `public/audio/feature-reels/feature-1-instant-try-on.mp3` (6.32s)
- `public/audio/feature-reels/feature-2-multiple-looks.mp3` (6.83s)
- `public/audio/feature-reels/feature-3-before-after.mp3` (6.59s)
- `public/audio/feature-reels/feature-4-style-library.mp3` (5.34s)
- `public/audio/feature-reels/feature-5-try-before-commit.mp3` (6.18s)
- `public/audio/feature-reels/music.mp3` — copy of the user's `Style_Showcase_2026-07-27T061145.mp3` (60.0s; only the first ~11s of it is ever heard per video, since Remotion's `<Audio>` stops at the end of its enclosing `Sequence`).
- `public/images/feature-reels/look-1.png` .. `look-4.png` — copies of the user's 4 downloaded selfie/hairstyle images (same pose/background, 4 different hairstyles), for Feature 2.

Task 1 below verifies this state instead of recreating it.

**Computed frame durations** (30fps; `bodyDurationInFrames` = voice length rounded up to the next frame + 45-frame/1.5s settle pad; `EndCard` hold is a fixed 90 frames matching the existing `SocialClip`/`EndCard` pattern; total = body + 90):

| # | id | voice (s) | bodyDurationInFrames | totalDurationInFrames | total (s) |
|---|----|-----------|----------------------|------------------------|-----------|
| 1 | FeatureInstantTryOn | 6.32 | 235 | 325 | 10.83 |
| 2 | FeatureMultipleLooks | 6.83 | 250 | 340 | 11.33 |
| 3 | FeatureBeforeAfter | 6.59 | 243 | 333 | 11.10 |
| 4 | FeatureStyleLibrary | 5.34 | 206 | 296 | 9.87 |
| 5 | FeatureTryBeforeCommit | 6.18 | 231 | 321 | 10.70 |

---

### Task 1: Verify generated assets and script are in place

**Files:**
- Verify: `.env`, `.gitignore`, `scripts/generate-voiceovers.mjs`
- Verify: `public/audio/feature-reels/*.mp3` (6 files), `public/images/feature-reels/look-*.png` (4 files)

**Interfaces:**
- Produces: confirmation that all assets referenced by later tasks exist at the exact paths used in this plan.

- [ ] **Step 1: Confirm `.env` is gitignored**

Run: `git check-ignore -v .env`
Expected: prints a line showing `.gitignore:<N>:.env	.env` (confirms it's ignored, not that it's tracked).

- [ ] **Step 2: Confirm the 6 audio files and 4 image files exist**

Run:
```bash
ls public/audio/feature-reels/*.mp3
ls public/images/feature-reels/look-*.png
```
Expected: 6 `.mp3` files (`feature-1-instant-try-on.mp3` through `feature-5-try-before-commit.mp3`, plus `music.mp3`) and 4 `.png` files (`look-1.png` through `look-4.png`).

If any are missing, regenerate per Task 2 (audio) or re-copy from `~/Downloads/facestyle-*.png` (images) before continuing.

- [ ] **Step 3: Commit the verified assets**

```bash
git add public/audio/feature-reels public/images/feature-reels scripts/generate-voiceovers.mjs
git commit -m "Add feature-reel voiceover/music/image assets and generation script"
```

---

### Task 2: Fix and verify `generate-voiceovers.mjs` runs standalone

The script exists but was not successfully run in this sandbox (Node's `fetch` hit a connect-timeout that `curl` did not — likely a sandbox-specific proxy/DNS quirk, not a script bug). This task confirms the script itself is correct and re-runnable by a future engineer outside this sandbox, and makes it resilient by adding a clear error message rather than silently producing empty files.

**Files:**
- Modify: `scripts/generate-voiceovers.mjs`

**Interfaces:**
- Produces: re-running this script must overwrite `public/audio/feature-reels/feature-*.mp3` with byte-identical-in-spirit (same voice/script) output if ever regenerated.

- [ ] **Step 1: Add a response size sanity check so partial/empty failures are loud**

In `scripts/generate-voiceovers.mjs`, update `generateOne` to reject suspiciously small responses (ElevenLabs returns JSON error bodies under ~1KB on failure, real MP3s here are 80-110KB):

```javascript
	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length < 2000) {
		throw new Error(
			`ElevenLabs TTS response for ${id} looks too small (${buffer.length} bytes) — likely an error body, not audio.`,
		);
	}
	const outPath = path.join(outDir, `${id}.mp3`);
```

- [ ] **Step 2: Run it for real (outside this sandbox, or wherever network access to api.elevenlabs.io works)**

Run: `node --env-file=.env scripts/generate-voiceovers.mjs`
Expected: 5 lines like `Wrote .../feature-1-instant-try-on.mp3 (102026 bytes)`, matching the sizes already in `public/audio/feature-reels/` (see Task 1). If sizes differ meaningfully, ElevenLabs changed its output for the same input — re-measure durations with `ffprobe` and update the table in this plan's header before continuing to Task 4.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-voiceovers.mjs
git commit -m "Harden generate-voiceovers.mjs against silent empty-file failures"
```

---

### Task 3: Build the `FeatureReel` composition

**Files:**
- Create: `src/compositions/FeatureReel.tsx`
- Modify: `src/Root.tsx` (import only — Compositions added in Task 4)

**Interfaces:**
- Consumes: `EASE_ENTER`, `EASE_EXIT` from `src/motion.ts`; `BRAND` from `src/config.ts`; `EndCard` from `./EndCard` (same import as `SocialClip.tsx` uses).
- Produces: `featureReelSchema` (Zod object), `featureReelDefaultProps`, `FeatureReel` component — exact shape below, consumed by Task 4's `Root.tsx` entries.

- [ ] **Step 1: Write `src/compositions/FeatureReel.tsx`**

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	Audio,
	Img,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_ENTER, EASE_EXIT} from '../motion';
import {EndCard} from './EndCard';

const {fontFamily} = loadFont('normal', {
	weights: ['800', '400'],
	subsets: ['latin'],
});

// One schema-driven component powers all 5 feature reels — differences
// between videos are data (headline/subline/images/audio), not code.
export const featureReelSchema = z.object({
	headline: z.string(),
	subline: z.string(),
	voiceoverSrc: z.string(),
	musicSrc: z.string(),
	// 0 images = text/motion-only body. 4 images = the "one selfie, multiple
	// looks" grid reveal (Feature 2 only).
	images: z.array(z.string()),
	bodyDurationInFrames: z.number(),
	backgroundColor: z.string(),
	textColor: z.string(),
	accentColor: z.string(),
	endCardIconSrc: z.string(),
	endCardHeadlineLine1: z.string(),
	endCardHeadlineLine2: z.string(),
	endCardTagline: z.string(),
	endCardUrl: z.string(),
	endCardBackgroundColor: z.string(),
	endCardAccentColor2: z.string(),
});

export const featureReelDefaultProps: z.infer<typeof featureReelSchema> = {
	headline: 'Instant AI Try-On',
	subline: 'See your next hairstyle in seconds',
	voiceoverSrc: 'audio/feature-reels/feature-1-instant-try-on.mp3',
	musicSrc: 'audio/feature-reels/music.mp3',
	images: [],
	bodyDurationInFrames: 235,
	backgroundColor: BRAND.navy,
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
	endCardIconSrc: 'brand/facestylefun-icon.png',
	endCardHeadlineLine1: 'One Photo.',
	endCardHeadlineLine2: 'Infinite Styles.',
	endCardTagline: 'AI Face. Your Style.',
	endCardUrl: 'facestyle.fun',
	endCardBackgroundColor: BRAND.navy,
	endCardAccentColor2: BRAND.purple,
};

const IMAGE_GRID_ENTER_START = 20;
const IMAGE_STAGGER = 8;
const MUSIC_DUCK_VOLUME = 0.18;
const MUSIC_FULL_VOLUME = 0.35;
const MUSIC_DUCK_RAMP_FRAMES = 15;

const FeatureReelBody: React.FC<{
	headline: string;
	subline: string;
	images: string[];
	textColor: string;
	accentColor: string;
}> = ({headline, subline, images, textColor, accentColor}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const enter = interpolate(frame, [0, 24], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});
	const exitStart = durationInFrames - 18;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});
	const opacity = enter * (1 - exit);
	const translateY = interpolate(enter, [0, 1], [24, 0]) + exit * -12;

	return (
		<AbsoluteFill
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily,
			}}
		>
			<div
				style={{
					opacity,
					transform: `translateY(${translateY}px)`,
					textAlign: 'center',
					maxWidth: '88%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						fontSize: 72,
						fontWeight: 800,
						color: textColor,
						lineHeight: 1.15,
						textShadow: '0 8px 40px rgba(0,0,0,0.35)',
					}}
				>
					{headline}
				</div>
				<div
					style={{
						marginTop: 20,
						fontSize: 30,
						fontWeight: 400,
						color: accentColor,
						letterSpacing: 1,
					}}
				>
					{subline}
				</div>

				{images.length > 0 && (
					<div
						style={{
							marginTop: 48,
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: 16,
							width: 640,
						}}
					>
						{images.map((src, i) => {
							const imgFrame =
								frame - (IMAGE_GRID_ENTER_START + i * IMAGE_STAGGER);
							const imgEntrance = spring({
								frame: imgFrame,
								fps: 30,
								config: {damping: 16, stiffness: 130, mass: 0.5},
							});
							const imgScale = interpolate(imgEntrance, [0, 1], [0.85, 1]);

							return (
								<Img
									key={src}
									src={staticFile(src)}
									style={{
										width: '100%',
										aspectRatio: '1 / 1',
										objectFit: 'cover',
										borderRadius: 16,
										opacity: imgEntrance,
										transform: `scale(${imgScale})`,
										border: `2px solid ${accentColor}55`,
									}}
								/>
							);
						})}
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};

export const FeatureReel: React.FC<z.infer<typeof featureReelSchema>> = ({
	headline,
	subline,
	voiceoverSrc,
	musicSrc,
	images,
	bodyDurationInFrames,
	backgroundColor,
	textColor,
	accentColor,
	endCardIconSrc,
	endCardHeadlineLine1,
	endCardHeadlineLine2,
	endCardTagline,
	endCardUrl,
	endCardBackgroundColor,
	endCardAccentColor2,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor}}>
			<Audio
				src={staticFile(musicSrc)}
				volume={(frame) => {
					if (frame < bodyDurationInFrames) {
						return MUSIC_DUCK_VOLUME;
					}
					return interpolate(
						frame,
						[
							bodyDurationInFrames,
							bodyDurationInFrames + MUSIC_DUCK_RAMP_FRAMES,
						],
						[MUSIC_DUCK_VOLUME, MUSIC_FULL_VOLUME],
						{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
					);
				}}
			/>
			<Sequence from={0} durationInFrames={bodyDurationInFrames}>
				<Audio src={staticFile(voiceoverSrc)} />
				<FeatureReelBody
					headline={headline}
					subline={subline}
					images={images}
					textColor={textColor}
					accentColor={accentColor}
				/>
			</Sequence>
			<Sequence from={bodyDurationInFrames}>
				<EndCard
					iconSrc={endCardIconSrc}
					headlineLine1={endCardHeadlineLine1}
					headlineLine2={endCardHeadlineLine2}
					tagline={endCardTagline}
					url={endCardUrl}
					backgroundColor={endCardBackgroundColor}
					textColor={textColor}
					accentColor={accentColor}
					accentColor2={endCardAccentColor2}
				/>
			</Sequence>
		</AbsoluteFill>
	);
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `FeatureReel.tsx`. (Pre-existing unrelated errors elsewhere in the project, if any, are out of scope — only confirm nothing new points to this file.)

- [ ] **Step 3: Commit**

```bash
git add src/compositions/FeatureReel.tsx
git commit -m "Add FeatureReel composition for the 5 B2C feature explainer videos"
```

---

### Task 4: Wire up all 5 compositions in `Root.tsx`

**Files:**
- Modify: `src/Root.tsx`

**Interfaces:**
- Consumes: `FeatureReel`, `featureReelSchema`, `featureReelDefaultProps` from `./compositions/FeatureReel` (Task 3).

- [ ] **Step 1: Add the import**

In `src/Root.tsx`, add alongside the other composition imports (after the `TransparentOverlay` import block):

```tsx
import {
	FeatureReel,
	featureReelDefaultProps,
	featureReelSchema,
} from './compositions/FeatureReel';
```

- [ ] **Step 2: Add the 5 `<Composition>` entries**

Insert before the closing `</>` in `RemotionRoot`, after the `BeforeAfterReveal4x5` composition:

```tsx
			{/* 5 B2C feature-explainer reels: ElevenLabs voiceover + music + motion
			    graphics, each ending on the shared EndCard. Durations = voiceover
			    length (rounded up) + 45-frame settle pad + 90-frame EndCard hold —
			    see docs/superpowers/plans/2026-07-28-feature-reels.md for the math. */}
			<Composition
				id="FeatureInstantTryOn"
				component={FeatureReel}
				durationInFrames={325}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Instant AI Try-On',
					subline: 'See your next hairstyle in seconds',
					voiceoverSrc: 'audio/feature-reels/feature-1-instant-try-on.mp3',
					images: [],
					bodyDurationInFrames: 235,
				}}
			/>
			<Composition
				id="FeatureMultipleLooks"
				component={FeatureReel}
				durationInFrames={340}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'One Selfie. Multiple Looks.',
					subline: 'Every style, from a single photo',
					voiceoverSrc: 'audio/feature-reels/feature-2-multiple-looks.mp3',
					images: [
						'images/feature-reels/look-1.png',
						'images/feature-reels/look-2.png',
						'images/feature-reels/look-3.png',
						'images/feature-reels/look-4.png',
					],
					bodyDurationInFrames: 250,
				}}
			/>
			<Composition
				id="FeatureBeforeAfter"
				component={FeatureReel}
				durationInFrames={333}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Before/After Confidence',
					subline: 'See it side by side before you commit',
					voiceoverSrc: 'audio/feature-reels/feature-3-before-after.mp3',
					images: [],
					bodyDurationInFrames: 243,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="FeatureStyleLibrary"
				component={FeatureReel}
				durationInFrames={296}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Hundreds of Styles',
					subline: 'Trending cuts and colors, ready to try',
					voiceoverSrc: 'audio/feature-reels/feature-4-style-library.mp3',
					images: [],
					bodyDurationInFrames: 206,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="FeatureTryBeforeCommit"
				component={FeatureReel}
				durationInFrames={321}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'No More Bad Haircuts',
					subline: 'Try any style free, right now',
					voiceoverSrc: 'audio/feature-reels/feature-5-try-before-commit.mp3',
					images: [],
					bodyDurationInFrames: 231,
				}}
			/>
```

- [ ] **Step 3: Add the `BRAND` import if not already present**

`src/Root.tsx` does not currently import `BRAND` (only `PRESETS`/`VIDEO_*`). Update the existing config import line:

```tsx
import {BRAND, PRESETS, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from './config';
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Start Remotion Studio and visually confirm all 5 appear**

Run: `npm run studio`
Expected: the composition list includes `FeatureInstantTryOn`, `FeatureMultipleLooks`, `FeatureBeforeAfter`, `FeatureStyleLibrary`, `FeatureTryBeforeCommit`. Open each once — headline/subline render, voiceover audio is audible on scrub, and `FeatureMultipleLooks` shows the 2×2 image grid. Stop the studio after confirming (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add src/Root.tsx
git commit -m "Wire up 5 feature-reel compositions in Root.tsx"
```

---

### Task 5: Render all 5 videos

**Files:**
- None created/modified — this task only produces render output in `out/` (gitignored).

**Interfaces:**
- Consumes: the 5 composition IDs registered in Task 4.

- [ ] **Step 1: Render each composition**

```bash
npx remotion render FeatureInstantTryOn out/feature-reels/instant-try-on.mp4
npx remotion render FeatureMultipleLooks out/feature-reels/multiple-looks.mp4
npx remotion render FeatureBeforeAfter out/feature-reels/before-after.mp4
npx remotion render FeatureStyleLibrary out/feature-reels/style-library.mp4
npx remotion render FeatureTryBeforeCommit out/feature-reels/try-before-commit.mp4
```
Expected: each command ends with `Your video is ready!` and a file path under `out/feature-reels/`.

- [ ] **Step 2: Verify duration and dimensions of each output**

```bash
for f in out/feature-reels/*.mp4; do
  echo "$f:"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of default=noprint_wrappers=1 "$f"
done
```
Expected: every file reports `width=1080`, `height=1920`, and a duration matching the "total (s)" column in this plan's header table (±0.1s).

- [ ] **Step 3: Spot-check audio is present and not silent**

```bash
for f in out/feature-reels/*.mp4; do
  echo "$f:"
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 "$f"
done
```
Expected: `codec_name=aac` (or similar) printed for every file — confirms an audio track was muxed in, not just video.

No commit needed — `out/` is gitignored render output, not source.

---

## Follow-ups (explicitly out of scope for this plan)

- The `generate-voiceovers.mjs` `fetch` connect-timeout inside this sandbox is environment-specific (curl worked identically). If it recurs in a different environment, swap `fetch` for `curl` via `child_process.execFile` rather than debugging the sandbox network stack further.
- No automated visual regression testing exists for this project (no test runner configured) — verification here is manual Studio playback + ffprobe checks on the rendered output, matching how the existing `BeforeAfterReveal`/`SocialClip` compositions were validated.
