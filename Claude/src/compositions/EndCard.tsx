import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_ENTER} from '../motion';

const {fontFamily} = loadFont('normal', {
	weights: ['800'],
	subsets: ['latin'],
});

export const endCardSchema = z.object({
	iconSrc: z.string(),
	headlineLine1: z.string(),
	headlineLine2: z.string(),
	tagline: z.string(),
	url: z.string(),
	backgroundColor: z.string(),
	textColor: z.string(),
	accentColor: z.string(),
	accentColor2: z.string(),
});

export const endCardDefaultProps: z.infer<typeof endCardSchema> = {
	iconSrc: 'brand/facestylefun-icon.png',
	headlineLine1: 'One Photo.',
	headlineLine2: 'Infinite Styles.',
	tagline: 'AI Face. Your Style.',
	url: 'facestyle.fun',
	backgroundColor: BRAND.navy,
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
	accentColor2: BRAND.purple,
};

const ENTER_DURATION = 26;

// A native, code-composed closing card — deliberately built from the same
// icon/font/color system as BrandWatermark and TitleCard so it reads as part
// of the same video rather than a pasted-in external graphic. Fades in and
// holds; no exit, since the video simply ends on it.
export const EndCard: React.FC<z.infer<typeof endCardSchema>> = ({
	iconSrc,
	headlineLine1,
	headlineLine2,
	tagline,
	url,
	backgroundColor,
	textColor,
	accentColor,
	accentColor2,
}) => {
	const frame = useCurrentFrame();

	const enter = interpolate(frame, [0, ENTER_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});
	const translateY = interpolate(enter, [0, 1], [20, 0]);
	const scale = interpolate(enter, [0, 1], [0.94, 1]);

	// The URL pill trails slightly behind the headline for a bit of sequence.
	const urlEnter = interpolate(frame, [14, 14 + ENTER_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				backgroundImage:
					'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.3) 100%)',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: 'Arial, Helvetica, sans-serif',
			}}
		>
			<div
				style={{
					opacity: enter,
					transform: `translateY(${translateY}px) scale(${scale})`,
					textAlign: 'center',
					maxWidth: '86%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<Img
					src={staticFile(iconSrc)}
					style={{
						width: 120,
						height: 120,
						filter: `drop-shadow(0 0 26px ${accentColor}77)`,
					}}
				/>

				<div
					style={{
						marginTop: 28,
						fontFamily,
						fontWeight: 800,
						fontSize: 56,
						lineHeight: 1.15,
						color: textColor,
					}}
				>
					{headlineLine1}
				</div>
				<div
					style={{
						fontFamily,
						fontWeight: 800,
						fontSize: 56,
						lineHeight: 1.15,
						backgroundImage: `linear-gradient(90deg, ${accentColor}, ${accentColor2})`,
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
						color: 'transparent',
					}}
				>
					{headlineLine2}
				</div>

				<div
					style={{
						marginTop: 16,
						fontSize: 22,
						letterSpacing: 3,
						textTransform: 'uppercase',
						color: accentColor,
						opacity: 0.85,
					}}
				>
					{tagline}
				</div>

				<div
					style={{
						opacity: urlEnter,
						transform: `translateY(${(1 - urlEnter) * 10}px)`,
						marginTop: 40,
						padding: '16px 40px',
						borderRadius: 999,
						border: `2px solid ${accentColor}`,
						fontFamily,
						fontWeight: 800,
						fontSize: 30,
						color: textColor,
						letterSpacing: 0.5,
					}}
				>
					{url}
				</div>
			</div>
		</AbsoluteFill>
	);
};
