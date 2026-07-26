import {Easing} from 'remotion';

// A shared motion "signature" so every composition feels like it belongs to
// the same system, instead of each graphic inventing its own curve.

// Smooth, confident deceleration for entrances — no bounce, reads as premium
// rather than playful. ("Expo out"-style curve.)
export const EASE_ENTER = Easing.bezier(0.16, 1, 0.3, 1);

// Mirror of the above for exits — accelerates away instead of decelerating in.
export const EASE_EXIT = Easing.bezier(0.7, 0, 0.84, 0);

// Slightly snappier curve for staggered/kinetic elements where a bit of
// punch reads better than a pure glide.
export const EASE_PUNCH = Easing.bezier(0.34, 1.2, 0.64, 1);

// Symmetric, no-overshoot ease-in-out — for motion that should read as
// smooth and deliberate rather than snappy (e.g. a slow tilt).
export const EASE_SMOOTH = Easing.bezier(0.45, 0, 0.55, 1);
