// Generates the 6 before/after batch voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-before-after-voiceovers.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'audio', 'before-after');

// Rachel — calm, professional narration voice, reused across all reels for
// brand consistency (see scripts/generate-voiceovers.mjs).
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'pixie-crop',
		text: 'Thinking about the chop? See it on your own face first.',
	},
	{
		id: 'copper-balayage',
		text: 'New color, zero risk. Preview it before you book the chair.',
	},
	{
		id: 'sleek-blowout',
		text: 'From frizzy to flawless. See it before the blow dry.',
	},
	{
		id: 'glam-makeover',
		text: 'Bare face to full glam. See your glow up instantly.',
	},
	{
		id: 'beard-fade',
		text: 'Scruffy to sharp. Preview your fade before the barber.',
	},
	{
		id: 'updo-glam',
		text: 'Casual to red carpet. See it before the big night.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error(
			'ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-before-after-voiceovers.mjs',
		);
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
