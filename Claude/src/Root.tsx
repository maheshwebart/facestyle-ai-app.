import {Composition} from 'remotion';
import {PRESETS, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from './config';
import {
	BrandedVideo,
	brandedVideoDefaultProps,
	brandedVideoSchema,
} from './compositions/BrandedVideo';
import {
	BrandWatermark,
	brandWatermarkDefaultProps,
	brandWatermarkSchema,
} from './compositions/BrandWatermark';
import {
	EndCard,
	endCardDefaultProps,
	endCardSchema,
} from './compositions/EndCard';
import {
	KineticText,
	kineticTextDefaultProps,
	kineticTextSchema,
} from './compositions/KineticText';
import {
	LowerThird,
	lowerThirdDefaultProps,
	lowerThirdSchema,
} from './compositions/LowerThird';
import {
	TitleCard,
	titleCardDefaultProps,
	titleCardSchema,
} from './compositions/TitleCard';
import {
	SocialClip,
	socialClipDefaultProps,
	socialClipSchema,
} from './compositions/SocialClip';
import {
	TransparentOverlay,
	transparentOverlayDefaultProps,
	transparentOverlaySchema,
} from './compositions/TransparentOverlay';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TitleCard"
				component={TitleCard}
				durationInFrames={90}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={titleCardSchema}
				defaultProps={titleCardDefaultProps}
			/>
			<Composition
				id="LowerThird"
				component={LowerThird}
				durationInFrames={120}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={lowerThirdSchema}
				defaultProps={lowerThirdDefaultProps}
			/>
			<Composition
				id="KineticText"
				component={KineticText}
				durationInFrames={100}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={kineticTextSchema}
				defaultProps={kineticTextDefaultProps}
			/>
			{/* Transparent background — render with the ProRes 4444 command in the README to keep alpha. */}
			<Composition
				id="TransparentOverlay"
				component={TransparentOverlay}
				durationInFrames={90}
				fps={VIDEO_FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				schema={transparentOverlaySchema}
				defaultProps={transparentOverlayDefaultProps}
			/>
			{/* 9:16 branded corner watermark — transparent background, layer over any vertical video.
			    Extend durationInFrames here to match the length of the footage you're branding. */}
			<Composition
				id="BrandWatermark"
				component={BrandWatermark}
				durationInFrames={900}
				fps={PRESETS.vertical9x16_30.fps}
				width={PRESETS.vertical9x16_30.width}
				height={PRESETS.vertical9x16_30.height}
				schema={brandWatermarkSchema}
				defaultProps={brandWatermarkDefaultProps}
			/>
			{/* Source clip + BrandWatermark composited into one finished file.
			    Sized to match public/raw/demo-clip.mp4 (720x1280 @ 24fps, 121 frames / ~5s).
			    For a new clip, update videoSrc in defaultProps and these dimensions. */}
			<Composition
				id="BrandedVideo"
				component={BrandedVideo}
				durationInFrames={121}
				fps={24}
				width={720}
				height={1280}
				schema={brandedVideoSchema}
				defaultProps={brandedVideoDefaultProps}
			/>
			{/* Static CTA/promo card, fades in and holds — the closing segment of SocialClip. */}
			<Composition
				id="EndCard"
				component={EndCard}
				durationInFrames={90}
				fps={24}
				width={720}
				height={1280}
				schema={endCardSchema}
				defaultProps={endCardDefaultProps}
			/>
			{/* The full deliverable: branded clip, hard-cut to the end card.
			    durationInFrames = clipDurationInFrames + end-card hold (here 121 + 90 = 211).
			    For a new clip, update videoSrc + clipDurationInFrames + this total. */}
			<Composition
				id="SocialClip"
				component={SocialClip}
				durationInFrames={211}
				fps={24}
				width={720}
				height={1280}
				schema={socialClipSchema}
				defaultProps={socialClipDefaultProps}
			/>
		</>
	);
};
