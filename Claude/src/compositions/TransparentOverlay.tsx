import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_EXIT} from '../motion';

export const transparentOverlaySchema = z.object({
	label: z.string(),
	badgeColor: z.string(),
	dotColor: z.string(),
	textColor: z.string(),
});

export const transparentOverlayDefaultProps: z.infer<
	typeof transparentOverlaySchema
> = {
	label: 'LIVE',
	badgeColor: BRAND.navy,
	dotColor: BRAND.cyan,
	textColor: BRAND.white,
};

const EXIT_DURATION = 15;

// Renders on a transparent background so it can be composited as an overlay
// in another editor. See README for the --pixel-format=yuva444p10le render command.
export const TransparentOverlay: React.FC<
	z.infer<typeof transparentOverlaySchema>
> = ({label, badgeColor, dotColor, textColor}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const entrance = spring({
		frame,
		fps,
		config: {damping: 14, stiffness: 170, mass: 0.5},
	});

	const exitStart = durationInFrames - EXIT_DURATION;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});

	// A slow, subtle breathing pulse once the badge has settled in — reads
	// as "live/active" without being distracting.
	const settled = Math.max(0, frame - 20);
	const pulse = 1 + Math.sin(settled / fps / 1.4) * 0.02;

	const scale = interpolate(entrance, [0, 1], [0.7, 1]) * pulse * (1 - exit * 0.15);
	const opacity = Math.min(entrance, 1 - exit);
	const dotPulse = 0.6 + Math.sin(settled / fps / 0.7) * 0.4;

	return (
		<AbsoluteFill
			style={{
				// Fully transparent — do NOT set a backgroundColor here.
				alignItems: 'flex-start',
				justifyContent: 'flex-start',
				padding: '6% 0 0 6%',
			}}
		>
			<div
				style={{
					opacity,
					transform: `scale(${scale})`,
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					padding: '14px 26px',
					borderRadius: 999,
					backgroundColor: badgeColor,
					boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
					fontFamily: 'Arial, Helvetica, sans-serif',
				}}
			>
				<div
					style={{
						width: 14,
						height: 14,
						borderRadius: '50%',
						backgroundColor: dotColor,
						opacity: dotPulse,
					}}
				/>
				<div
					style={{
						fontSize: 28,
						fontWeight: 700,
						color: textColor,
						letterSpacing: 2,
					}}
				>
					{label}
				</div>
			</div>
		</AbsoluteFill>
	);
};
