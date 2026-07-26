import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_ENTER, EASE_EXIT} from '../motion';

const {fontFamily} = loadFont('normal', {
	weights: ['800'],
	subsets: ['latin'],
});

export const brandWatermarkSchema = z.object({
	iconSrc: z.string(),
	wordmarkPrimary: z.string(),
	wordmarkAccent: z.string(),
	textColor: z.string(),
	accentColor: z.string(),
	corner: z.enum(['topRight', 'topLeft', 'bottomRight', 'bottomLeft']),
	iconSize: z.number(),
});

export const brandWatermarkDefaultProps: z.infer<
	typeof brandWatermarkSchema
> = {
	iconSrc: 'brand/facestylefun-icon.png',
	wordmarkPrimary: 'facestyle',
	wordmarkAccent: '.fun',
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
	corner: 'topRight',
	iconSize: 90,
};

const EDGE_MARGIN = 56;
const FADE_FRAMES = 20;

const cornerStyle = (
	corner: z.infer<typeof brandWatermarkSchema>['corner'],
): React.CSSProperties => {
	switch (corner) {
		case 'topRight':
			return {top: EDGE_MARGIN, right: EDGE_MARGIN};
		case 'topLeft':
			return {top: EDGE_MARGIN, left: EDGE_MARGIN};
		case 'bottomRight':
			return {bottom: EDGE_MARGIN, right: EDGE_MARGIN};
		case 'bottomLeft':
			return {bottom: EDGE_MARGIN, left: EDGE_MARGIN};
		default:
			return {top: EDGE_MARGIN, right: EDGE_MARGIN};
	}
};

// A persistent branded corner badge meant to be composited as a transparent
// overlay layer on top of any 9:16 video. Render with the ProRes 4444
// command in the README, then place it as a top track over your footage in
// your editor. Duration is set in Root.tsx — extend it there to match the
// length of the video you're layering it over.
export const BrandWatermark: React.FC<
	z.infer<typeof brandWatermarkSchema>
> = ({
	iconSrc,
	wordmarkPrimary,
	wordmarkAccent,
	textColor,
	accentColor,
	corner,
	iconSize,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});
	const fadeOutStart = durationInFrames - FADE_FRAMES;
	const fadeOut = interpolate(
		frame,
		[fadeOutStart, durationInFrames],
		[1, 0],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: EASE_EXIT,
		},
	);
	// Deliberately opacity-only, no scale/rotate: transforming a small raster
	// PNG frame-by-frame causes visible resampling shimmer on fine details
	// (the icon's eyes/smile). A pure opacity fade has no such artifact.
	const opacity = Math.min(fadeIn, fadeOut);

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					...cornerStyle(corner),
					opacity,
					display: 'flex',
					alignItems: 'center',
					gap: 14,
				}}
			>
				<Img
					src={staticFile(iconSrc)}
					style={{
						width: iconSize,
						height: iconSize,
						filter: `drop-shadow(0 0 18px ${accentColor}66) drop-shadow(0 4px 10px rgba(0,0,0,0.4))`,
					}}
				/>
				<div
					style={{
						fontFamily,
						fontWeight: 800,
						fontSize: iconSize * 0.42,
						letterSpacing: 0.5,
						whiteSpace: 'nowrap',
						textShadow: '0 2px 10px rgba(0,0,0,0.5)',
					}}
				>
					<span style={{color: textColor}}>{wordmarkPrimary}</span>
					<span style={{color: accentColor}}>{wordmarkAccent}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
