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

	// Each network takes its own metadata block. Notably YouTube and Pinterest
	// have real title fields, so the title is not jammed into the body text.
	// isAiGenerated is set truthfully — the model photos in these reels are
	// AI-generated, and the platforms expect that to be disclosed.
	return [
		{
			label: `${slug} → Instagram Reel`,
			channelId: CHANNELS.instagram,
			dueAt,
			text: `${caption.description}\n\n${caption.tags}`,
			asset: {video: {url: videoUrl}},
			metadata: {
				instagram: {
					type: 'reel',
					shouldShareToFeed: true,
					isAiGenerated: true,
				},
			},
		},
		{
			label: `${slug} → YouTube Short`,
			channelId: CHANNELS.youtube,
			dueAt,
			text: caption.description,
			asset: {video: {url: videoUrl}},
			metadata: {
				youtube: {
					title: caption.title,
					privacy: 'public',
					madeForKids: false,
					notifySubscribers: true,
					isAiGenerated: true,
				},
			},
		},
		{
			label: `${slug} → Pinterest pin`,
			channelId: CHANNELS.pinterest,
			dueAt,
			text: caption.description,
			asset: {image: {url: pinUrl}},
			metadata: {
				pinterest: {
					title: caption.title,
					url: 'https://facestyle.fun',
				},
			},
		},
	];
}

// Schema-verified against the live API by introspection — the input type is
// CreatePostInput (not PostCreateInput), and needsApproval is required.
const MUTATION = `
	mutation CreatePost($input: CreatePostInput!) {
		createPost(input: $input) {
			... on PostActionSuccess { post { id dueAt } }
			... on MutationError { message }
		}
	}`;

// api.buffer.com intermittently refuses connections from this machine, so every
// call gets a few attempts with backoff rather than failing the whole run.
async function postWithRetry(token, variables, attempts = 4) {
	let lastError;
	for (let i = 0; i < attempts; i += 1) {
		try {
			const response = await fetch(API, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({query: MUTATION, variables}),
				signal: AbortSignal.timeout(45000),
			});
			return await response.json();
		} catch (err) {
			lastError = err;
			await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
		}
	}
	throw new Error(`network failed after ${attempts} attempts: ${lastError?.message}`);
}

async function createPost(token, post) {
	const body = await postWithRetry(token, {
		input: {
			text: post.text,
			channelId: post.channelId,
			schedulingType: 'automatic',
			mode: 'customScheduled',
			needsApproval: false,
			dueAt: post.dueAt,
			assets: [post.asset],
			metadata: post.metadata,
		},
	});

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
	// --limit N sends only the first N posts, so the schema can be validated on
	// one real post before committing the whole batch to the queue.
	const limitArg = process.argv.find((a) => a.startsWith('--limit='));
	const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
	// --skip N resumes after a partial run without duplicating what already landed.
	const skipArg = process.argv.find((a) => a.startsWith('--skip='));
	const skip = skipArg ? Number(skipArg.split('=')[1]) : 0;
	const token = process.env.BUFFER_ACCESS_TOKEN;
	if (!token) {
		throw new Error(
			'BUFFER_ACCESS_TOKEN is not set. Run with: node --env-file=.env scripts/buffer-schedule-batch3.mjs',
		);
	}

	const built = [];
	for (const {slug, date} of SLOTS) {
		const caption = await readCaption(slug);
		built.push(...buildPosts(slug, date, caption));
	}
	const all = built.slice(skip, skip === 0 ? limit : skip + limit);

	console.log(
		`${execute ? 'EXECUTING' : 'DRY RUN'} — ${all.length} of ${built.length} posts` +
			`${skip ? ` (skipping first ${skip})` : ''}\n`,
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
