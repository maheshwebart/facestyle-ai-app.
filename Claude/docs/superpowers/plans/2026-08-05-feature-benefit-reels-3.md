# Feature Benefit Reels — Batch 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six new B2C vertical reels (1080×1920, 30fps, 20–30s each) with matching Pinterest pins and caption files, then schedule them into Buffer.

**Architecture:** No new components. The existing schema-driven `FeatureBenefitReel` renders all six videos and the existing `PinterestPin` renders all six stills — the differences between batches are data (headline, captions, photos, audio, durations), not code. Work is: generate assets → wire `Root.tsx` entries → render → write captions → schedule.

**Tech Stack:** Remotion 4.0.499, Zod, `@remotion/google-fonts/Inter`, Node 24 (`--env-file`) + native `fetch` for ElevenLabs TTS, Kling MCP (`kling-image-v3_0`) for photos, vast.ai for rendering, `ffprobe` for verification.

**Spec:** `docs/superpowers/specs/2026-08-05-feature-benefit-reels-3-design.md`

## Global Constraints

- B2C only. No salon, kiosk, or B2B messaging in any script, caption, or end card.
- Reuse `EASE_ENTER`/`EASE_EXIT` from `src/motion.ts` and `BRAND` from `src/config.ts`. No new easing curves, no new brand colors.
- Do not modify `FeatureBenefitReel.tsx`, `PinterestPin.tsx`, `EndCard.tsx`, or any batch-1 / batch-2 composition entry, asset, or render.
- `ELEVENLABS_API_KEY` lives only in `.env` (gitignored). Never hardcode it, never print it, never commit it.
- Voice: ElevenLabs premade voice `21m00Tcm4TlvDq8ikWAM` ("Rachel"), model `eleven_multilingual_v2` — same as batches 1 and 2.
- Kling images: model `kling-image-v3_0`, `aspect_ratio: "9:16"`, `img_resolution: "2k"`, `imageCount: 1`. Exactly 12 images. Each job is charged — do not generate extras or regenerate for taste without explicit sign-off.
- New assets go under `public/audio/feature-benefit-reels-3/` and `public/images/feature-benefit-reels-3/`.
- Every finished reel must measure 20–30s. A reel outside that range gets its script rewritten and its voiceover regenerated — never padded to fake the length.
- Rendering runs on vast.ai, not the local Windows machine.
- Slugs, used consistently across compositions, renders, pins, and captions: `hair-colour`, `big-chop`, `bangs`, `wedding-look`, `hair-length`, `friends-vote`.

---

### Task 1: Generate the 12 Kling model photos

**Files:**
- Create: `public/images/feature-benefit-reels-3/benefit3-1-photo-1.png` .. `benefit3-6-photo-2.png` (12 files)

**Interfaces:**
- Produces: 12 PNG files at the exact paths Task 3 references in `Root.tsx` `defaultProps`, and that Task 4 reuses for the pins.

- [ ] **Step 1: Confirm Kling credits before spending**

Call the Kling MCP `query_membership_and_credits` tool. Expected: a credit balance sufficient for 12 `kling-image-v3_0` 2k generations. If the balance is short, stop and report it — do not generate a partial batch.

- [ ] **Step 2: Call the Kling `text_to_image` tool once per photo**, model `kling-image-v3_0`, arguments `img_resolution=2k`, `aspect_ratio=9:16`, `imageCount=1`, using this exact prompt text:

  | id | prompt |
  |----|--------|
  | benefit3-1-photo-1 | Photorealistic portrait of a young woman in her early twenties with natural dark brown shoulder-length hair, neutral expression, soft natural window light, plain light gray background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-1-photo-2 | Photorealistic portrait of a young woman in her early twenties with vivid honey blonde balayage shoulder-length hair, confident smile, soft studio lighting, plain light gray background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-2-photo-1 | Photorealistic portrait of a young woman in her early twenties with very long straight hair past her waist, neutral expression, soft natural daylight, plain warm beige background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-2-photo-2 | Photorealistic portrait of a young woman in her early twenties with a sharp chin-length blunt bob haircut, confident expression, soft natural daylight, plain warm beige background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-3-photo-1 | Photorealistic portrait of a young woman in her early twenties with hair swept back off her forehead, no fringe, soft natural window light, plain soft pink background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-3-photo-2 | Photorealistic portrait of a young woman in her early twenties with soft curtain bangs framing her face, gentle smile, soft natural window light, plain soft pink background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-4-photo-1 | Photorealistic portrait of a young woman in her early twenties with plain casual loose hair and bare face, relaxed expression, soft natural light, plain off-white background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-4-photo-2 | Photorealistic portrait of a young woman in her early twenties with an elegant bridal updo and soft romantic makeup, serene expression, soft warm lighting, plain off-white background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-5-photo-1 | Photorealistic portrait of a young woman in her early twenties with a short cropped pixie haircut, neutral expression, soft even studio lighting, plain pale teal background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-5-photo-2 | Photorealistic portrait of a young woman in her early twenties with long flowing wavy hair well past her shoulders, neutral expression, soft even studio lighting, plain pale teal background, shoulders up, vertical portrait composition, no text, no logos |
  | benefit3-6-photo-1 | Photorealistic portrait of a young woman in her early twenties smiling while looking down at her smartphone held in one hand, casual candid moment, soft indoor lighting, plain neutral background, vertical portrait composition, no text, no logos |
  | benefit3-6-photo-2 | Photorealistic photo of three young women in their early twenties leaning together and laughing while looking at one smartphone screen, candid friendly moment, soft indoor lighting, plain neutral background, vertical portrait composition, no text, no logos |

- [ ] **Step 3: Poll `query_tasks` for each generation until complete**, and collect the resulting image URL for each of the 12.

- [ ] **Step 4: Download each image to its exact path**

```bash
mkdir -p public/images/feature-benefit-reels-3
curl -sL --ssl-no-revoke "<image-url>" -o "public/images/feature-benefit-reels-3/benefit3-1-photo-1.png"
# repeat for all 12, substituting each URL and filename
```

`--ssl-no-revoke` is required — this machine has a certificate-interception issue that breaks plain `curl` HTTPS.

- [ ] **Step 5: Verify all 12 files exist and are non-trivial**

```bash
ls -la public/images/feature-benefit-reels-3/
```
Expected: 12 PNG files, each >20KB. A file under ~5KB is a truncated download or an error body — re-download it, do not regenerate it.

- [ ] **Step 6: Commit**

```bash
git add public/images/feature-benefit-reels-3
git commit -m "Add 12 Kling-generated model photos for batch 3 feature-benefit reels"
```

---

### Task 2: Generate the six voiceovers and measure them

**Files:**
- Create: `scripts/generate-benefit-voiceovers-3.mjs`
- Create: `public/audio/feature-benefit-reels-3/benefit3-1-hair-colour.mp3` .. `benefit3-6-friends-vote.mp3` (6 files)

**Interfaces:**
- Produces: 6 MP3 files at the exact paths Task 3 references, plus six measured durations in seconds that Task 3 uses to compute `bodyDurationInFrames` and `durationInFrames`.

- [ ] **Step 1: Write `scripts/generate-benefit-voiceovers-3.mjs`**

```javascript
// Generates the 6 batch-3 feature-benefit-reel voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-benefit-voiceovers-3.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(
	projectRoot,
	'public',
	'audio',
	'feature-benefit-reels-3',
);

// Rachel — same voice as batches 1 and 2, for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'benefit3-1-hair-colour',
		text: 'Colour is the one you cannot undo. Bleach, burgundy, balayage. Once it is done, it is done. So try it first. Upload one photo and see the exact shade on your own hair, in your own light. Compare the options side by side, then walk into the salon certain. Free at facestyle dot fun.',
	},
	{
		id: 'benefit3-2-big-chop',
		text: 'Everyone talks themselves out of the big chop. Years of length, gone in one appointment, and no way to picture it first. Now there is. See the bob, the pixie, the shoulder-length cut on your own face before a single inch comes off. Decide with your eyes, not your nerves.',
	},
	{
		id: 'benefit3-3-bangs',
		text: 'Bangs are the question everyone asks and nobody can answer. They suit some faces and ambush others, and you only find out afterwards. Upload a selfie and see the fringe on your own face before anyone picks up the scissors. An answer in twenty seconds, instead of three months of growing them out.',
	},
	{
		id: 'benefit3-4-wedding-look',
		text: 'Your wedding look gets one take. Most trials cost an afternoon and a deposit, and you still leave unsure. Try it at home instead. See the updo, the half-up, the loose waves on your own face, until one of them feels unmistakably like the day you pictured.',
	},
	{
		id: 'benefit3-5-hair-length',
		text: 'Short, medium, or long. Everyone has an opinion, and none of them are looking at your face. Upload one photo and see the lengths on yourself, side by side, in the same light. Compare them properly and pick the one that actually works, before you commit to growing anything back.',
	},
	{
		id: 'benefit3-6-friends-vote',
		text: 'Nobody decides a haircut alone. There is always a group chat involved. So give it something to work with. Generate your looks, send them to your friends, and let them argue it out before you book. One photo in, a dozen opinions settled, and a decision you can finally make.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error(
			'ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-benefit-voiceovers-3.mjs',
		);
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

Run: `node --env-file=.env scripts/generate-benefit-voiceovers-3.mjs`
Expected: 6 lines like `Wrote .../benefit3-1-hair-colour.mp3 (NNNNN bytes)`.

If `fetch` hits a connect timeout (it did on the batch-1 run), fall back to an equivalent `curl --ssl-no-revoke` loop per the note in `docs/superpowers/plans/2026-07-28-feature-reels.md`, but still keep this `.mjs` file as the maintained script.

- [ ] **Step 3: Measure each file's duration**

```bash
for f in public/audio/feature-benefit-reels-3/*.mp3; do
  echo "$f: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")"
done
```

Record all six durations — Task 3 needs them.

- [ ] **Step 4: Check every reel will land inside 20–30s**

For each measured `voiceSeconds`, compute `totalSeconds = (ceil(voiceSeconds * 30) + 45 + 90) / 30`.
Expected: every `totalSeconds` between 20 and 30.

If one is under 20s, add a sentence to that script and regenerate just that file. If one is over 30s, cut a sentence and regenerate just that file. Then re-measure. Do not proceed to Task 3 until all six pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-benefit-voiceovers-3.mjs public/audio/feature-benefit-reels-3
git commit -m "Add batch 3 feature-benefit-reel voiceover script and generated audio"
```

---

### Task 3: Wire the six reel compositions into `Root.tsx`

**Files:**
- Modify: `src/Root.tsx` (add six `<Composition>` entries after the batch-2 `Benefit2WalkInKnowing` entry, before the `Pin*` entries)

**Interfaces:**
- Consumes: `FeatureBenefitReel`, `featureBenefitReelDefaultProps`, `featureBenefitReelSchema` (already imported at the top of `Root.tsx` for batch 1 — no new import needed); the 12 photo paths from Task 1; the 6 audio paths and measured durations from Task 2.
- Produces: composition IDs `Benefit3HairColour`, `Benefit3BigChop`, `Benefit3Bangs`, `Benefit3WeddingLook`, `Benefit3HairLength`, `Benefit3FriendsVote`, which Task 5 renders by name.

- [ ] **Step 1: Compute the durations**

For each reel, using its `voiceSeconds` from Task 2 Step 3:

```
bodyDurationInFrames = Math.ceil(voiceSeconds * 30) + 45
durationInFrames     = bodyDurationInFrames + 90
```

Write down all six pairs before editing. Substitute the real numbers for `<BODY_N>` / `<TOTAL_N>` below — do not leave the placeholders, and do not reuse the `600` from `featureBenefitReelDefaultProps`.

- [ ] **Step 2: Add the six `<Composition>` entries**

Insert immediately after the closing `/>` of the `Benefit2WalkInKnowing` composition:

```tsx
			{/* Batch 3: 6 more B2C feature-benefit reels, same FeatureBenefitReel
			    format as batches 1 and 2. Targets the hesitation moments the
			    earlier batches did not cover. See
			    docs/superpowers/specs/2026-08-05-feature-benefit-reels-3-design.md.
			    Duration math: bodyDurationInFrames = ceil(voiceSeconds*30) + 45,
			    total = body + 90. */}
			<Composition
				id="Benefit3HairColour"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_1>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Hair Colour Try-On',
					subline: 'See the shade before the bleach',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-1-hair-colour.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-1-photo-1.png',
					photo1Caption: 'Start with the hair you have',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-1-photo-2.png',
					photo2Caption: 'See the shade before you commit',
					bodyDurationInFrames: <BODY_1>,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Benefit3BigChop"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_2>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'The Big Chop',
					subline: 'Lose the length on screen first',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-2-big-chop.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-2-photo-1.png',
					photo1Caption: 'Years of length on the line',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-2-photo-2.png',
					photo2Caption: 'See the cut before the scissors',
					bodyDurationInFrames: <BODY_2>,
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Benefit3Bangs"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_3>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Should You Get Bangs?',
					subline: 'Answer it on your own face',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-3-bangs.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-3-photo-1.png',
					photo1Caption: 'Not sure bangs suit you?',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-3-photo-2.png',
					photo2Caption: 'Now you know',
					bodyDurationInFrames: <BODY_3>,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="Benefit3WeddingLook"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_4>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Your Wedding Look, Trialled',
					subline: 'No deposit, no appointment',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-4-wedding-look.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-4-photo-1.png',
					photo1Caption: 'Your everyday look',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-4-photo-2.png',
					photo2Caption: 'Your wedding-day look, trialled',
					bodyDurationInFrames: <BODY_4>,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Benefit3HairLength"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_5>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Short, Medium, or Long?',
					subline: 'See all three on you',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-5-hair-length.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-5-photo-1.png',
					photo1Caption: 'Short on you',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-5-photo-2.png',
					photo2Caption: 'Long on you',
					bodyDurationInFrames: <BODY_5>,
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Benefit3FriendsVote"
				component={FeatureBenefitReel}
				durationInFrames={<TOTAL_6>}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Let Your Friends Vote',
					subline: 'Settle it in the group chat',
					voiceoverSrc: 'audio/feature-benefit-reels-3/benefit3-6-friends-vote.mp3',
					photo1Src: 'images/feature-benefit-reels-3/benefit3-6-photo-1.png',
					photo1Caption: 'Generate your looks',
					photo2Src: 'images/feature-benefit-reels-3/benefit3-6-photo-2.png',
					photo2Caption: 'Let the group chat decide',
					bodyDurationInFrames: <BODY_6>,
					accentColor: BRAND.amber,
				}}
			/>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. A leftover `<TOTAL_N>` placeholder shows up here as a JSX parse error — that is the intended catch.

- [ ] **Step 4: Verify in Remotion Studio**

Run: `npm run studio`
Expected: the composition list includes all six `Benefit3*` IDs. Open each once and confirm: headline and subline render, both photos appear full-bleed one at a time (never a grid), captions appear over the photos, the voiceover is audible on scrub, and the end card plays after the body. Stop the studio with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/Root.tsx
git commit -m "Wire up 6 batch-3 feature-benefit-reel compositions in Root.tsx"
```

---

### Task 4: Wire the six Pinterest pin compositions

**Files:**
- Modify: `src/Root.tsx` (add six `<Composition>` entries after the existing `PinWalkInKnowing` entry)

**Interfaces:**
- Consumes: `PinterestPin`, `pinterestPinDefaultProps`, `pinterestPinSchema` (already imported for the batch-2 pins — no new import needed); the `-photo-2.png` images from Task 1.
- Produces: composition IDs `Pin3HairColour`, `Pin3BigChop`, `Pin3Bangs`, `Pin3WeddingLook`, `Pin3HairLength`, `Pin3FriendsVote`, which Task 5 renders with `remotion still`.

Each pin reuses its reel's photo 2 (the result image) so the pin and the video read as the same story. Accent colors match the reels exactly.

- [ ] **Step 1: Add the six `<Composition>` entries**

Insert immediately after the closing `/>` of the `PinWalkInKnowing` composition:

```tsx
			{/* Batch 3 static 2:3 Pinterest pins, one per batch-3 video, same
			    static-image approach as the batch-2 pins (Pinterest's spam filter
			    blocked video pins hosted on raw.githubusercontent.com).
			    Rendered via `remotion still`, not `remotion render`. */}
			<Composition
				id="Pin3HairColour"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-1-photo-2.png',
					headline: 'Hair Colour Try-On',
					subline: 'See the shade before the bleach',
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Pin3BigChop"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-2-photo-2.png',
					headline: 'The Big Chop',
					subline: 'Lose the length on screen first',
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Pin3Bangs"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-3-photo-2.png',
					headline: 'Should You Get Bangs?',
					subline: 'Answer it on your own face',
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="Pin3WeddingLook"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-4-photo-2.png',
					headline: 'Your Wedding Look',
					subline: 'No deposit, no appointment',
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Pin3HairLength"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-5-photo-2.png',
					headline: 'Short, Medium, or Long?',
					subline: 'See all three on you',
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Pin3FriendsVote"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-3/benefit3-6-photo-2.png',
					headline: 'Let Your Friends Vote',
					subline: 'Settle it in the group chat',
					accentColor: BRAND.amber,
				}}
			/>
```

Note `Pin3WeddingLook` uses the shortened headline `Your Wedding Look` — the reel's full `Your Wedding Look, Trialled` overflows the pin's text block at 1000px wide.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/Root.tsx
git commit -m "Add 6 batch-3 Pinterest pin compositions"
```

---

### Task 5: Render everything on vast.ai

**Files:**
- None created or modified in git — this task produces render output in `out/` (gitignored).

**Interfaces:**
- Consumes: the composition IDs from Tasks 3 and 4.
- Produces: `out/promotional-3/{slug}.mp4` (6), `out/promotional-3/{slug}-thumb.jpg` (6), `out/promotional-3/pins/{slug}-pin.png` (6) — the exact files Task 6 captions and Task 7 uploads.

Renders run on a rented vast.ai instance, not locally. The setup gotchas below are already solved — do not re-diagnose them.

- [ ] **Step 1: Rent an instance and copy the project across**

Rent a GPU instance from the vast.ai console. Take the **Direct** (not Proxy) SSH connect string from the console's Connect dialog. Then:

```bash
tar --exclude=node_modules --exclude=out --exclude=.git -czf /tmp/motion.tar.gz .
scp -P <port> /tmp/motion.tar.gz root@<host>:/root/
ssh -p <port> root@<host> "mkdir -p /root/motion && tar -xzf /root/motion.tar.gz -C /root/motion"
```

Use plain `scp`, not `vastai copy` — the local `vastai` CLI's API calls fail against this machine's certificate interception.

- [ ] **Step 2: Install dependencies on the instance**

```bash
ssh -p <port> root@<host> "apt-get update && apt-get install -y libasound2t64 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libpango-1.0-0 ffmpeg"
ssh -p <port> root@<host> ". /opt/nvm/nvm.sh && cd /root/motion && npm install"
```

`libasound2t64` (not `libasound2`) is correct on Ubuntu 24.04. The `. /opt/nvm/nvm.sh &&` prefix is required — Node loads via nvm only in interactive shells.

- [ ] **Step 3: Render the six videos**

```bash
ssh -p <port> root@<host> ". /opt/nvm/nvm.sh && cd /root/motion && \
  npx remotion render Benefit3HairColour out/promotional-3/hair-colour.mp4 && \
  npx remotion render Benefit3BigChop out/promotional-3/big-chop.mp4 && \
  npx remotion render Benefit3Bangs out/promotional-3/bangs.mp4 && \
  npx remotion render Benefit3WeddingLook out/promotional-3/wedding-look.mp4 && \
  npx remotion render Benefit3HairLength out/promotional-3/hair-length.mp4 && \
  npx remotion render Benefit3FriendsVote out/promotional-3/friends-vote.mp4"
```
Expected: six `Your video is ready!` messages.

- [ ] **Step 4: Render the six pins**

```bash
ssh -p <port> root@<host> ". /opt/nvm/nvm.sh && cd /root/motion && \
  npx remotion still Pin3HairColour out/promotional-3/pins/hair-colour-pin.png && \
  npx remotion still Pin3BigChop out/promotional-3/pins/big-chop-pin.png && \
  npx remotion still Pin3Bangs out/promotional-3/pins/bangs-pin.png && \
  npx remotion still Pin3WeddingLook out/promotional-3/pins/wedding-look-pin.png && \
  npx remotion still Pin3HairLength out/promotional-3/pins/hair-length-pin.png && \
  npx remotion still Pin3FriendsVote out/promotional-3/pins/friends-vote-pin.png"
```
Expected: six PNG files written, each 1000×1500.

- [ ] **Step 5: Extract the six thumbnails**

Take each thumbnail at 70% of the total duration. The photo-2 beat runs from roughly 57% to 85% of the file (two-thirds through the body, which is itself the first ~85% before the end card), so 70% lands comfortably inside it:

```bash
ssh -p <port> root@<host> "cd /root/motion && for s in hair-colour big-chop bangs wedding-look hair-length friends-vote; do \
  d=\$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 out/promotional-3/\$s.mp4); \
  t=\$(awk -v d=\$d 'BEGIN{print d*0.7}'); \
  ffmpeg -y -ss \$t -i out/promotional-3/\$s.mp4 -frames:v 1 -q:v 2 out/promotional-3/\$s-thumb.jpg; \
done"
```

`awk` avoids depending on `bc`, which is not on the vast.ai base image.
Expected: six JPGs written.

- [ ] **Step 6: Verify every file before copying back**

```bash
ssh -p <port> root@<host> "cd /root/motion && for f in out/promotional-3/*.mp4; do \
  echo \"\$f:\"; \
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of default=noprint_wrappers=1 \"\$f\"; \
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 \"\$f\"; \
done"
```
Expected for every file: `width=1080`, `height=1920`, `duration` between 20 and 30 and matching the Task 3 total ±0.1s, and `codec_name=aac`.

A missing audio stream means the render silently dropped audio — re-render that composition rather than shipping it.

- [ ] **Step 7: Copy results back and destroy the instance**

```bash
scp -P <port> -r root@<host>:/root/motion/out/promotional-3 ./out/
ssh -p <port> root@<host> "vastai destroy instance \$CONTAINER_ID --api-key \$CONTAINER_API_KEY"
```

Destroy from *inside* the instance — the env vars are pre-set there, and it sidesteps the local certificate block. Confirm in the vast.ai console that the instance is gone; a forgotten instance bills by the hour.

- [ ] **Step 8: Confirm the local copies landed**

```bash
ls -la out/promotional-3 out/promotional-3/pins
```
Expected: 6 MP4s, 6 thumb JPGs, and 6 pin PNGs, all non-zero size.

No commit — `out/` is gitignored render output.

---

### Task 6: Write the six caption files

**Files:**
- Create: `out/promotional-3/hair-colour.txt`, `big-chop.txt`, `bangs.txt`, `wedding-look.txt`, `hair-length.txt`, `friends-vote.txt`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the slugs.
- Produces: the caption text Task 7 pastes into Buffer.

Match the existing `out/promotional/*.txt` format exactly — a `Title:` block, a `Description:` block, and a `Tags:` block of space-separated hashtags.

- [ ] **Step 1: Write all six files**

`out/promotional-3/hair-colour.txt`:
```
Title:
Colour Is the One You Can't Undo — Try It First | FaceStyle.fun

Description:
Bleach, burgundy, balayage — once it's done, it's done. FaceStyle.fun lets you see the exact shade on your own hair, in your own light, before anyone opens a tube of dye. Compare your options side by side, then walk into the salon certain. Try it free at facestyle.fun.

Tags:
#FaceStyle #HairColour #HairColorTryOn #AIHairstyle #BalayageHair #BlondeHair #HairTransformation #HairColourIdeas #VirtualHairTryOn #GlowUp #HairInspo #FaceStyleFun #NewHairWhoDis #HairGoals #TryBeforeYouDye
```

`out/promotional-3/big-chop.txt`:
```
Title:
Thinking About the Big Chop? See It First | FaceStyle.fun

Description:
Everyone talks themselves out of the big chop — years of length gone in one appointment, with no way to picture it first. Now there is. See the bob, the pixie, the shoulder-length cut on your own face before a single inch comes off. Try it free at facestyle.fun.

Tags:
#FaceStyle #BigChop #ShortHair #BobHaircut #PixieCut #HairTransformation #AIHairstyle #VirtualHairTryOn #HaircutIdeas #GlowUp #HairInspo #FaceStyleFun #ShouldICutMyHair #HairGoals #TryBeforeYouCut
```

`out/promotional-3/bangs.txt`:
```
Title:
Should You Get Bangs? Answer It on Your Own Face | FaceStyle.fun

Description:
Bangs are the question everyone asks and nobody can answer. They suit some faces and ambush others — and you usually find out afterwards. FaceStyle.fun shows you the fringe on your own face before anyone picks up the scissors. An answer in twenty seconds, not three months of growing them out. Free at facestyle.fun.

Tags:
#FaceStyle #Bangs #CurtainBangs #ShouldIGetBangs #FringeHair #AIHairstyle #VirtualHairTryOn #HaircutIdeas #HairTransformation #GlowUp #HairInspo #FaceStyleFun #BangsOrNoBangs #HairGoals #TryBeforeYouCut
```

`out/promotional-3/wedding-look.txt`:
```
Title:
Trial Your Wedding Look Without the Appointment | FaceStyle.fun

Description:
Your wedding look gets one take. Most trials cost an afternoon and a deposit, and you still leave unsure. FaceStyle.fun lets you try it at home — the updo, the half-up, the loose waves on your own face — until one of them feels unmistakably like the day you pictured. Free at facestyle.fun.

Tags:
#FaceStyle #WeddingHair #BridalHair #WeddingLook #BridalUpdo #HairTrial #AIHairstyle #VirtualHairTryOn #WeddingPlanning #BrideToBe #HairInspo #FaceStyleFun #WeddingHairstyles #BridalBeauty #TryBeforeYouCut
```

`out/promotional-3/hair-length.txt`:
```
Title:
Short, Medium, or Long? See All Three on You | FaceStyle.fun

Description:
Everyone has an opinion about your hair length, and none of them are looking at your face. FaceStyle.fun shows you the lengths on yourself, side by side, in the same light — so you can compare them properly and pick the one that actually works, before you commit to growing anything back. Free at facestyle.fun.

Tags:
#FaceStyle #HairLength #LongHair #ShortHair #MediumHair #HairTransformation #AIHairstyle #VirtualHairTryOn #HaircutIdeas #GlowUp #HairInspo #FaceStyleFun #HairGoals #ShouldICutMyHair #TryBeforeYouCut
```

`out/promotional-3/friends-vote.txt`:
```
Title:
Send It to the Group Chat Before You Book | FaceStyle.fun

Description:
Nobody decides a haircut alone — there's always a group chat involved. So give it something to work with. Generate your looks on FaceStyle.fun, send them to your friends, and let them argue it out before you book. One photo in, a dozen opinions settled. Free at facestyle.fun.

Tags:
#FaceStyle #GroupChat #HairAdvice #AIHairstyle #VirtualHairTryOn #HaircutIdeas #HairTransformation #GlowUp #HairInspo #FaceStyleFun #AskYourFriends #HairGoals #NewHairWhoDis #StyleWithFriends #TryBeforeYouCut
```

- [ ] **Step 2: Verify the files exist and match the house format**

```bash
for f in out/promotional-3/*.txt; do echo "=== $f ==="; cat "$f"; done
```
Expected: six files, each with `Title:`, `Description:`, and `Tags:` sections, matching the shape of `out/promotional/face-shape-matched.txt`.

No commit — `out/` is gitignored.

---

### Task 7: Schedule the six posts in Buffer

**Files:**
- None. This task produces scheduled posts, not files.

**Interfaces:**
- Consumes: the MP4s, pins, and caption files from Tasks 5 and 6.

There is no Buffer connector in this environment and no Buffer API code in the repo. This step is browser-driven against the user's logged-in Buffer, and **each post is queued only after the user explicitly confirms it**. Nothing here is automated end-to-end.

Cadence: 2 posts per week, Tuesday and Friday mornings IST, over three weeks.

| Slot | Reel | Video file | Pin file | Caption file |
|------|------|-----------|----------|--------------|
| Week 1 Tue | Hair Colour Try-On | `hair-colour.mp4` | `hair-colour-pin.png` | `hair-colour.txt` |
| Week 1 Fri | Should You Get Bangs? | `bangs.mp4` | `bangs-pin.png` | `bangs.txt` |
| Week 2 Tue | The Big Chop | `big-chop.mp4` | `big-chop-pin.png` | `big-chop.txt` |
| Week 2 Fri | Short, Medium, or Long? | `hair-length.mp4` | `hair-length-pin.png` | `hair-length.txt` |
| Week 3 Tue | Your Wedding Look | `wedding-look.mp4` | `wedding-look-pin.png` | `wedding-look.txt` |
| Week 3 Fri | Let Your Friends Vote | `friends-vote.mp4` | `friends-vote-pin.png` | `friends-vote.txt` |

- [ ] **Step 1: Confirm the Buffer channels are connected**

Open Buffer in the browser and confirm the Instagram, YouTube, and Pinterest channels are all connected and authorized. If any is disconnected, stop and report it — reconnecting a channel is the user's action, not the agent's.

- [ ] **Step 2: Confirm the start date with the user**

Ask which Tuesday is Week 1. Do not assume.

- [ ] **Step 3: For each of the six slots, in table order**

1. Open the Buffer composer.
2. Upload the video file for Instagram and YouTube; upload the pin PNG for Pinterest.
3. Paste the Title as the Pinterest pin title, and the Description as the caption on all three channels.
4. Append the Tags line to the Instagram caption. Trim hashtags for YouTube if the field limit is hit.
5. Set the scheduled date and time.
6. **Show the user the composed post and wait for explicit confirmation before queueing it.**
7. Queue it, then move to the next slot.

- [ ] **Step 4: Verify the queue**

Open Buffer's queue view and confirm six posts appear at the intended dates and times across the three channels. Report the final queue back to the user.

---

## Follow-ups (explicitly out of scope)

- 4:5 or 1:1 variants for Facebook or LinkedIn feed.
- Paid promotion of any batch-3 reel — that waits on the `attribution` work in `facestyle-marketing-sequence.md`.
- Any change to the `FeatureBenefitReel` layout or motion design.
- Automating Buffer via its API.
