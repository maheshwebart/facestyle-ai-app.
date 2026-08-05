// Schedules the batch 3 feature-benefit reels into Buffer via its GraphQL API.
//
// Usage:
//   node --env-file=.env scripts/buffer-schedule-batch3.mjs            # dry run (default)
//   node --env-file=.env scripts/buffer-schedule-batch3.mjs --execute  # actually create posts
//
// Requires BUFFER_ACCESS_TOKEN in .env (gitignored, never commit or print it).
//
// Buffer's API cannot accept file uploads — media must live at a public URL that
// stays reachable until the post publishes. These point at the raw.githubusercontent
// copies committed on the feature-benefit-reels branch.

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const captionDir = path.join(projectRoot, 'out', 'promotional-3');

const API = 'https://api.buffer.com';
const MEDIA_BASE =
	'https://raw.githubusercontent.com/maheshwebart/facestyle-ai-app./feature-benefit-reels/Claude/out/promotional-3';

const CHANNELS = {
	youtube: '6a6c32c04b2d03035f730825',
	instagram: '6a6c33f04b2d03035f730baf',
	pinterest: '6a6c35814b2d03035f731081',
};

// 10:00 IST == 04:30 UTC. Buffer's dueAt is ISO 8601 in UTC.
const SLOT_TIME_UTC = 'T04:30:00.000Z';

const SLOTS = [
	{slug: 'hair-colour', date: '2026-08-11'},
	{slug: 'bangs', date: '2026-08-14'},
	{slug: 'big-chop', date: '2026-08-18'},
	{slug: 'hair-length', date: '2026-08-21'},
	{slug: 'wedding-look', date: '2026-08-25'},
	{slug: 'friends-vote', date: '2026-08-28'},
];

// The .txt files are the single source of truth for copy — parse rather than
// duplicate them here, so edits to the captions flow through automatically.
async function readCaption(slug) {
	const raw = await fs.readFile(path.join(captionDir, `${slug}.txt`), 'utf-8');
	const section = (name) => {
		const m = raw.match(new RegExp(`${name}:\\s*\\n([\\s\\S]*?)(?:\\n\\n|$)`));
		return m ? m[1].trim() : '';
	};
	return {
		title: section('Title'),
		description: section('Description'),
		tags: section('Tags'),
	};
}

function buildPosts(slug, date, caption) {
	const dueAt = `${date}${SLOT_TIME_UTC}`;
	const videoUrl = `${MEDIA_BASE}/${slug}.mp4`;
	const pinUrl = `${MEDIA_BASE}/pins/${slug}-pin.png`;

	return [
		{
			label: `${slug} → Instagram Reel`,
			channelId: CHANNELS.instagram,
			dueAt,
			text: `${caption.description}\n\n${caption.tags}`,
			asset: {video: {url: videoUrl}},
		},
		{
			label: `${slug} → YouTube Short`,
			channelId: CHANNELS.youtube,
			dueAt,
			text: `${caption.title}\n\n${caption.description}`,
			asset: {video: {url: videoUrl}},
		},
		{
			label: `${slug} → Pinterest pin`,
			channelId: CHANNELS.pinterest,
			dueAt,
			text: `${caption.title}\n\n${caption.description}`,
			asset: {image: {url: pinUrl}},
		},
	];
}

async function createPost(token, post) {
	const mutation = `
		mutation CreatePost($input: PostCreateInput!) {
			createPost(input: $input) {
				... on PostActionSuccess { post { id dueAt } }
				... on MutationError { message }
			}
		}`;

	const response = await fetch(API, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: mutation,
			variables: {
				input: {
					text: post.text,
					channelId: post.channelId,
					schedulingType: 'automatic',
					mode: 'customScheduled',
					dueAt: post.dueAt,
					assets: [post.asset],
				},
			},
		}),
	});

	const body = await response.json();
	if (body.errors) {
		throw new Error(JSON.stringify(body.errors));
	}
	const result = body.data?.createPost;
	if (result?.message) {
		throw new Error(result.message);
	}
	return result?.post;
}

async function main() {
	const execute = process.argv.includes('--execute');
	const token = process.env.BUFFER_ACCESS_TOKEN;
	if (!token) {
		throw new Error(
			'BUFFER_ACCESS_TOKEN is not set. Run with: node --env-file=.env scripts/buffer-schedule-batch3.mjs',
		);
	}

	const all = [];
	for (const {slug, date} of SLOTS) {
		const caption = await readCaption(slug);
		all.push(...buildPosts(slug, date, caption));
	}

	console.log(
		`${execute ? 'EXECUTING' : 'DRY RUN'} — ${all.length} posts across ${SLOTS.length} slots\n`,
	);

	let ok = 0;
	let failed = 0;

	for (const post of all) {
		if (!execute) {
			const media = post.asset.video?.url ?? post.asset.image.url;
			console.log(`${post.label}`);
			console.log(`  when : ${post.dueAt}  (10:00 IST)`);
			console.log(`  media: ${media.split('/').slice(-2).join('/')}`);
			console.log(`  text : ${post.text.replace(/\n+/g, ' ').slice(0, 110)}...`);
			console.log('');
			continue;
		}

		try {
			const created = await createPost(token, post);
			console.log(`OK   ${post.label} — id ${created?.id ?? '(no id)'}`);
			ok += 1;
		} catch (err) {
			console.error(`FAIL ${post.label} — ${err.message}`);
			failed += 1;
		}
	}

	if (execute) {
		console.log(`\nDone: ${ok} scheduled, ${failed} failed.`);
		process.exit(failed > 0 ? 1 : 0);
	} else {
		console.log('Nothing was sent to Buffer. Re-run with --execute to schedule.');
	}
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
