// Single source of truth for canvas + frame rate.
// Change these to switch the whole project (e.g. to 4K / 60fps).
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

// Handy presets you can swap in above.
export const PRESETS = {
  fullHD30: {width: 1920, height: 1080, fps: 30},
  fourK30: {width: 3840, height: 2160, fps: 30},
  fullHD60: {width: 1920, height: 1080, fps: 60},
  fourK60: {width: 3840, height: 2160, fps: 60},
  vertical9x16_30: {width: 1080, height: 1920, fps: 30},
} as const;

// Sampled from the FaceStyle.fun logo files in public/brand.
export const BRAND = {
  navy: '#0F172A',
  cyan: '#46C6E3',
  white: '#FFFFFF',
  amber: '#E3BA18',
  purple: '#A855F7',
} as const;
