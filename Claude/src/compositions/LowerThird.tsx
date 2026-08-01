import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';
import {EASE_ENTER, EASE_EXIT} from '../motion';

export const lowerThirdSchema = z.object({
	name: z.string(),
	role: z.string(),
	accentColor: z.string(),
	textColor: z.string(),
	panelColor: z.string(),
});

export const lowerThirdDefaultProps: z.infer<typeof lowerThirdSchema> = {
	name: 'Jane Doe',
	role: 'Director of Something',
	accentColor: BRAND.cyan,
	textColor: BRAND.white,
	panelColor: BRAND.navy,
};

const ENTER_DURATION = 18;
const EXIT_DURATION = 16;

export const LowerThird: React.FC<z.infer<typeof lowerThirdSchema>> = ({
	name,
	role,
	accentColor,
	textColor,
	panelColor,
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

	// The accent bar leads the panel in and trails it out, so the motion
	// reads as one continuous sweep rather than two things fading together.
	const barEnter = interpolate(frame, [0, ENTER_DURATION * 0.6], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_ENTER,
	});

	const opacity = enter * (1 - exit);
	const translateX = interpolate(enter, [0, 1], [-40, 0]) + exit * -24;

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-end',
				alignItems: 'flex-start',
				fontFamily: 'Arial, Helvetica, sans-serif',
				padding: '0 8% 10% 8%',
			}}
		>
			<div
				style={{
					opacity,
					transform: `translateX(${translateX}px)`,
					display: 'flex',
					alignItems: 'stretch',
					backgroundColor: `${panelColor}CC`,
					backdropFilter: 'blur(14px)',
					borderRadius: 10,
					overflow: 'hidden',
					boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
				}}
			>
				<div
					style={{
						width: 8,
						backgroundColor: accentColor,
						transform: `scaleY(${barEnter})`,
						transformOrigin: 'top',
					}}
				/>
				<div style={{padding: '20px 30px'}}>
					<div style={{fontSize: 34, fontWeight: 700, color: textColor}}>
						{name}
					</div>
					<div
						style={{
							fontSize: 20,
							fontWeight: 400,
							color: accentColor,
							letterSpacing: 1,
							textTransform: 'uppercase',
							marginTop: 4,
						}}
					>
						{role}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
