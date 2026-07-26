# Motion Graphics (Remotion)

A minimal Remotion + TypeScript starting point for designing programmatic
motion graphics and exporting them into any video editor. The visual design
here is intentionally plain — it's a clean base to build your own look on top
of, not a finished style.

## Quick start

```bash
npm install
npm run studio
```

`npm run studio` opens the Remotion Studio, a live preview where you can
scrub timelines and edit each composition's props in real time.

## Project structure

```
src/
  config.ts               shared canvas settings (width/height/fps)
  index.ts                Remotion entry point (registers the root)
  Root.tsx                registers every composition (id, size, fps, schema)
  compositions/
    TitleCard.tsx
    LowerThird.tsx
    KineticText.tsx
    TransparentOverlay.tsx
    BrandWatermark.tsx
public/                   fonts, images, audio referenced via staticFile()
  brand/                  logo/icon assets used by BrandWatermark
out/                      rendered output lands here
```

## Canvas settings (resolution / fps)

Everything reads from [`src/config.ts`](src/config.ts):

```ts
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
```

Change these three values to switch the whole project — e.g. to 4K
(`3840x2160`) or 60fps. `src/config.ts` also has a `PRESETS` object with
common combinations you can swap in. Each `<Composition>` in `Root.tsx` also
accepts its own `width` / `height` / `fps`, so an individual graphic can
override the shared default if you ever need a one-off size.

## Adding a new graphic

1. Create `src/compositions/MyGraphic.tsx`. Export:
   - the component
   - a zod `schema` describing its props
   - `defaultProps` matching that schema
2. Register it in `src/Root.tsx`:

```tsx
<Composition
	id="MyGraphic"
	component={MyGraphic}
	durationInFrames={90}
	fps={VIDEO_FPS}
	width={VIDEO_WIDTH}
	height={VIDEO_HEIGHT}
	schema={myGraphicSchema}
	defaultProps={myGraphicDefaultProps}
/>
```

The zod schema is what makes props editable live in Studio — every field
becomes a control in the right-hand panel.

## The starter compositions

- **TitleCard** — centered title + subtitle, fade/rise in, fade out.
- **LowerThird** — name/role bar that slides in from the left and slides
  back out.
- **KineticText** — words animate in one at a time (staggered spring), then
  the whole line fades/scales out together.
- **TransparentOverlay** — a small badge on a fully transparent background,
  meant to be composited as an overlay in another editor (see below).
- **BrandWatermark** — 9:16, transparent background, a corner icon that does
  a slow, smooth tilt-and-return every few seconds, next to a bold wordmark.
  A persistent branding layer template you drop on top of any vertical video
  (see below).
- **EndCard** — a static promo/CTA image (`public/brand/end-card.png`) that
  fades in and holds. No exit — it's meant to be the last thing on screen.
- **SocialClip** — the full deliverable: a source video branded with
  `BrandWatermark`, hard-cut to `EndCard` for the last few seconds. This is
  what the batch pipeline should target for finished, ready-to-post files.

All use `useCurrentFrame`, `interpolate`, `spring`, and `Easing`, and all
give their animation a full enter **and** exit so nothing pops or cuts
mid-motion (`EndCard` is the one deliberate exception — see above) — see
"Tips" below.

### BrandWatermark — vertical video branding template

Unlike the first three (which are short, self-contained clips),
`BrandWatermark` is meant to sit as a **top layer over an entire vertical
video** — the icon (`public/brand/facestylefun-icon.png`) does a brief,
smooth tilt-and-return every few seconds (not a continuous spin), with the
`facestyle.fun` wordmark next to it, fading in at the start and out at the
end.

To use it standalone on a specific video:

1. Open [`src/Root.tsx`](src/Root.tsx) and change `BrandWatermark`'s
   `durationInFrames` (currently `900` = 30s at 30fps) to match your
   footage's length.
2. Render it transparent (command below) and drop the result as a top track
   over your video in your editor.

Props (all live-editable in Studio): `iconSrc`, `wordmarkPrimary`,
`wordmarkAccent`, `textColor`, `accentColor`, `corner` (`topRight` /
`topLeft` / `bottomRight` / `bottomLeft`), `iconSize`, `tiltAngle` (peak
degrees), `tiltIntervalSeconds` (time between tilts), and
`tiltDurationSeconds` (how long each tilt-and-return takes).

### SocialClip — the actual per-video deliverable

`SocialClip` chains `BrandedVideo` (your source clip + the watermark) and
`EndCard` into one file via two `<Sequence>`s. To point it at a new video:

1. Copy the clip into `public/raw/` and note its frame count (`duration
   (seconds) × fps`, rounded).
2. In `Root.tsx`, update `SocialClip`'s `width`/`height`/`fps` to match the
   source, and set `durationInFrames` to `clipDurationInFrames + endCardHold`
   (e.g. a 5s @ 24fps clip is 121 frames; +90 frames / 3.75s of end card =
   211 total).
3. Update `videoSrc` and `clipDurationInFrames` in `socialClipDefaultProps`
   (in [`src/compositions/SocialClip.tsx`](src/compositions/SocialClip.tsx))
   to match.

For batch runs across many clips with different lengths, generate these
values programmatically per job rather than hand-editing `Root.tsx` for each
one (see "Batch rendering" below — pass `durationInFrames` per job in the
manifest).

## Rendering

### Standard MP4

```bash
npx remotion render TitleCard out/TitleCard.mp4 --codec=h264 --crf=18
```

### Transparent (alpha channel) — for overlay compositions

```bash
npx remotion render TransparentOverlay out/TransparentOverlay.mov \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

```bash
npx remotion render BrandWatermark out/BrandWatermark.mov \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

Import the resulting `.mov` into your editor (Premiere, DaVinci, Final Cut,
etc.) as an overlay track — the background stays transparent.

### PNG sequence

```bash
npx remotion render KineticText out/KineticText/frame-%04d.png --image-format=png
```

Swap `TitleCard`, `LowerThird`, `KineticText`, `TransparentOverlay` for any
composition `id` you've registered in `Root.tsx`.

### Batch rendering many videos at once

For rendering a large number of videos, use `npm run batch-render` instead of
calling `npx remotion render` once per file — it bundles the project **once**
and reuses that bundle for every job, instead of re-bundling on every CLI
call.

1. Write a manifest — an array of jobs — see
   [`batch/example-manifest.json`](batch/example-manifest.json) for the
   format: `compositionId`, `outputFile`, `props` (matches that
   composition's zod schema), and optionally `durationInFrames` and
   `transparent: true` (for alpha-channel `.mov` output).
2. Run it:

```bash
npm run batch-render -- batch/example-manifest.json
```

Each job renders sequentially and failures don't stop the batch — you get a
per-job pass/fail summary at the end. For very large batches, generate the
manifest JSON programmatically (e.g. from a CSV of video titles/footage
paths) rather than hand-writing it.

## Fonts

[`KineticText`](src/compositions/KineticText.tsx) loads a Google Font via
`@remotion/google-fonts`:

```ts
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont();
```

To use a different font, swap the import path (e.g.
`@remotion/google-fonts/Poppins`) and use the returned `fontFamily` in your
styles.

## Adding a sound effect

Drop an audio file into `public/` (e.g. `public/whoosh.mp3`), then reference
it with `staticFile` inside a `<Sequence>` so its timing lines up with the
rest of your composition:

```tsx
import {Audio, Sequence, staticFile} from 'remotion';

<Sequence from={10}>
	<Audio src={staticFile('whoosh.mp3')} />
</Sequence>;
```

## Tips

- **Title-safe area**: keep text within the middle ~90% of the frame — the
  starter compositions already constrain text width for this reason.
- **Always animate a full enter and exit**: every composition should fade,
  slide, or scale both in and out — never let something appear or disappear
  on a hard cut mid-timeline. All four starter graphics follow this pattern;
  keep it when you add your own.
- **Trim leading silence on sound effects**: many stock SFX files have a
  beat or two of silence at the start, which reads as lag. Trim the file (or
  offset the `<Sequence from={...}>` value) so the impact lands exactly on
  the frame you intend.
