# Schedules the batch 3 feature-benefit reels into Buffer via its GraphQL API.
#
# Usage:
#   python scripts/buffer_schedule_batch3.py                 # dry run (default)
#   python scripts/buffer_schedule_batch3.py --execute       # create all posts
#   python scripts/buffer_schedule_batch3.py --execute --limit 1
#   python scripts/buffer_schedule_batch3.py --execute --skip 3
#
# Reads BUFFER_ACCESS_TOKEN from .env (gitignored). The token is never printed.
#
# Why Python and not the .mjs sibling: Node's fetch fails consistently against
# api.buffer.com from this machine (UND_ERR_CONNECT_TIMEOUT) while Python's
# urllib reaches it reliably every time — the same binary-specific block that
# affects ssh.exe here. See scripts/vast-ssh.py for the same workaround.
#
# Buffer's API cannot accept file uploads: media must sit at a public URL that
# stays reachable until the post publishes. These point at the raw.github
# copies committed on the feature-benefit-reels branch.

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTION_DIR = os.path.join(ROOT, "out", "promotional-3")
API = "https://api.buffer.com"
MEDIA_BASE = (
    "https://raw.githubusercontent.com/maheshwebart/facestyle-ai-app."
    "/feature-benefit-reels/Claude/out/promotional-3"
)

CHANNELS = {
    "youtube": "6a6c32c04b2d03035f730825",
    "instagram": "6a6c33f04b2d03035f730baf",
    "pinterest": "6a6c35814b2d03035f731081",
}

# YouTube requires a category. 26 is "Howto & Style" — the right home for
# hair and beauty try-on content.
YOUTUBE_CATEGORY_ID = "26"

# Pinterest requires a destination board. The account has "AI Beauty" and
# "Profile"; these pins belong on AI Beauty. Note this is Pinterest's own
# serviceId, NOT Buffer's internal board id — passing the latter fails with
# "Board not found".
PINTEREST_BOARD_ID = "1124914881865533996"

# 10:00 IST == 04:30 UTC. Buffer's dueAt is ISO 8601 in UTC.
SLOT_TIME_UTC = "T04:30:00.000Z"

SLOTS = [
    ("hair-colour", "2026-08-11"),
    ("bangs", "2026-08-14"),
    ("big-chop", "2026-08-18"),
    ("hair-length", "2026-08-21"),
    ("wedding-look", "2026-08-25"),
    ("friends-vote", "2026-08-28"),
]

# Schema verified by live introspection: input is CreatePostInput, needsApproval
# is required, and each network carries its own metadata block.
MUTATION = """
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message }
  }
}
"""


def read_token():
    env_path = os.path.join(ROOT, ".env")
    with open(env_path, encoding="utf-8") as handle:
        for line in handle:
            if line.startswith("BUFFER_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("BUFFER_ACCESS_TOKEN is not set in .env")


def read_caption(slug):
    """The .txt files are the single source of truth for copy."""
    with open(os.path.join(CAPTION_DIR, f"{slug}.txt"), encoding="utf-8") as handle:
        raw = handle.read()

    def section(name):
        match = re.search(rf"{name}:\s*\n(.*?)(?:\n\n|$)", raw, re.S)
        return match.group(1).strip() if match else ""

    return {
        "title": section("Title"),
        "description": section("Description"),
        "tags": section("Tags"),
    }


def build_posts(slug, date, caption):
    due_at = f"{date}{SLOT_TIME_UTC}"
    video_url = f"{MEDIA_BASE}/{slug}.mp4"
    pin_url = f"{MEDIA_BASE}/pins/{slug}-pin.png"

    # isAiGenerated is set truthfully — the model photos in these reels are
    # AI-generated, and the platforms expect that disclosure.
    return [
        {
            "label": f"{slug} -> Instagram Reel",
            "service": "instagram",
            "channelId": CHANNELS["instagram"],
            "dueAt": due_at,
            "text": f"{caption['description']}\n\n{caption['tags']}",
            "assets": [{"video": {"url": video_url}}],
            "metadata": {
                "instagram": {
                    "type": "reel",
                    "shouldShareToFeed": True,
                    "isAiGenerated": True,
                }
            },
        },
        {
            "label": f"{slug} -> YouTube Short",
            "service": "youtube",
            "channelId": CHANNELS["youtube"],
            "dueAt": due_at,
            "text": caption["description"],
            "assets": [{"video": {"url": video_url}}],
            "metadata": {
                "youtube": {
                    "title": caption["title"],
                    "categoryId": YOUTUBE_CATEGORY_ID,
                    "privacy": "public",
                    "madeForKids": False,
                    "notifySubscribers": True,
                    "isAiGenerated": True,
                }
            },
        },
        {
            "label": f"{slug} -> Pinterest pin",
            "service": "pinterest",
            "channelId": CHANNELS["pinterest"],
            "dueAt": due_at,
            "text": caption["description"],
            "assets": [{"image": {"url": pin_url}}],
            "metadata": {
                "pinterest": {
                    "title": caption["title"],
                    "url": "https://facestyle.fun",
                    "boardServiceId": PINTEREST_BOARD_ID,
                }
            },
        },
    ]


def gql(token, variables, attempts=4):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    payload = json.dumps({"query": MUTATION, "variables": variables}).encode()
    last = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                API,
                data=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(request, timeout=60, context=ctx) as response:
                return json.load(response)
        except Exception as err:  # noqa: BLE001 - retry any transport failure
            last = err
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"network failed after {attempts} attempts: {last}")


def create_post(token, post):
    body = gql(
        token,
        {
            "input": {
                "text": post["text"],
                "channelId": post["channelId"],
                "schedulingType": "automatic",
                "mode": "customScheduled",
                "needsApproval": False,
                "dueAt": post["dueAt"],
                "assets": post["assets"],
                "metadata": post["metadata"],
            }
        },
    )
    if body.get("errors"):
        raise RuntimeError(json.dumps(body["errors"])[:300])
    result = body.get("data", {}).get("createPost") or {}
    if result.get("message"):
        raise RuntimeError(result["message"])
    return result.get("post") or {}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--skip", type=int, default=0)
    # --services lets a partial run be resumed per network, so retrying a
    # failed channel never duplicates one that already succeeded.
    parser.add_argument("--services", default=None,
                        help="comma-separated: instagram,youtube,pinterest")
    args = parser.parse_args()

    token = read_token()

    built = []
    for slug, date in SLOTS:
        built.extend(build_posts(slug, date, read_caption(slug)))

    if args.services:
        wanted = {s.strip() for s in args.services.split(",")}
        built = [p for p in built if p["service"] in wanted]

    selected = built[args.skip :]
    if args.limit is not None:
        selected = selected[: args.limit]

    mode = "EXECUTING" if args.execute else "DRY RUN"
    print(f"{mode} - {len(selected)} of {len(built)} posts", flush=True)

    ok = failed = 0
    for index, post in enumerate(selected, start=args.skip):
        if not args.execute:
            media = post["assets"][0]
            url = (media.get("video") or media.get("image"))["url"]
            print(f"[{index}] {post['label']}  {post['dueAt']}  {url.rsplit('/', 1)[-1]}")
            continue
        try:
            created = create_post(token, post)
            print(f"[{index}] OK   {post['label']} - id {created.get('id')}", flush=True)
            ok += 1
        except Exception as err:  # noqa: BLE001 - report and continue
            print(f"[{index}] FAIL {post['label']} - {err}", flush=True)
            failed += 1

    if args.execute:
        print(f"\nDone: {ok} scheduled, {failed} failed.")
        sys.exit(1 if failed else 0)
    print("\nNothing sent. Re-run with --execute to schedule.")


if __name__ == "__main__":
    main()
