# Standard.site Sync Script

This repo includes bidirectional sync for `site.standard.document` records:

- pull remote records -> local markdown
- push local markdown -> remote records
- skip unchanged docs on both sides
- detect two-way conflicts and require explicit force flags

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `ATPROTO_IDENTIFIER`
   - `ATPROTO_APP_PASSWORD` (app password)
   - `STANDARD_SITE_PUBLICATION` (publication AT-URI or URL)

## Commands

- Bidirectional dry run (default mode, no writes):

```bash
npm run standard-site:dry-run
```

- Bidirectional sync:

```bash
npm run standard-site:sync
```

- Push only (local -> atproto):

```bash
npm run standard-site:push
```

- Pull only (atproto -> local):

```bash
npm run standard-site:pull
```

## Conflict Handling

When a document changed both locally and remotely since the last sync, the script reports a conflict and skips that doc.

- For pull conflicts, rerun with `--force-pull`
- For push conflicts, rerun with `--force-push`

Examples:

```bash
node scripts/sync-standard-site-docs.mjs --force-pull
node scripts/sync-standard-site-docs.mjs --push-only --force-push
```

## Preserving Manual Notes (Hashiyya)

To keep local-only notes across pull syncs, wrap them in manual markers:

```md
<!-- sync:manual:start -->
::Hashiyya{title="Hashiyya" side="right"}
This note is local and will be preserved on pull.
::
<!-- sync:manual:end -->
```

Any content inside these markers is preserved during remote pull updates.

## State File

The sync state is saved in:

- `.data/standard-site-map.json`

It tracks source hash + remote record hash + AT URI mappings for idempotent two-way sync.
