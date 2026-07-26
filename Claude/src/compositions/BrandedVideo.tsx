import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {z} from 'zod';
import {BrandWatermark, brandWatermarkSchema} from './BrandWatermark';

// Combines a source clip with the BrandWatermark overlay into one finished,
// ready-to-post file — this is the "apply the template to a real video" path,
// as opposed to rendering BrandWatermark alone as a transparent layer for a
// separate editor. Good for quickly branding a batch of clips end-to-end
// without ever opening an NLE.
export const brandedVideoSchema = z.object({
	videoSrc: z.string(),
	...brandWatermarkSchema.shape,
});

export const brandedVideoDefaultProps: z.infer<typeof brandedVideoSchema> = {
	videoSrc: 'raw/demo-clip.mp4',
	iconSrc: 'brand/facestylefun-icon.png',
	wordmarkPrimary: 'facestyle',
	wordmarkAccent: '.fun',
	textColor: '#ffffff',
	accentColor: '#46C6E3',
	corner: 'topRight',
	iconSize: 64,
};

export const BrandedVideo: React.FC<z.infer<typeof brandedVideoSchema>> = ({
	videoSrc,
	...watermarkProps
}) => {
	return (
		<AbsoluteFill>
			<OffthreadVideo src={staticFile(videoSrc)} />
			<BrandWatermark {...watermarkProps} />
		</AbsoluteFill>
	);
};
