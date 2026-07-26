import {AbsoluteFill, Sequence} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {BrandedVideo, brandedVideoSchema} from './BrandedVideo';
import {EndCard} from './EndCard';

// The full, ready-to-post deliverable: source clip + brand watermark, then a
// hard cut to the end-card CTA screen for the last few seconds. This is what
// the batch pipeline should target once a clip is approved — BrandedVideo
// and EndCard stay independently useful for previewing each piece on its own.
// The end card reuses the same iconSrc/textColor/accentColor as the video
// watermark (one brand, one set of values) and only adds its own headline/
// tagline/url copy on top.
export const socialClipSchema = z.object({
	...brandedVideoSchema.shape,
	clipDurationInFrames: z.number(),
	endCardHeadlineLine1: z.string(),
	endCardHeadlineLine2: z.string(),
	endCardTagline: z.string(),
	endCardUrl: z.string(),
	endCardBackgroundColor: z.string(),
	endCardAccentColor2: z.string(),
});

export const socialClipDefaultProps: z.infer<typeof socialClipSchema> = {
	videoSrc: 'raw/demo-clip.mp4',
	clipDurationInFrames: 121,
	iconSrc: 'brand/facestylefun-icon.png',
	wordmarkPrimary: 'facestyle',
	wordmarkAccent: '.fun',
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
	corner: 'topRight',
	iconSize: 64,
	endCardHeadlineLine1: 'One Photo.',
	endCardHeadlineLine2: 'Infinite Styles.',
	endCardTagline: 'AI Face. Your Style.',
	endCardUrl: 'facestyle.fun',
	endCardBackgroundColor: BRAND.navy,
	endCardAccentColor2: BRAND.purple,
};

export const SocialClip: React.FC<z.infer<typeof socialClipSchema>> = ({
	clipDurationInFrames,
	videoSrc,
	iconSrc,
	textColor,
	accentColor,
	endCardHeadlineLine1,
	endCardHeadlineLine2,
	endCardTagline,
	endCardUrl,
	endCardBackgroundColor,
	endCardAccentColor2,
	...watermarkProps
}) => {
	return (
		<AbsoluteFill>
			<Sequence from={0} durationInFrames={clipDurationInFrames}>
				<BrandedVideo
					videoSrc={videoSrc}
					iconSrc={iconSrc}
					textColor={textColor}
					accentColor={accentColor}
					{...watermarkProps}
				/>
			</Sequence>
			<Sequence from={clipDurationInFrames}>
				<EndCard
					iconSrc={iconSrc}
					textColor={textColor}
					accentColor={accentColor}
					headlineLine1={endCardHeadlineLine1}
					headlineLine2={endCardHeadlineLine2}
					tagline={endCardTagline}
					url={endCardUrl}
					backgroundColor={endCardBackgroundColor}
					accentColor2={endCardAccentColor2}
				/>
			</Sequence>
		</AbsoluteFill>
	);
};
