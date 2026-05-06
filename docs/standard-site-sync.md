# Standard.site Sync Script

This repo now includes a markdown -> `site.standard.document` sync command with idempotent behavior:

- create record if missing
- update record if markdown changed
- skip if unchanged

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `ATPROTO_IDENTIFIER`
   - `ATPROTO_APP_PASSWORD` (app password)
   - `STANDARD_SITE_PUBLICATION` (publication AT-URI or URL)

## Commands

- Dry run (no writes):

```bash
npm run standard-site:dry-run
```

- Real sync:

```bash
npm run standard-site:sync
```

## State File

The sync state is saved in:

- `.data/standard-site-map.json`

It stores source hash + AT URI mapping to keep reruns safe and fast.
