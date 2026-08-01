// Generates the 6 feature-benefit-reel voiceover MP3s (batch 2) via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-benefit-voiceovers-2.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'audio', 'feature-benefit-reels-2');

// Rachel — same voice as the prior two batches, for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'benefit2-1-face-shape-matched',
		text: 'Not every style suits every face. FaceStyle reads your face shape first, then surfaces the cuts most likely to actually work for you, instead of a random grid of styles to guess from.',
	},
	{
		id: 'benefit2-2-beard-styling',
		text: 'Growing out a new beard is a commitment. See the fade, the line-up, the shape, all on your own face, before you ever sit in the barber chair. Walk in knowing exactly what you want.',
	},
	{
		id: 'benefit2-3-makeup-tryon',
		text: 'From soft everyday looks to full glam, preview makeup on your own face before the big night. Studio lighting, real detail, zero risk. See it first, then decide.',
	},
	{
		id: 'benefit2-4-any-device',
		text: 'No app to install, no account to juggle. FaceStyle works right in your browser, on your phone or your laptop, anywhere you are. Just open it and try your next look.',
	},
	{
		id: 'benefit2-5-zero-decision-fatigue',
		text: 'Endless scrolling for style inspiration is exhausting. FaceStyle skips the scroll and hands you curated picks made for your face, so you spend less time deciding and more time loving the result.',
	},
	{
		id: 'benefit2-6-walk-in-knowing',
		text: 'Nothing worse than a haircut that does not match the photo you brought in. Preview your exact look first, then walk into the salon already knowing exactly how it will turn out.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-benefit-voiceovers-2.mjs');
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
