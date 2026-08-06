# Schedules a batch of reels into Buffer via its GraphQL API, from a manifest.
#
# Usage:
#   python scripts/buffer_schedule.py batch/buffer-batch3.json                  # dry run
#   python scripts/buffer_schedule.py batch/buffer-batch3.json --preflight      # check media URLs only
#   python scripts/buffer_schedule.py batch/buffer-batch3.json --execute        # preflight, canary, then the rest
#   python scripts/buffer_schedule.py batch/buffer-batch3.json --verify         # read the queue back
#   python scripts/buffer_schedule.py batch/buffer-batch3.json --execute --no-canary --skip 3
#
# Reads BUFFER_ACCESS_TOKEN from .env (gitignored). The token is never printed.
#
# Three things this does that a naive sender does not, each earned the hard way
# on the batch 3 run:
#
#  1. PREFLIGHT. Buffer cannot accept file uploads — media must sit at a public
#     URL that stays reachable *until the post publishes*, which may be weeks
#     out. A dead URL fails silently at publish time, so every URL is checked
#     before anything is scheduled.
#  2. CANARY. One post per service goes first. Channel-specific rejections
#     (Instagram needs a type, YouTube a category, Pinterest a board) then cost
#     3 failed calls instead of the whole batch.
#  3. PAGINATION. Buffer's posts query defaults to 10 per page. --verify passes
#     first:100, so a full queue is never mistaken for a partial one.
#
# Why Python and not Node: Node's fetch fails consistently against
# api.buffer.com from this machine (UND_ERR_CONNECT_TIMEOUT) while Python's
# urllib reaches it reliably — the same binary-specific block that affects
# ssh.exe here. See scripts/vast-ssh.py.

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
API = "https://api.buffer.com"

# Schema verified by live introspection: the input type is CreatePostInput (not
# PostCreateInput), and needsApproval is required.
MUTATION = """
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message }
  }
}
"""

VERIFY_QUERY = """
query Scheduled($orgId: OrganizationId!) {
  posts(first: 100, input: {organizationId: $orgId, filter: {status: [scheduled]}}) {
    edges { node { id dueAt channel { service } } }
  }
}
"""


def ssl_ctx():
    ctx = ssl.create_default_context()
    # This machine intercepts TLS (see vastai-render-workflow notes); verification
    # is disabled for these API calls rather than failing on the injected cert.
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def read_token():
    with open(os.path.join(ROOT, ".env"), encoding="utf-8") as handle:
        for line in handle:
            if line.startswith("BUFFER_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("BUFFER_ACCESS_TOKEN is not set in .env")


def load_manifest(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as handle:
        return json.load(handle)


def read_caption(caption_dir, slug):
    """The .txt files are the single source of truth for copy."""
    with open(os.path.join(ROOT, caption_dir, f"{slug}.txt"), encoding="utf-8") as fh:
        raw = fh.read()

    def section(name):
        match = re.search(rf"{name}:\s*\n(.*?)(?:\n\n|$)", raw, re.S)
        return match.group(1).strip() if match else ""

    caption = {
        "title": section("Title"),
        "description": section("Description"),
        "tags": section("Tags"),
    }
    missing = [k for k, v in caption.items() if not v]
    if missing:
        raise SystemExit(f"{slug}.txt is missing section(s): {', '.join(missing)}")
    return caption


def build_posts(cfg, slug, date, caption):
    due_at = f"{date}{cfg['slotTimeUtc']}"
    base = cfg["mediaBase"].rstrip("/")
    video_url = f"{base}/{cfg['videoPath'].format(slug=slug)}"
    pin_url = f"{base}/{cfg['pinPath'].format(slug=slug)}"
    ai = cfg.get("isAiGenerated", True)

    return [
        {
            "label": f"{slug} -> Instagram Reel",
            "service": "instagram",
            "channelId": cfg["channels"]["instagram"],
            "dueAt": due_at,
            "mediaUrl": video_url,
            "text": f"{caption['description']}\n\n{caption['tags']}",
            "assets": [{"video": {"url": video_url}}],
            "metadata": {
                "instagram": {
                    "type": "reel",
                    "shouldShareToFeed": True,
                    "isAiGenerated": ai,
                }
            },
        },
        {
            "label": f"{slug} -> YouTube Short",
            "service": "youtube",
            "channelId": cfg["channels"]["youtube"],
            "dueAt": due_at,
            "mediaUrl": video_url,
            "text": caption["description"],
            "assets": [{"video": {"url": video_url}}],
            "metadata": {
                "youtube": {
                    "title": caption["title"],
                    "categoryId": cfg["youtubeCategoryId"],
                    "privacy": "public",
                    "madeForKids": False,
                    "notifySubscribers": True,
                    "isAiGenerated": ai,
                }
            },
        },
        {
            "label": f"{slug} -> Pinterest pin",
            "service": "pinterest",
            "channelId": cfg["channels"]["pinterest"],
            "dueAt": due_at,
            "mediaUrl": pin_url,
            "text": caption["description"],
            "assets": [{"image": {"url": pin_url}}],
            "metadata": {
                "pinterest": {
                    "title": caption["title"],
                    "url": cfg["pinterestLinkUrl"],
                    "boardServiceId": cfg["pinterestBoardServiceId"],
                }
            },
        },
    ]


def gql(token, query, variables, attempts=4):
    payload = json.dumps({"query": query, "variables": variables}).encode()
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
            with urllib.request.urlopen(request, timeout=90, context=ssl_ctx()) as resp:
                return json.load(resp)
        except Exception as err:  # noqa: BLE001 - retry any transport failure
            last = err
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"network failed after {attempts} attempts: {last}")


def preflight(posts):
    """Every media URL must be publicly fetchable and stay that way until publish."""
    urls = sorted({p["mediaUrl"] for p in posts})
    print(f"PREFLIGHT - checking {len(urls)} media URLs")
    bad = []
    for url in urls:
        name = url.rsplit("/", 1)[-1]
        try:
            req = urllib.request.Request(url, headers={"Range": "bytes=0-200"})
            with urllib.request.urlopen(req, timeout=45, context=ssl_ctx()) as resp:
                if resp.status not in (200, 206):
                    bad.append((name, f"HTTP {resp.status}"))
                else:
                    print(f"  ok   {name}")
        except Exception as err:  # noqa: BLE001
            bad.append((name, str(err)))
            print(f"  FAIL {name} - {err}")
    if bad:
        print(f"\n{len(bad)} media URL(s) unreachable. Nothing scheduled.")
        print("Media must stay reachable until the post publishes — fix the host first.")
        return False
    print("  all reachable\n")
    return True


def create_post(token, post):
    body = gql(
        token,
        MUTATION,
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


def send(token, posts, start_index=0):
    ok = failed = 0
    for offset, post in enumerate(posts):
        index = start_index + offset
        try:
            created = create_post(token, post)
            print(f"[{index}] OK   {post['label']} - id {created.get('id')}", flush=True)
            ok += 1
        except Exception as err:  # noqa: BLE001 - report and continue
            print(f"[{index}] FAIL {post['label']} - {err}", flush=True)
            failed += 1
    return ok, failed


def verify(token, cfg):
    body = gql(token, VERIFY_QUERY, {"orgId": cfg["organizationId"]})
    if body.get("errors"):
        raise SystemExit(json.dumps(body["errors"])[:300])
    edges = body["data"]["posts"]["edges"]
    by_service = {}
    by_day = {}
    for edge in edges:
        node = edge["node"]
        service = node["channel"]["service"]
        day = (node["dueAt"] or "")[:10]
        by_service[service] = by_service.get(service, 0) + 1
        by_day.setdefault(day, set()).add(service)
    print(f"TOTAL SCHEDULED: {len(edges)}   (first:100, so this is the real total)")
    print(f"by channel: {by_service}")
    for day in sorted(by_day):
        print(f"   {day}  {sorted(by_day[day])}")

    expected = {f"{s['date']}" for s in cfg["slots"]}
    missing = sorted(d for d in expected if d not in by_day)
    if missing:
        print(f"\nWARNING: no scheduled posts on {', '.join(missing)}")
    else:
        print("\nEvery slot date in the manifest has posts scheduled.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--preflight", action="store_true", help="check media URLs and exit")
    parser.add_argument("--verify", action="store_true", help="read the queue back and exit")
    parser.add_argument("--no-canary", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--skip", type=int, default=0)
    args = parser.parse_args()

    cfg = load_manifest(args.manifest)
    token = read_token()

    if args.verify:
        verify(token, cfg)
        return

    built = []
    for slot in cfg["slots"]:
        caption = read_caption(cfg["captionDir"], slot["slug"])
        built.extend(build_posts(cfg, slot["slug"], slot["date"], caption))

    if args.preflight:
        sys.exit(0 if preflight(built) else 1)

    selected = built[args.skip :]
    if args.limit is not None:
        selected = selected[: args.limit]

    if not args.execute:
        print(f"DRY RUN - {len(selected)} of {len(built)} posts\n")
        for index, post in enumerate(selected, start=args.skip):
            print(f"[{index}] {post['label']}")
            print(f"      when : {post['dueAt']}")
            print(f"      media: {post['mediaUrl'].rsplit('/', 1)[-1]}")
            print(f"      text : {' '.join(post['text'].split())[:100]}...")
        print("\nNothing sent. Re-run with --execute to schedule.")
        return

    if not preflight(selected):
        sys.exit(1)

    # Canary: one post per service first, so a channel-specific rejection costs
    # 3 calls rather than the whole batch.
    rest = selected
    canary_ok = canary_failed = 0
    if not args.no_canary and args.skip == 0:
        seen = set()
        canary = []
        for post in selected:
            if post["service"] not in seen:
                seen.add(post["service"])
                canary.append(post)
        rest = [p for p in selected if p not in canary]

        print(f"CANARY - {len(canary)} posts, one per service\n")
        canary_ok, canary_failed = send(token, canary)
        if canary_failed:
            print(
                f"\nCanary failed ({canary_failed} of {len(canary)}). "
                f"Stopping before the remaining {len(rest)} posts.\n"
                "Fix the per-channel field, then re-run — already-scheduled "
                "posts are listed above so you can --skip past them."
            )
            sys.exit(1)
        print("\nCanary clean. Sending the rest.\n")

    ok, failed = send(token, rest, start_index=args.skip + (len(selected) - len(rest)))
    total_ok = canary_ok + ok
    total_failed = canary_failed + failed
    print(f"\nDone: {total_ok} scheduled, {total_failed} failed.")
    if not total_failed:
        print("\nVerifying...\n")
        verify(token, cfg)
    sys.exit(1 if total_failed else 0)


if __name__ == "__main__":
    main()
