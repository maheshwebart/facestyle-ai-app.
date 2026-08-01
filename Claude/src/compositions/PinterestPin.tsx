import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {z} from 'zod';
import {BRAND} from '../config';

const {fontFamily} = loadFont('normal', {
	weights: ['800', '400'],
	subsets: ['latin'],
});

// A static 2:3 Pinterest pin image: full-bleed model photo + bold text
// overlay + brand badge. Rendered as a single still frame (no animation) via
// `remotion still`, reusing the same photo assets and brand system as
// FeatureBenefitReel so the pin visually matches its companion video.
export const pinterestPinSchema = z.object({
	photoSrc: z.string(),
	headline: z.string(),
	subline: z.string(),
	accentColor: z.string(),
	textColor: z.string(),
});

export const pinterestPinDefaultProps: z.infer<typeof pinterestPinSchema> = {
	photoSrc: 'images/feature-benefit-reels-2/benefit2-2-photo-1.png',
	headline: 'Beard Styling',
	subline: 'See it before the barber chair',
	accentColor: BRAND.amber,
	textColor: BRAND.white,
};

export const PinterestPin: React.FC<z.infer<typeof pinterestPinSchema>> = ({
	photoSrc,
	headline,
	subline,
	accentColor,
	textColor,
}) => {
	return (
		<AbsoluteFill style={{fontFamily}}>
			<Img
				src={staticFile(photoSrc)}
				style={{width: '100%', height: '100%', objectFit: 'cover'}}
			/>
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)',
				}}
			/>
			<Img
				src={staticFile('brand/facestylefun-icon.png')}
				style={{
					position: 'absolute',
					top: 44,
					left: 44,
					width: 72,
					height: 72,
					filter: `drop-shadow(0 0 18px ${accentColor}88)`,
				}}
			/>
			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'flex-end',
					padding: '0 48px 72px',
				}}
			>
				<div
					style={{
						fontSize: 64,
						fontWeight: 800,
						color: textColor,
						textAlign: 'center',
						lineHeight: 1.15,
						textShadow: '0 6px 30px rgba(0,0,0,0.6)',
					}}
				>
					{headline}
				</div>
				<div
					style={{
						marginTop: 18,
						fontSize: 32,
						fontWeight: 400,
						color: accentColor,
						textAlign: 'center',
						letterSpacing: 0.5,
						textShadow: '0 4px 20px rgba(0,0,0,0.6)',
					}}
				>
					{subline}
				</div>
				<div
					style={{
						marginTop: 32,
						padding: '12px 32px',
						borderRadius: 999,
						border: `2px solid ${accentColor}`,
						fontSize: 24,
						fontWeight: 800,
						color: textColor,
						letterSpacing: 0.5,
					}}
				>
					facestyle.fun
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
