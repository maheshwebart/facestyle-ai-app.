import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_ENTER, EASE_EXIT} from '../motion';

export const titleCardSchema = z.object({
	title: z.string(),
	subtitle: z.string(),
	backgroundColor: z.string(),
	textColor: z.string(),
	accentColor: z.string(),
});

export const titleCardDefaultProps: z.infer<typeof titleCardSchema> = {
	title: 'Your Title Here',
	subtitle: 'A short supporting subtitle',
	backgroundColor: BRAND.navy,
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
};

const ENTER_DURATION = 24;
const EXIT_DURATION = 20;
const ACCENT_LINE_WIDTH = 120;

export const TitleCard: React.FC<z.infer<typeof titleCardSchema>> = ({
	title,
	subtitle,
	backgroundColor,
	textColor,
	accentColor,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const enter = interpolate(frame, [0, ENTER_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});

	const exitStart = durationInFrames - EXIT_DURATION;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});

	const opacity = enter * (1 - exit);
	const translateY = interpolate(enter, [0, 1], [24, 0]) + exit * -12;
	const scale = interpolate(enter, [0, 1], [0.96, 1]) - exit * 0.03;

	// The accent line draws in slightly after the title starts moving.
	const lineProgress = interpolate(frame, [10, 10 + ENTER_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				backgroundImage: `radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)`,
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: 'Arial, Helvetica, sans-serif',
			}}
		>
			<div
				style={{
					opacity,
					transform: `translateY(${translateY}px) scale(${scale})`,
					textAlign: 'center',
					maxWidth: '90%',
				}}
			>
				<div
					style={{
						fontSize: 90,
						fontWeight: 700,
						color: textColor,
						letterSpacing: 1,
						textShadow: '0 8px 40px rgba(0,0,0,0.35)',
					}}
				>
					{title}
				</div>
				<div
					style={{
						width: ACCENT_LINE_WIDTH * lineProgress,
						height: 4,
						borderRadius: 2,
						backgroundColor: accentColor,
						margin: '22px auto',
					}}
				/>
				<div
					style={{
						fontSize: 34,
						fontWeight: 400,
						color: accentColor,
						letterSpacing: 2,
						textTransform: 'uppercase',
					}}
				>
					{subtitle}
				</div>
			</div>
		</AbsoluteFill>
	);
};
