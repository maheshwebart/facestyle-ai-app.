// Generates the 6 batch-3 feature-benefit-reel voiceover MP3s via ElevenLabs TTS.
//
// Usage:
//   node --env-file=.env scripts/generate-benefit-voiceovers-3.mjs
//
// Requires ELEVENLABS_API_KEY in .env (gitignored, never commit it).

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(
	projectRoot,
	'public',
	'audio',
	'feature-benefit-reels-3',
);

// Rachel — same voice as batches 1 and 2, for brand consistency.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

const scripts = [
	{
		id: 'benefit3-1-hair-colour',
		text: 'Colour is the one you cannot undo. Bleach, burgundy, balayage. Once it is done, it is done. So try it first. Upload one photo and see the exact shade on your own hair, in your own light. Compare the options side by side, then walk into the salon certain. Free at facestyle dot fun.',
	},
	{
		id: 'benefit3-2-big-chop',
		text: 'Everyone talks themselves out of the big chop. Years of length, gone in one appointment, and no way to picture it first. Now there is. See the bob, the pixie, the shoulder-length cut on your own face before a single inch comes off. Decide with your eyes, not your nerves.',
	},
	{
		id: 'benefit3-3-bangs',
		text: 'Bangs are the question everyone asks and nobody can answer. They suit some faces and ambush others, and you only find out afterwards. Upload a selfie and see the fringe on your own face before anyone picks up the scissors. An answer in twenty seconds, instead of three months of growing them out.',
	},
	{
		id: 'benefit3-4-wedding-look',
		text: 'Your wedding look gets one take. Most trials cost an afternoon and a deposit, and you still leave unsure. Try it at home instead. See the updo, the half-up, the loose waves on your own face, until one of them feels unmistakably like the day you pictured.',
	},
	{
		id: 'benefit3-5-hair-length',
		text: 'Short, medium, or long. Everyone has an opinion, and none of them are looking at your face. Upload one photo and see the lengths on yourself, side by side, in the same light. Compare them properly and pick the one that actually works, before you commit to growing anything back.',
	},
	{
		id: 'benefit3-6-friends-vote',
		text: 'Nobody decides a haircut alone. There is always a group chat involved. So give it something to work with. Generate your looks, send them to your friends, and let them argue it out before you book. One photo in, a dozen opinions settled, and a decision you can finally make.',
	},
];

async function generateOne({id, text}) {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error(
			'ELEVENLABS_API_KEY is not set. Run with: node --env-file=.env scripts/generate-benefit-voiceovers-3.mjs',
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
