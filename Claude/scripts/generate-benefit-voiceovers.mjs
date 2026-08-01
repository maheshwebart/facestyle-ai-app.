// Generates the 6 feature-benefit-reel voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-benefit-voiceovers.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'audio', 'feature-benefit-reels');

// Rachel — same voice as the prior feature-reels batch, for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'benefit-1-instant-render',
		text: 'Waiting for a haircut result used to take forever. Not anymore. Upload one selfie, and in under twenty seconds, see a studio-grade preview of your new look, styled and ready to compare, before you ever touch a comb or scissors.',
	},
	{
		id: 'benefit-2-privacy-first',
		text: 'Uploading your face online can feel risky. FaceStyle keeps it simple. Your photo stays yours. Nothing is shared, nothing lingers without your say. Try on any hairstyle with total confidence, knowing your picture never leaves your control.',
	},
	{
		id: 'benefit-3-hairstyle-try-on',
		text: 'Before you ever sit in the chair, see the cut on your own face, not a stranger. Switch between styles instantly, compare them side by side, and walk into your next appointment already knowing exactly what you want.',
	},
	{
		id: 'benefit-4-dress-try-on',
		text: 'Buying an outfit online is a gamble, until now. Upload your photo, try the dress, and see exactly how it looks on you, not a model. Shop with confidence, skip the guesswork, and love what shows up at your door.',
	},
	{
		id: 'benefit-5-hairstyle-sunglasses',
		text: 'A great look is more than just hair. FaceStyle pairs your new hairstyle with sunglasses that actually match your face shape, so every detail works together, not just the cut.',
	},
	{
		id: 'benefit-6-play-with-your-look',
		text: 'Hair, dresses, sunglasses. Mix and match until you find the look that is unmistakably you. One photo, endless combinations. Play with your look, free, right now, at facestyle dot fun.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-benefit-voiceovers.mjs');
	}

	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
		{
			method: 'POST',
			headers: {
				'xi-api-key': apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({text, model_id: MODEL_ID}),
		},
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`ElevenLabs TTS failed for ${id}: ${response.status} ${body}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length < 2000) {
		throw new Error(
			`ElevenLabs TTS response for ${id} looks too small (${buffer.length} bytes) — likely an error body, not audio.`,
		);
	}
	const outPath = path.join(outDir, `${id}.mp3`);
	await fs.writeFile(outPath, buffer);
	console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
}

async function main() {
	await fs.mkdir(outDir, {recursive: true});
	for (const script of scripts) {
		await generateOne(script);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
