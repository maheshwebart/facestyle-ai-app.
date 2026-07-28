// Generates the 5 feature-reel voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-voiceovers.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'audio', 'feature-reels');

// Rachel — calm, professional narration voice, confirmed working with this
// account's TTS-scoped API key. Reused across all 5 for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'feature-1-instant-try-on',
		text: 'One selfie. One tap. See your next hairstyle in seconds, before you ever pick up the scissors.',
	},
	{
		id: 'feature-2-multiple-looks',
		text: 'Same selfie, endless looks. Try wavy, sleek, or updo, all from one photo, side by side.',
	},
	{
		id: 'feature-3-before-after',
		text: 'Stop guessing. See your before and after, side by side, before you commit to the cut.',
	},
	{
		id: 'feature-4-style-library',
		text: 'Hundreds of trending cuts and colors, ready to try on your own face, anytime you like.',
	},
	{
		id: 'feature-5-try-before-commit',
		text: 'No more bad haircut surprises. Try any style free, right now, at facestyle dot fun.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-voiceovers.mjs');
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
