import {loadFont} from '@remotion/google-fonts/Inter';
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

// Loaded once at module scope, as recommended by @remotion/google-fonts.
// Restricted to the weight/subset we actually use to avoid excess requests.
const {fontFamily} = loadFont('normal', {
	weights: ['800'],
	subsets: ['latin'],
});

export const kineticTextSchema = z.object({
	text: z.string(),
	backgroundColor: z.string(),
	textColor: z.string(),
	accentColor: z.string(),
	// frames between each word starting its entrance
	staggerFrames: z.number(),
});

export const kineticTextDefaultProps: z.infer<typeof kineticTextSchema> = {
	text: 'Motion Makes It Memorable',
	backgroundColor: BRAND.navy,
	textColor: BRAND.white,
	accentColor: BRAND.cyan,
	staggerFrames: 6,
};

const EXIT_DURATION = 18;

export const KineticText: React.FC<z.infer<typeof kineticTextSchema>> = ({
	text,
	backgroundColor,
	textColor,
	accentColor,
	staggerFrames,
}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const words = text.split(' ');

	const exitStart = durationInFrames - EXIT_DURATION;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: EASE_EXIT,
	});
	const exitOpacity = 1 - exit;
	const exitScale = interpolate(exit, [0, 1], [1, 0.9]);

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					maxWidth: '85%',
					opacity: exitOpacity,
					transform: `scale(${exitScale})`,
				}}
			>
				{words.map((word, i) => {
					const wordFrame = frame - i * staggerFrames;
					const entrance = spring({
						frame: wordFrame,
						fps,
						config: {damping: 16, stiffness: 130, mass: 0.5},
					});
					const translateY = interpolate(entrance, [0, 1], [40, 0]);
					// Every other word picks up the accent color for a bit of
					// rhythm instead of a flat wall of one color.
					const color = i % 3 === 1 ? accentColor : textColor;

					return (
						<span
							key={`${word}-${i}`}
							style={{
								opacity: entrance,
								transform: `translateY(${translateY}px)`,
								fontSize: 72,
								fontWeight: 800,
								color,
								marginRight: 22,
								marginBottom: 10,
							}}
						>
							{word}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
