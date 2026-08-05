import {Composition} from 'remotion';
import {BRAND, PRESETS, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from './config';
import {
	BeforeAfterReveal,
	beforeAfterRevealDefaultProps,
	beforeAfterRevealSchema,
} from './compositions/BeforeAfterReveal';
import {
	BrandedVideo,
	brandedVideoDefaultProps,
	brandedVideoSchema,
} from './compositions/BrandedVideo';
import {
	BrandWatermark,
	brandWatermarkDefaultProps,
	brandWatermarkSchema,
} from './compositions/BrandWatermark';
import {
	EndCard,
	endCardDefaultProps,
	endCardSchema,
} from './compositions/EndCard';
import {
	KineticText,
	kineticTextDefaultProps,
	kineticTextSchema,
} from './compositions/KineticText';
import {
	LowerThird,
	lowerThirdDefaultProps,
	lowerThirdSchema,
} from './compositions/LowerThird';
import {
	TitleCard,
	titleCardDefaultProps,
	titleCardSchema,
} from './compositions/TitleCard';
import {
	SocialClip,
	socialClipDefaultProps,
	socialClipSchema,
} from './compositions/SocialClip';
import {
	TransparentOverlay,
	transparentOverlayDefaultProps,
	transparentOverlaySchema,
} from './compositions/TransparentOverlay';
import {
	FeatureReel,
	featureReelDefaultProps,
	featureReelSchema,
} from './compositions/FeatureReel';
import {
	FeatureBenefitReel,
	featureBenefitReelDefaultProps,
	featureBenefitReelSchema,
} from './compositions/FeatureBenefitReel';
import {
	PinterestPin,
	pinterestPinDefaultProps,
	pinterestPinSchema,
} from './compositions/PinterestPin';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TitleCard"
				component={TitleCard}
				durationInFrames={90}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={titleCardSchema}
				defaultProps={titleCardDefaultProps}
			/>
			<Composition
				id="LowerThird"
				component={LowerThird}
				durationInFrames={120}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={lowerThirdSchema}
				defaultProps={lowerThirdDefaultProps}
			/>
			<Composition
				id="KineticText"
				component={KineticText}
				durationInFrames={100}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={kineticTextSchema}
				defaultProps={kineticTextDefaultProps}
			/>
			{/* Transparent background — render with the ProRes 4444 command in the README to keep alpha. */}
			<Composition
				id="TransparentOverlay"
				component={TransparentOverlay}
				durationInFrames={90}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={transparentOverlaySchema}
				defaultProps={transparentOverlayDefaultProps}
			/>
			{/* 9:16 branded corner watermark — transparent background, layer over any vertical video.
			    Extend durationInFrames here to match the length of the footage you're branding. */}
			<Composition
				id="BrandWatermark"
				component={BrandWatermark}
				durationInFrames={900}
				fps={PRESETS.vertical9x16_30.fps}
				width={PRESETS.vertical9x16_30.width}
				height={PRESETS.vertical9x16_30.height}
				schema={brandWatermarkSchema}
				defaultProps={brandWatermarkDefaultProps}
			/>
			{/* Source clip + BrandWatermark composited into one finished file.
			    Sized to match public/raw/demo-clip.mp4 (720x1280 @ 24fps, 121 frames / ~5s).
			    For a new clip, update videoSrc in defaultProps and these dimensions. */}
			<Composition
				id="BrandedVideo"
				component={BrandedVideo}
				durationInFrames={121}
				fps={24}
				width={720}
				height={1280}
				schema={brandedVideoSchema}
				defaultProps={brandedVideoDefaultProps}
			/>
			{/* Static CTA/promo card, fades in and holds — the closing segment of SocialClip. */}
			<Composition
				id="EndCard"
				component={EndCard}
				durationInFrames={90}
				fps={24}
				width={720}
				height={1280}
				schema={endCardSchema}
				defaultProps={endCardDefaultProps}
			/>
			{/* The full deliverable: branded clip, hard-cut to the end card.
			    durationInFrames = clipDurationInFrames + end-card hold (here 121 + 90 = 211).
			    For a new clip, update videoSrc + clipDurationInFrames + this total. */}
			<Composition
				id="SocialClip"
				component={SocialClip}
				durationInFrames={211}
				fps={24}
				width={720}
				height={1280}
				schema={socialClipSchema}
				defaultProps={socialClipDefaultProps}
			/>
			{/* Before/after reveal: static-before hold + whip cut + animated-after clip + end card.
			    durationInFrames = beforeHoldFrames + afterDurationFrames + end-card hold (45 + 121 + 90 = 256).
			    True 9:16 Reels canvas (1080x1920); source assets are cropped to cover via object-fit. */}
			<Composition
				id="BeforeAfterReveal"
				component={BeforeAfterReveal}
				durationInFrames={256}
				fps={24}
				width={1080}
				height={1920}
				schema={beforeAfterRevealSchema}
				defaultProps={beforeAfterRevealDefaultProps}
			/>
			{/* Same composition, 4:5 canvas for Instagram feed/carousel posts (which reject
			    anything narrower than 4:5 — Reels-only 9:16 gets bounced with an aspect-ratio
			    error). Corner watermark/labels are positioned relative to width/height, so this
			    recomputes cleanly instead of needing a lossy crop of the 9:16 render. */}
			<Composition
				id="BeforeAfterReveal4x5"
				component={BeforeAfterReveal}
				durationInFrames={256}
				fps={24}
				width={1080}
				height={1350}
				schema={beforeAfterRevealSchema}
				defaultProps={beforeAfterRevealDefaultProps}
			/>
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
					images: [
						'images/feature-reels/before-after-before.png',
						'images/feature-reels/before-after-after.png',
					],
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
			{/* Second variant set: real Kling-generated hero photos of trending 2026
			    hairstyles (bixie, wolf cut, balayage lob, Birkin bangs, cherry red),
			    one image per video via FeatureReel's single-image hero layout. Kept
			    alongside the original text-only set for comparison, not a replacement. */}
			<Composition
				id="FeatureInstantTryOnV2"
				component={FeatureReel}
				durationInFrames={271}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'The Bixie Cut, On You',
					subline: 'Trending everywhere — try it in seconds',
					voiceoverSrc: 'audio/feature-reels-v2/v2-1-bixie-cut.mp3',
					images: ['images/feature-reels-v2/bixie-cut.png'],
					bodyDurationInFrames: 181,
				}}
			/>
			<Composition
				id="FeatureMultipleLooksV2"
				component={FeatureReel}
				durationInFrames={312}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'The Wolf Cut Effect',
					subline: "This season's shaggiest trend, tried instantly",
					voiceoverSrc: 'audio/feature-reels-v2/v2-2-wolf-cut.mp3',
					images: ['images/feature-reels-v2/wolf-cut.png'],
					bodyDurationInFrames: 222,
				}}
			/>
			<Composition
				id="FeatureBeforeAfterV2"
				component={FeatureReel}
				durationInFrames={354}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Beige-Brown Balayage',
					subline: "The cut & color everyone's requesting",
					voiceoverSrc: 'audio/feature-reels-v2/v2-3-balayage-lob.mp3',
					images: ['images/feature-reels-v2/balayage-lob.png'],
					bodyDurationInFrames: 264,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="FeatureStyleLibraryV2"
				component={FeatureReel}
				durationInFrames={290}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Birkin Bangs, Your Way',
					subline: 'Wispy, face-framing, trending now',
					voiceoverSrc: 'audio/feature-reels-v2/v2-4-birkin-bangs.mp3',
					images: ['images/feature-reels-v2/birkin-bangs.png'],
					bodyDurationInFrames: 200,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="FeatureTryBeforeCommitV2"
				component={FeatureReel}
				durationInFrames={354}
				fps={30}
				width={1080}
				height={1920}
				schema={featureReelSchema}
				defaultProps={{
					...featureReelDefaultProps,
					headline: 'Cherry Red? Why Not.',
					subline: 'Bold color, zero risk — try it free',
					voiceoverSrc: 'audio/feature-reels-v2/v2-5-cherry-red.mp3',
					images: ['images/feature-reels-v2/cherry-red.png'],
					bodyDurationInFrames: 264,
				}}
			/>
			{/* 6 B2C feature-benefit reels: longer (~15-24s) format with Kling
			    model photos (one full-bleed photo at a time, no grid), ElevenLabs
			    voiceover, and music, each ending on the shared EndCard. See
			    docs/superpowers/plans/2026-07-30-feature-benefit-reels.md for the
			    duration math (bodyDurationInFrames = ceil(voiceSeconds*30) + 45,
			    total = body + 90). */}
			<Composition
				id="BenefitInstantRender"
				component={FeatureBenefitReel}
				durationInFrames={708}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Instant AI Render',
					subline: 'Studio-grade previews in under 20 seconds',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-1-instant-render.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-1-photo-1.png',
					photo1Caption: 'Upload one selfie',
					photo2Src: 'images/feature-benefit-reels/benefit-1-photo-2.png',
					photo2Caption: 'See your new look in seconds',
					bodyDurationInFrames: 618,
				}}
			/>
			<Composition
				id="BenefitPrivacyFirst"
				component={FeatureBenefitReel}
				durationInFrames={659}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Privacy-First',
					subline: 'Your photos. Your control.',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-2-privacy-first.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-2-photo-1.png',
					photo1Caption: 'You take the photo',
					photo2Src: 'images/feature-benefit-reels/benefit-2-photo-2.png',
					photo2Caption: 'It stays yours, always',
					bodyDurationInFrames: 569,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="BenefitHairstyleTryOn"
				component={FeatureBenefitReel}
				durationInFrames={586}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Hairstyle-Only Try-On',
					subline: 'See the cut before you commit',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-3-hairstyle-try-on.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-3-photo-1.png',
					photo1Caption: 'Try a sleek straight look',
					photo2Src: 'images/feature-benefit-reels/benefit-3-photo-2.png',
					photo2Caption: 'Or a bold curly bob',
					bodyDurationInFrames: 496,
				}}
			/>
			<Composition
				id="BenefitDressTryOn"
				component={FeatureBenefitReel}
				durationInFrames={604}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Dress Try-On',
					subline: 'See it on you before you buy',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-4-dress-try-on.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-4-photo-1.png',
					photo1Caption: 'Start with your everyday look',
					photo2Src: 'images/feature-benefit-reels/benefit-4-photo-2.png',
					photo2Caption: 'See the dress on you instantly',
					bodyDurationInFrames: 514,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="BenefitHairstyleSunglasses"
				component={FeatureBenefitReel}
				durationInFrames={468}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Hair + Sunglasses Matching',
					subline: 'A complete look, matched for you',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-5-hairstyle-sunglasses.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-5-photo-1.png',
					photo1Caption: 'Pick your hairstyle',
					photo2Src: 'images/feature-benefit-reels/benefit-5-photo-2.png',
					photo2Caption: 'Add sunglasses that match',
					bodyDurationInFrames: 378,
				}}
			/>
			<Composition
				id="BenefitPlayWithYourLook"
				component={FeatureBenefitReel}
				durationInFrames={677}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Play With Your Look',
					subline: 'Hair. Dress. Glasses. Your call.',
					voiceoverSrc: 'audio/feature-benefit-reels/benefit-6-play-with-your-look.mp3',
					photo1Src: 'images/feature-benefit-reels/benefit-6-photo-1.png',
					photo1Caption: 'Mix and match freely',
					photo2Src: 'images/feature-benefit-reels/benefit-6-photo-2.png',
					photo2Caption: 'Find the look that is unmistakably you',
					bodyDurationInFrames: 587,
					accentColor: BRAND.amber,
				}}
			/>
			{/* Batch 2: 6 more B2C feature-benefit reels, same FeatureBenefitReel
			    format as batch 1 above. See
			    docs/superpowers/plans/2026-07-31-feature-benefit-reels-2.md for the
			    duration math (bodyDurationInFrames = ceil(voiceSeconds*30) + 45,
			    total = body + 90). */}
			<Composition
				id="Benefit2FaceShapeMatched"
				component={FeatureBenefitReel}
				durationInFrames={485}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Face-Shape Matched Styling',
					subline: 'Cuts that actually suit you',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-1-face-shape-matched.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-1-photo-1.png',
					photo1Caption: 'We read your face shape first',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-1-photo-2.png',
					photo2Caption: 'Then suggest what actually suits you',
					bodyDurationInFrames: 395,
				}}
			/>
			<Composition
				id="Benefit2BeardStyling"
				component={FeatureBenefitReel}
				durationInFrames={520}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Beard Styling',
					subline: 'See it before the barber chair',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-2-beard-styling.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-2-photo-1.png',
					photo1Caption: 'Start with your natural beard',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-2-photo-2.png',
					photo2Caption: 'Preview the fade and line-up',
					bodyDurationInFrames: 430,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="Benefit2MakeupTryOn"
				component={FeatureBenefitReel}
				durationInFrames={505}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Makeup Try-On',
					subline: 'From everyday to full glam',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-3-makeup-tryon.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-3-photo-1.png',
					photo1Caption: 'Start bare-faced',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-3-photo-2.png',
					photo2Caption: 'Preview glam makeup instantly',
					bodyDurationInFrames: 415,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Benefit2AnyDevice"
				component={FeatureBenefitReel}
				durationInFrames={524}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Works Anywhere, Any Device',
					subline: 'No app to install',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-4-any-device.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-4-photo-1.png',
					photo1Caption: 'Open it on your phone',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-4-photo-2.png',
					photo2Caption: 'Or your laptop, anywhere',
					bodyDurationInFrames: 434,
				}}
			/>
			<Composition
				id="Benefit2ZeroDecisionFatigue"
				component={FeatureBenefitReel}
				durationInFrames={527}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Zero Decision Fatigue',
					subline: 'Curated picks made for you',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-5-zero-decision-fatigue.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-5-photo-1.png',
					photo1Caption: 'Skip the endless scroll',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-5-photo-2.png',
					photo2Caption: 'Love the result, faster',
					bodyDurationInFrames: 437,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="Benefit2WalkInKnowing"
				component={FeatureBenefitReel}
				durationInFrames={432}
				fps={30}
				width={1080}
				height={1920}
				schema={featureBenefitReelSchema}
				defaultProps={{
					...featureBenefitReelDefaultProps,
					headline: 'Walk In Knowing',
					subline: 'See your salon look first',
					voiceoverSrc: 'audio/feature-benefit-reels-2/benefit2-6-walk-in-knowing.mp3',
					photo1Src: 'images/feature-benefit-reels-2/benefit2-6-photo-1.png',
					photo1Caption: 'Preview your exact look',
					photo2Src: 'images/feature-benefit-reels-2/benefit2-6-photo-2.png',
					photo2Caption: 'Walk in already knowing',
					bodyDurationInFrames: 342,
					accentColor: BRAND.purple,
				}}
			/>
			{/* Batch 3: 6 more B2C feature-benefit reels, same FeatureBenefitReel
			    format as batches 1 and 2. Targets the hesitation moments the
			    earlier batches did not cover. See
			    docs/superpowers/specs/2026-08-05-feature-benefit-reels-3-design.md.
			    Duration math: bodyDurationInFrames = ceil(voiceSeconds*30) + 45,
			    total = body + 90. */}
			<Composition
				id="Benefit3HairColour"
				component={FeatureBenefitReel}
				durationInFrames={807}
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
					bodyDurationInFrames: 717,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Benefit3BigChop"
				component={FeatureBenefitReel}
				durationInFrames={765}
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
					bodyDurationInFrames: 675,
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Benefit3Bangs"
				component={FeatureBenefitReel}
				durationInFrames={740}
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
					bodyDurationInFrames: 650,
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="Benefit3WeddingLook"
				component={FeatureBenefitReel}
				durationInFrames={630}
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
					bodyDurationInFrames: 540,
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="Benefit3HairLength"
				component={FeatureBenefitReel}
				durationInFrames={709}
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
					bodyDurationInFrames: 619,
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="Benefit3FriendsVote"
				component={FeatureBenefitReel}
				durationInFrames={728}
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
					bodyDurationInFrames: 638,
					accentColor: BRAND.amber,
				}}
			/>
			{/* Static 2:3 Pinterest pin images (photo + text overlay), one per
			    batch-2 video, replacing video pins that Pinterest's spam filter
			    blocked when hosted on raw.githubusercontent.com. Rendered via
			    `remotion still`, not `remotion render`. */}
			<Composition
				id="PinBeardStyling"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-2-photo-2.png',
					headline: 'Beard Styling',
					subline: 'See it before the barber chair',
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="PinMakeupTryOn"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-3-photo-2.png',
					headline: 'Makeup Try-On',
					subline: 'From everyday to full glam',
					accentColor: BRAND.purple,
				}}
			/>
			<Composition
				id="PinAnyDevice"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-4-photo-2.png',
					headline: 'Works Anywhere',
					subline: 'No app to install',
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="PinZeroDecisionFatigue"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-5-photo-2.png',
					headline: 'Zero Decision Fatigue',
					subline: 'Curated picks made for you',
					accentColor: BRAND.amber,
				}}
			/>
			<Composition
				id="PinFaceShapeMatched"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-1-photo-2.png',
					headline: 'Face-Shape Matched',
					subline: 'Cuts that actually suit you',
					accentColor: BRAND.cyan,
				}}
			/>
			<Composition
				id="PinWalkInKnowing"
				component={PinterestPin}
				durationInFrames={1}
				fps={30}
				width={1000}
				height={1500}
				schema={pinterestPinSchema}
				defaultProps={{
					...pinterestPinDefaultProps,
					photoSrc: 'images/feature-benefit-reels-2/benefit2-6-photo-2.png',
					headline: 'Walk In Knowing',
					subline: 'See your salon look first',
					accentColor: BRAND.purple,
				}}
			/>
			{/* Batch 3 pins, same static-image approach as the batch-2 pins above.
			    Each reuses its reel's photo 2 so the pin and the video read as the
			    same story. */}
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
			{/* Shorter headline than the reel's "Your Wedding Look, Trialled" —
			    the full line overflows the pin's text block at 1000px wide. */}
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
		</>
	);
};
