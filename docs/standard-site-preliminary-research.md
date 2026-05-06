# Standard.site + Nuxt Migration (Preliminary Research)

## Goal

Migrate this Nuxt blog to AT Protocol `site.standard.*` records while preserving your current tag UX and enabling tag-based sections.

## What Standard.site Requires

Based on Standard.site docs:

- `site.standard.publication`:
  - required: `url`, `name`
  - optional: `description`, `icon`, `basicTheme`, `preferences.showInDiscover`
- `site.standard.document`:
  - required: `site`, `title`, `publishedAt`
  - optional: `path`, `description`, `coverImage`, `content`, `textContent`, `tags`, `updatedAt`, `bskyPostRef`
- verification:
  - publication verification endpoint:
    - `/.well-known/site.standard.publication` -> returns publication AT-URI
  - document verification in each page HTML:
    - `<link rel="site.standard.document" href="at://...">`

## Current Nuxt Data Model (Already Close)

Your current content has the key fields needed for `site.standard.document`:

- `title`
- `description`
- `tags`
- `pubDatetime` (maps to `publishedAt`)
- `modDatetime` (maps to `updatedAt`)
- route path (`/posts/...` or `/talks/...`) (maps to `path`)

## Recommended Mapping

### Publication (single record for your site)

```json
{
  "$type": "site.standard.publication",
  "url": "https://blog.mainasara.dev",
  "name": "Mainasara's Blog",
  "description": "A place where Mainasara says things.",
  "preferences": {
    "showInDiscover": true
  }
}
```

### Document (one per post/talk)

```json
{
  "$type": "site.standard.document",
  "site": "at://<your-did>/site.standard.publication/<rkey>",
  "path": "/posts/my-post-slug",
  "title": "Post title",
  "description": "Post summary",
  "publishedAt": "2026-05-06T00:00:00.000Z",
  "updatedAt": "2026-05-06T00:00:00.000Z",
  "tags": ["security", "javascript"],
  "textContent": "Plain text body for search/indexing"
}
```

## Tags As Sections (Your Requirement)

You can keep tags as a flat `tags: string[]` in each document, then derive sections at render time.

Two practical section strategies:

1. Homepage sections by top tags:
   - Compute tag frequencies from all documents.
   - Pick top N tags (e.g. top 4).
   - Render each as a section containing latest M documents for that tag.

2. Explicit featured sections config:
   - Add a local config list in Nuxt:
   - `['security', 'atproto', 'javascript', 'talks']`
   - Render sections in that order regardless of frequency.

## Suggested Repo Structure For "Pulling Docs In"

Add a local docs area and keep external references versioned in-repo:

- `docs/standard-site-preliminary-research.md` (this file)
- `docs/standard-site/quick-start.md` (copied snapshot)
- `docs/standard-site/lexicons/document.md` (copied snapshot)
- `docs/standard-site/lexicons/publication.md` (copied snapshot)
- `docs/standard-site/verification.md` (copied snapshot)

This gives you stable implementation notes even if upstream docs change.

## Implementation Notes For This Nuxt Codebase

1. Add a normalization layer:
   - create `app/composables/useStandardSiteDocument.ts` (or server util)
   - map Nuxt Content records -> `site.standard.document` payload shape

2. Add publish metadata storage:
   - keep a local JSON pointer for AT URIs while prototyping:
   - `.data/standard-site-map.json`
   - shape: `{ "<local-path>": "at://did.../site.standard.document/..." }`

3. Inject document verification tag:
   - in post/talk pages, append:
   - `<link rel="site.standard.document" href="<mapped-at-uri>" />`

4. Add publication verification route:
   - Nuxt server endpoint for:
   - `/.well-known/site.standard.publication`
   - response body: publication AT-URI string

5. Build tag section queries:
   - reuse your existing tag extraction logic in:
   - `app/pages/tags/index.vue`
   - `app/pages/tags/[tag].vue`
   - then add a grouped section renderer on homepage or `/posts`.

## Risks To Plan For

- URL/path consistency:
  - `path` in records must stay stable once published.
- verification drift:
  - if DID/publication record changes, update `.well-known` output.
- trailing slash mismatches:
  - normalize `url`/`site` and avoid trailing slashes.
- dual source of truth:
  - decide whether markdown frontmatter or AT records is authoritative.

## Practical Next Step

Implement a read-only phase first:

1. Generate `site.standard.document` JSON for all existing content locally.
2. Add tag-based sections from generated docs.
3. After rendering is stable, add publish + verification endpoints.

## Comparison To WhiteWind (For Block Content)

WhiteWind (`com.whtwnd.blog.entry`) is markdown-first and stores primary post body as a markdown `content` string, with fields like `title`, `createdAt`, optional `image`, and labels.

Recommended hybrid approach for this repo:

1. Keep Standard.site as canonical publication/document wrapper:
   - `site.standard.publication`
   - `site.standard.document`
2. For shared render portability (code/image/header/text):
   - use `site.standard.document.content` with a stable custom block namespace and `$type` per block
3. For broad compatibility with markdown-first clients (WhiteWind-style):
   - keep `textContent` populated
   - optionally also emit a markdown companion payload in your block schema
4. Keep blog-exclusive components out of the shared block set:
   - render those only in your Nuxt frontend

This gives you:
- interoperability with Standard.site indexing/discovery
- practical compatibility with markdown-oriented clients
- freedom to keep rich custom components on your site only
