# Feature Benefit Reels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 vertical (1080×1920, 30fps) B2C feature-benefit reels for facestyle.fun, each ~20-30s, combining an ElevenLabs voiceover, ducked background music, a headline beat, two full-bleed Kling-generated young-model photos (no grid), and the existing shared `EndCard`.

**Architecture:** One flexible `FeatureBenefitReel` composition (schema-driven props) renders all 6 videos — differences between them are data (headline/subline/photo captions/audio/durations), not code. Each composition has a "body" `Sequence` (headline beat → photo 1 beat → photo 2 beat, each a nested `Sequence` occupying one third of the body) followed by the shared `EndCard` `Sequence`, mirroring the existing `FeatureReel.tsx`/`SocialClip.tsx` pattern.

**Tech Stack:** Remotion 4 (`AbsoluteFill`, `Sequence`, `Audio`, `Img`, `spring`, `interpolate`), Zod schemas, `@remotion/google-fonts/Inter`, Node 24 (`--env-file`) + native `fetch` for ElevenLabs TTS, Kling MCP (`kling-image-v3_0` model) for the 12 model photos.

## Global Constraints

- B2C only — no salon/kiosk/B2B messaging in any copy.
- Reuse the existing motion system: `EASE_ENTER`/`EASE_EXIT` from `src/motion.ts`, `BRAND` colors from `src/config.ts`. Do not invent new easing curves.
- Reuse the existing `EndCard` component unmodified for the closing segment of every video.
- Exactly one photo fills the frame at a time per beat — **no grid layout** (explicit change from `FeatureReel.tsx`'s 2×2 grid pattern).
- `ELEVENLABS_API_KEY` lives only in `.env` (gitignored). Never hardcode it, never print it, never commit it.
- Voice: ElevenLabs premade voice `21m00Tcm4TlvDq8ikWAM` ("Rachel"), model `eleven_multilingual_v2` — same as the prior 5-video batch, for brand cohesion.
- Kling images: model `kling-image-v3_0`, `aspect_ratio: "9:16"`, `img_resolution: "2k"`. 12 images total (2 per video) — do not generate more without checking back in; each job is charged.
- Do not modify `FeatureReel.tsx`, its 5 rendered videos, or the `feature-reels-v2` batch.
- New public assets go under `public/audio/feature-benefit-reels/` and `public/images/feature-benefit-reels/`.

---

### Task 1: Generate the 12 Kling model photos

**Files:**
- Create: `public/images/feature-benefit-reels/benefit-1-photo-1.jpg` .. `benefit-6-photo-2.jpg` (12 files)

**Interfaces:**
- Produces: 12 JPG files at the exact paths used by Task 4's `Root.tsx` `defaultProps`.

- [ ] **Step 1: Call the Kling `text_to_image` tool once per photo below**, model `kling-image-v3_0`, arguments `img_resolution=2k`, `aspect_ratio=9:16`, `imageCount=1`, using this exact prompt text:

  | id | prompt |
  |----|--------|
  | benefit-1-photo-1 | Photorealistic portrait of a young woman in her early twenties, no makeup, taking a plain casual selfie indoors, neutral expression, soft natural window light, plain light gray wall background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit-1-photo-2 | Photorealistic portrait of a young woman in her early twenties with a glamorous voluminous blowout hairstyle, soft studio lighting, confident smile, plain dark teal gradient background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit-2-photo-1 | Photorealistic portrait of a young adult holding up a smartphone taking a selfie, casual candid moment, soft indoor lighting, plain neutral background, vertical portrait composition, no text, no logos |
  | benefit-2-photo-2 | Photorealistic close-up portrait of a young adult smiling confidently and relaxed, soft warm lighting, plain navy blue background, vertical portrait composition, no text, no logos |
  | benefit-3-photo-1 | Photorealistic portrait of a young woman in her early twenties with sleek straight long hair, natural daylight, plain soft pink background, vertical portrait composition, no text, no logos |
  | benefit-3-photo-2 | Photorealistic portrait of a young woman in her early twenties with a curly voluminous bob haircut, natural daylight, plain soft pink background, vertical portrait composition, no text, no logos |
  | benefit-4-photo-1 | Photorealistic full-body fashion photo of a young woman in her early twenties wearing a plain casual t-shirt and jeans, studio lighting, plain light gray background, vertical fashion photo composition, no text, no logos |
  | benefit-4-photo-2 | Photorealistic full-body fashion photo of a young woman in her early twenties wearing an elegant fitted cocktail dress, studio lighting, plain light gray background, vertical fashion photo composition, no text, no logos |
  | benefit-5-photo-1 | Photorealistic portrait of a young man in his early twenties with a modern textured crop hairstyle, natural daylight, plain warm beige background, vertical portrait composition, no text, no logos |
  | benefit-5-photo-2 | Photorealistic portrait of a young man in his early twenties with a modern textured crop hairstyle wearing stylish round sunglasses, natural daylight, plain warm beige background, vertical portrait composition, no text, no logos |
  | benefit-6-photo-1 | Photorealistic full-body fashion photo of a young woman in her early twenties with wavy long hair, wearing a stylish blazer dress and sunglasses, confident pose, golden hour outdoor lighting, vertical fashion photo composition, no text, no logos |
  | benefit-6-photo-2 | Photorealistic full-body fashion photo of a young man in his early twenties with a modern fade haircut, wearing a smart casual outfit and sunglasses, confident pose, golden hour outdoor lighting, vertical fashion photo composition, no text, no logos |

- [ ] **Step 2: Poll `query_tasks` for each generation until complete**, retrieve the resulting image URL for each.

- [ ] **Step 3: Download each image to its exact path**

```bash
mkdir -p public/images/feature-benefit-reels
curl -sL "<image-url>" -o "public/images/feature-benefit-reels/benefit-1-photo-1.jpg"
# repeat for all 12
```

- [ ] **Step 4: Verify all 12 files exist and are non-trivial size**

```bash
ls -la public/images/feature-benefit-reels/ | wc -l
```
Expected: 12 image files, each >20KB (a truncated/error download would be much smaller).

- [ ] **Step 5: Commit**

```bash
git add public/images/feature-benefit-reels
git commit -m "Add 12 Kling-generated model photos for feature-benefit reels"
```

---

### Task 2: Write and run the voiceover generation script

**Files:**
- Create: `scripts/generate-benefit-voiceovers.mjs`

**Interfaces:**
- Produces: `public/audio/feature-benefit-reels/benefit-1-instant-render.mp3` .. `benefit-6-play-with-your-look.mp3` (6 files), consumed by Task 4's `Root.tsx` `defaultProps`.

- [ ] **Step 1: Write `scripts/generate-benefit-voiceovers.mjs`**

```javascript
// Generates the 6 feature-benefit-reel voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-benefit-voiceovers.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'audio', 'feature-benefit-reels');

// Rachel — same voice as the prior feature-reels batch, for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'benefit-1-instant-render',
		text: 'Waiting for a haircut result used to take forever. Not anymore. Upload one selfie, and in under twenty seconds, see a studio-grade preview of your new look, styled and ready to compare, before you ever touch a comb or scissors.',
	},
	{
		id: 'benefit-2-privacy-first',
		text: 'Uploading your face online can feel risky. FaceStyle keeps it simple. Your photo stays yours. Nothing is shared, nothing lingers without your say. Try on any hairstyle with total confidence, knowing your picture never leaves your control.',
	},
	{
		id: 'benefit-3-hairstyle-try-on',
		text: 'Before you ever sit in the chair, see the cut on your own face, not a stranger. Switch between styles instantly, compare them side by side, and walk into your next appointment already knowing exactly what you want.',
	},
	{
		id: 'benefit-4-dress-try-on',
		text: 'Buying an outfit online is a gamble, until now. Upload your photo, try the dress, and see exactly how it looks on you, not a model. Shop with confidence, skip the guesswork, and love what shows up at your door.',
	},
	{
		id: 'benefit-5-hairstyle-sunglasses',
		text: 'A great look is more than just hair. FaceStyle pairs your new hairstyle with sunglasses that actually match your face shape, so every detail works together, not just the cut.',
	},
	{
		id: 'benefit-6-play-with-your-look',
		text: 'Hair, dresses, sunglasses. Mix and match until you find the look that is unmistakably you. One photo, endless combinations. Play with your look, free, right now, at facestyle dot fun.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-benefit-voiceovers.mjs');
	}

	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
		{
			method: 'POST',
			headers: {
				'xi-api-key': apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({text, model_id: MODEL_ID}),
		},
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`ElevenLabs TTS failed for ${id}: ${response.status} ${body}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length < 2000) {
		throw new Error(
			`ElevenLabs TTS response for ${id} looks too small (${buffer.length} bytes) — likely an error body, not audio.`,
		);
	}
	const outPath = path.join(outDir, `${id}.mp3`);
	await fs.writeFile(outPath, buffer);
	console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
}

async function main() {
	await fs.mkdir(outDir, {recursive: true});
	for (const script of scripts) {
		await generateOne(script);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
```

- [ ] **Step 2: Run it**

Run: `node --env-file=.env scripts/generate-benefit-voiceovers.mjs`
Expected: 6 lines like `Wrote .../benefit-1-instant-render.mp3 (NNNNN bytes)`. If `fetch` hits a sandbox connect-timeout (as happened for the prior batch), use an equivalent `curl` loop instead — see Task 2 note in `docs/superpowers/plans/2026-07-28-feature-reels.md` for the working workaround pattern, then still keep this `.mjs` file as the maintained script.

- [ ] **Step 3: Measure each file's duration**

```bash
for f in public/audio/feature-benefit-reels/*.mp3; do
  echo "$f: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")"
done
```
Record these 6 durations — Task 4 needs them to compute `bodyDurationInFrames`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-benefit-voiceovers.mjs public/audio/feature-benefit-reels
git commit -m "Add feature-benefit-reel voiceover generation script and generated audio"
```

---

### Task 3: Build the `FeatureBenefitReel` composition

**Files:**
- Create: `src/compositions/FeatureBenefitReel.tsx`

**Interfaces:**
- Consumes: `EASE_ENTER`, `EASE_EXIT` from `src/motion.ts`; `BRAND` from `src/config.ts`; `EndCard` from `./EndCard`.
- Produces: `featureBenefitReelSchema` (Zod object), `featureBenefitReelDefaultProps`, `FeatureBenefitReel` component — exact shape below, consumed by Task 4's `Root.tsx` entries.

- [ ] **Step 1: Write `src/compositions/FeatureBenefitReel.tsx`**

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

// One schema-driven component powers all 6 feature-benefit reels — the
// differences between videos are data (headline/captions/photos/audio), not
// code. Unlike FeatureReel.tsx's 2x2 grid, this always shows exactly one
// full-bleed photo at a time.
export const featureBenefitReelSchema = z.object({
	headline: z.string(),
	subline: z.string(),
	voiceoverSrc: z.string(),
	musicSrc: z.string(),
	photo1Src: z.string(),
	photo1Caption: z.string(),
	photo2Src: z.string(),
	photo2Caption: z.string(),
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

export const featureBenefitReelDefaultProps: z.infer<
	typeof featureBenefitReelSchema
> = {
	headline: 'Instant AI Render',
	subline: 'Studio-grade previews in under 20 seconds',
	voiceoverSrc: 'audio/feature-benefit-reels/benefit-1-instant-render.mp3',
	musicSrc: 'audio/feature-reels/music.mp3',
	photo1Src: 'images/feature-benefit-reels/benefit-1-photo-1.jpg',
	photo1Caption: 'Upload one selfie',
	photo2Src: 'images/feature-benefit-reels/benefit-1-photo-2.jpg',
	photo2Caption: 'See your new look in seconds',
	bodyDurationInFrames: 600,
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

const MUSIC_DUCK_VOLUME = 0.18;
const MUSIC_FULL_VOLUME = 0.35;
const MUSIC_DUCK_RAMP_FRAMES = 15;
const BEAT_EXIT_FRAMES = 14;
const PHOTO_ENTRANCE_CONFIG = {damping: 18, stiffness: 120, mass: 0.6};

const HeadlineBeat: React.FC<{
	headline: string;
	subline: string;
	textColor: string;
	accentColor: string;
}> = ({headline, subline, textColor, accentColor}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const enter = interpolate(frame, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});
	const exitStart = durationInFrames - BEAT_EXIT_FRAMES;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});
	const opacity = enter * (1 - exit);
	const translateY = interpolate(enter, [0, 1], [24, 0]) + exit * -12;

	return (
		<AbsoluteFill
			style={{alignItems: 'center', justifyContent: 'center', fontFamily}}
		>
			<div
				style={{
					opacity,
					transform: `translateY(${translateY}px)`,
					textAlign: 'center',
					maxWidth: '86%',
				}}
			>
				<div
					style={{
						fontSize: 76,
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
						marginTop: 22,
						fontSize: 32,
						fontWeight: 400,
						color: accentColor,
						letterSpacing: 1,
					}}
				>
					{subline}
				</div>
			</div>
		</AbsoluteFill>
	);
};

const PhotoBeat: React.FC<{
	src: string;
	caption: string;
	textColor: string;
	accentColor: string;
}> = ({src, caption, textColor, accentColor}) => {
	const frame = useCurrentFrame();
	const {durationInFrames, fps} = useVideoConfig();

	const entrance = spring({frame, fps, config: PHOTO_ENTRANCE_CONFIG});
	const scale = interpolate(entrance, [0, 1], [1.08, 1]);
	const exitStart = durationInFrames - BEAT_EXIT_FRAMES;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});
	const opacity = entrance * (1 - exit);
	const captionEnter = interpolate(frame, [10, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});

	return (
		<AbsoluteFill style={{fontFamily}}>
			<Img
				src={staticFile(src)}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity,
					transform: `scale(${scale})`,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)',
				}}
			/>
			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'flex-end',
					paddingBottom: 140,
				}}
			>
				<div
					style={{
						opacity: captionEnter * (1 - exit),
						transform: `translateY(${(1 - captionEnter) * 16}px)`,
						fontSize: 40,
						fontWeight: 800,
						color: textColor,
						textAlign: 'center',
						maxWidth: '84%',
						textShadow: '0 4px 20px rgba(0,0,0,0.6)',
						borderBottom: `3px solid ${accentColor}`,
						paddingBottom: 12,
					}}
				>
					{caption}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const FeatureBenefitReelBody: React.FC<{
	headline: string;
	subline: string;
	photo1Src: string;
	photo1Caption: string;
	photo2Src: string;
	photo2Caption: string;
	textColor: string;
	accentColor: string;
}> = ({
	headline,
	subline,
	photo1Src,
	photo1Caption,
	photo2Src,
	photo2Caption,
	textColor,
	accentColor,
}) => {
	const {durationInFrames} = useVideoConfig();
	const headlineEnd = Math.round(durationInFrames / 3);
	const photo1End = Math.round((durationInFrames * 2) / 3);

	return (
		<AbsoluteFill>
			<Sequence from={0} durationInFrames={headlineEnd}>
				<HeadlineBeat
					headline={headline}
					subline={subline}
					textColor={textColor}
					accentColor={accentColor}
				/>
			</Sequence>
			<Sequence from={headlineEnd} durationInFrames={photo1End - headlineEnd}>
				<PhotoBeat
					src={photo1Src}
					caption={photo1Caption}
					textColor={textColor}
					accentColor={accentColor}
				/>
			</Sequence>
			<Sequence from={photo1End} durationInFrames={durationInFrames - photo1End}>
				<PhotoBeat
					src={photo2Src}
					caption={photo2Caption}
					textColor={textColor}
					accentColor={accentColor}
				/>
			</Sequence>
		</AbsoluteFill>
	);
};

export const FeatureBenefitReel: React.FC<
	z.infer<typeof featureBenefitReelSchema>
> = ({
	headline,
	subline,
	voiceoverSrc,
	musicSrc,
	photo1Src,
	photo1Caption,
	photo2Src,
	photo2Caption,
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
				<FeatureBenefitReelBody
					headline={headline}
					subline={subline}
					photo1Src={photo1Src}
					photo1Caption={photo1Caption}
					photo2Src={photo2Src}
					photo2Caption={photo2Caption}
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
Expected: no errors referencing `FeatureBenefitReel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/compositions/FeatureBenefitReel.tsx
git commit -m "Add FeatureBenefitReel composition for the 6 feature-benefit videos"
```

---

### Task 4: Wire up all 6 compositions in `Root.tsx`

**Files:**
- Modify: `src/Root.tsx`

**Interfaces:**
- Consumes: `FeatureBenefitReel`, `featureBenefitReelSchema`, `featureBenefitReelDefaultProps` from `./compositions/FeatureBenefitReel` (Task 3); the 6 measured voiceover durations from Task 2 Step 3; the 12 photo paths from Task 1.

- [ ] **Step 1: Compute `bodyDurationInFrames` for each video**

Using the durations measured in Task 2 Step 3 (`voiceSeconds`), compute for each video:
```
bodyDurationInFrames = Math.ceil(voiceSeconds * 30) + 45   // 45-frame / 1.5s settle pad, same convention as the prior batch
totalDurationInFrames = bodyDurationInFrames + 90            // 90-frame EndCard hold, same as FeatureReel.tsx
```
Fill in the actual numbers from your measurements before Step 2 — do not use the placeholder `600` from `featureBenefitReelDefaultProps`.

- [ ] **Step 2: Add the import**

In `src/Root.tsx`, add alongside the other composition imports:

```tsx
import {
	FeatureBenefitReel,
	featureBenefitReelDefaultProps,
	featureBenefitReelSchema,
} from './compositions/FeatureBenefitReel';
```

- [ ] **Step 3: Add the 6 `<Composition>` entries**

Insert after the existing `FeatureTryBeforeCommit` composition (using your computed durations from Step 1 in place of `<TOTAL_N>`/`<BODY_N>`):

```tsx
			{/* 6 B2C feature-benefit reels: longer (~20-30s) format with Kling
			    model photos, ElevenLabs voiceover, and music, each ending on the
			    shared EndCard. See docs/superpowers/plans/2026-07-30-feature-benefit-reels.md. */}
			<Composition
				id="BenefitInstantRender"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_1>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Instant AI Render',
					subline: 'Studio-grade previews in under 20 seconds',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-1-instant-render.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-1-photo-1.jpg',
					photo1Caption: 'Upload one selfie',
					photo2Src: 'images/feature-benefit-reels/benefit-1-photo-2.jpg',
					photo2Caption: 'See your new look in seconds',
					bodyDurationInFrames: <BODY_1>,
				}}
			/>
			<Composition
				id="BenefitPrivacyFirst"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_2>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Privacy-First',
					subline: 'Your photos. Your control.',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-2-privacy-first.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-2-photo-1.jpg',
					photo1Caption: 'You take the photo',
					photo2Src: 'images/feature-benefit-reels/benefit-2-photo-2.jpg',
					photo2Caption: 'It stays yours, always',
					bodyDurationInFrames: <BODY_2>,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="BenefitHairstyleTryOn"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_3>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Hairstyle-Only Try-On',
					subline: 'See the cut before you commit',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-3-hairstyle-try-on.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-3-photo-1.jpg',
					photo1Caption: 'Try a sleek straight look',
					photo2Src: 'images/feature-benefit-reels/benefit-3-photo-2.jpg',
					photo2Caption: 'Or a bold curly bob',
					bodyDurationInFrames: <BODY_3>,
				}}
			/>
			<Composition
				id="BenefitDressTryOn"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_4>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Dress Try-On',
					subline: 'See it on you before you buy',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-4-dress-try-on.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-4-photo-1.jpg',
					photo1Caption: 'Start with your everyday look',
					photo2Src: 'images/feature-benefit-reels/benefit-4-photo-2.jpg',
					photo2Caption: 'See the dress on you instantly',
					bodyDurationInFrames: <BODY_4>,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="BenefitHairstyleSunglasses"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_5>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Hair + Sunglasses Matching',
					subline: 'A complete look, matched for you',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-5-hairstyle-sunglasses.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-5-photo-1.jpg',
					photo1Caption: 'Pick your hairstyle',
					photo2Src: 'images/feature-benefit-reels/benefit-5-photo-2.jpg',
					photo2Caption: 'Add sunglasses that match',
					bodyDurationInFrames: <BODY_5>,
				}}
			/>
			<Composition
				id="BenefitPlayWithYourLook"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_6>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Play With Your Look',
					subline: 'Hair. Dress. Glasses. Your call.',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-6-play-with-your-look.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-6-photo-1.jpg',
					photo1Caption: 'Mix and match freely',
					photo2Src: 'images/feature-benefit-reels/benefit-6-photo-2.jpg',
					photo2Caption: 'Find the look that is unmistakably you',
					bodyDurationInFrames: <BODY_6>,
					accentColor: BRAND.amber,
				}}
			/>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Start Remotion Studio and visually confirm all 6 appear**

Run: `npm run studio`
Expected: composition list includes `BenefitInstantRender`, `BenefitPrivacyFirst`, `BenefitHairstyleTryOn`, `BenefitDressTryOn`, `BenefitHairstyleSunglasses`, `BenefitPlayWithYourLook`. Open each once — headline/subline render, both photos appear full-bleed one at a time (never a grid), captions appear, voiceover audio is audible on scrub. Stop the studio after confirming (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add src/Root.tsx
git commit -m "Wire up 6 feature-benefit-reel compositions in Root.tsx"
```

---

### Task 5: Render all 6 videos

**Files:**
- None created/modified — this task only produces render output in `out/` (gitignored).

- [ ] **Step 1: Render each composition**

```bash
npx remotion render BenefitInstantRender out/feature-benefit-reels/instant-render.mp4
npx remotion render BenefitPrivacyFirst out/feature-benefit-reels/privacy-first.mp4
npx remotion render BenefitHairstyleTryOn out/feature-benefit-reels/hairstyle-try-on.mp4
npx remotion render BenefitDressTryOn out/feature-benefit-reels/dress-try-on.mp4
npx remotion render BenefitHairstyleSunglasses out/feature-benefit-reels/hairstyle-sunglasses.mp4
npx remotion render BenefitPlayWithYourLook out/feature-benefit-reels/play-with-your-look.mp4
```
Expected: each command ends with `Your video is ready!`.

- [ ] **Step 2: Verify duration and dimensions**

```bash
for f in out/feature-benefit-reels/*.mp4; do
  echo "$f:"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of default=noprint_wrappers=1 "$f"
done
```
Expected: `width=1080`, `height=1920`, duration ~20-30s per file (matching Task 4's computed totals ±0.1s).

- [ ] **Step 3: Spot-check audio is present**

```bash
for f in out/feature-benefit-reels/*.mp4; do
  echo "$f:"
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 "$f"
done
```
Expected: `codec_name=aac` for every file.

No commit needed — `out/` is gitignored render output, not source.

---

## Follow-ups (explicitly out of scope for this plan)

- Generating additional Kling photos beyond the 12 planned (e.g. more variety per feature) — check back in before spending more credits.
- Any B2B/salon variant of these videos.
- Automated visual regression testing — verification here is manual Studio playback + ffprobe checks, matching how `FeatureReel.tsx` was validated.
