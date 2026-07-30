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
	photo1Src: 'images/feature-benefit-reels/benefit-1-photo-1.png',
	photo1Caption: 'Upload one selfie',
	photo2Src: 'images/feature-benefit-reels/benefit-1-photo-2.png',
	photo2Caption: 'See your new look in seconds',
	bodyDurationInFrames: 618,
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
