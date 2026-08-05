// Renders many videos from a JSON manifest in one process.
// Bundles the project ONCE, then reuses that bundle for every job — much
// faster than shelling out to `npx remotion render` per file, which
// re-bundles every time. This is the entry point for scaling up from "one
// video" to "hundreds."
//
// Usage:
//   npm run batch-render -- batch/example-manifest.json
//
// Manifest format (array of jobs):
// [
//   {
//     "compositionId": "BrandWatermark",
//     "outputFile": "out/batch/video-1.mov",
//     "props": { "wordmark": "facestyle.fun" },
//     "durationInFrames": 450,      // optional: override the frame count
//     "transparent": true,          // optional: render with alpha (ProRes 4444)
//     "still": true,                // optional: render a single frame (PNG) instead
//     "frame": 0,                   // optional: which frame, for still jobs
//     "concurrency": 2              // optional: cap parallel workers on weak machines
//   }
// ]

import {bundle} from '@remotion/bundler';
import {
	renderMedia,
	renderStill,
	selectComposition,
	ensureBrowser,
} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function main() {
	const manifestPath = process.argv[2];
	if (!manifestPath) {
		console.error(
			'Usage: npm run batch-render -- <path-to-manifest.json>',
		);
		process.exit(1);
	}

	const manifest = JSON.parse(
		await fs.readFile(path.resolve(projectRoot, manifestPath), 'utf-8'),
	);

	if (!Array.isArray(manifest) || manifest.length === 0) {
		console.error('Manifest must be a non-empty JSON array of jobs.');
		process.exit(1);
	}

	console.log(`Bundling project (once for ${manifest.length} jobs)...`);
	await ensureBrowser();
	const bundleLocation = await bundle({
		entryPoint: path.join(projectRoot, 'src', 'index.ts'),
	});

	let succeeded = 0;
	let failed = 0;

	for (const [i, job] of manifest.entries()) {
		const label = `[${i + 1}/${manifest.length}] ${job.compositionId} -> ${job.outputFile}`;
		try {
			console.log(`${label} — starting`);

			const composition = await selectComposition({
				serveUrl: bundleLocation,
				id: job.compositionId,
				inputProps: job.props ?? {},
			});

			const outputLocation = path.resolve(projectRoot, job.outputFile);
			await fs.mkdir(path.dirname(outputLocation), {recursive: true});

			if (job.still) {
				await renderStill({
					composition,
					serveUrl: bundleLocation,
					output: outputLocation,
					frame: job.frame ?? 0,
					inputProps: job.props ?? {},
				});

				console.log(`${label} — done`);
				succeeded += 1;
				continue;
			}

			await renderMedia({
				composition: {
					...composition,
					durationInFrames:
						job.durationInFrames ?? composition.durationInFrames,
				},
				serveUrl: bundleLocation,
				codec: job.transparent ? 'prores' : 'h264',
				proResProfile: job.transparent ? '4444' : undefined,
				pixelFormat: job.transparent ? 'yuva444p10le' : undefined,
				imageFormat: job.transparent ? 'png' : 'jpeg',
				crf: job.transparent ? undefined : 18,
				outputLocation,
				inputProps: job.props ?? {},
				concurrency: job.concurrency,
			});

			console.log(`${label} — done`);
			succeeded += 1;
		} catch (err) {
			console.error(`${label} — FAILED: ${err.message}`);
			failed += 1;
		}
	}

	console.log(`\nBatch complete: ${succeeded} succeeded, ${failed} failed.`);
	process.exit(failed > 0 ? 1 : 0);
}

main();
