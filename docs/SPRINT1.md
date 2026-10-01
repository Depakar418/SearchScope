# Sprint 1: foundation reliability

This document records the v1.4.0 implementation. The expanded project-based specification and current acceptance status are documented in [SPRINT1-v1.4.1.md](SPRINT1-v1.4.1.md); v1.4.0 alone did not complete that expanded specification.

Release: 1.4.0. Previous baseline: 1.3.12.

## Architecture review and plan

The baseline used regular expressions for primary HTML extraction, included boilerplate in content checks, selected evidence by broad element type, discovered URLs mainly through sitemaps, and replaced the saved page result on each audit.

Implementation order: DOM/content extraction; precise evidence; bounded recursive crawl and link checks; cross-page comparisons; revision storage; migration and regression validation.

## Modules and contracts

- `lib/dom-extraction.ts`: parse5 HTML parser, semantic content roots, excluded source regions, content headings, selectors and section labels. Source visibility uses attributes and inline styles. Cookie/sidebar identification is heuristic. External CSS and JavaScript are not evaluated. Selectors identify a snapshot, not a persistent ID on the remote website.
- `lib/audit.ts`: preserves 29 existing checklist definitions and their weighting. Content metrics use main text; document metadata remains document-wide. Visible images and navigation links remain eligible for relevant checks. Missing elements use explicit absence evidence, never invented HTML or selectors. Pasted text has document evidence without CSS locators.
- `app/source-evidence.tsx`: exact per-check evidence with incremental display; legacy reports keep their old fallback view.
- `lib/web-fetch.ts` and `lib/link-analysis.ts`: safe public URLs, DNS checks, robots permission checks, manual redirect traces, loop detection and bounded requests. Up to 20 unique destinations per page and a 15-second verification budget. Unchecked/blocked/timeouts are not broken links. Only observed 404/410 are confirmed broken; other HTTP failures retain their own states. HEAD falls back to GET for 405/501. No new score penalties.
- `lib/discovery.ts`: same-origin recursive link discovery, configurable depth 0–5, up to the selected scan count (maximum 100 fetches) within a 20-second recursive budget. Sitemap discovery retains its own 25-second/12-file/1,000-URL bounds. Depth is measured from the homepage; sitemap-only URLs can have unknown depth/referrer. Queue/crawl metadata is saved with the inventory. Auditing remains resumable through the existing page-at-a-time workflow, which requires the browser tab to stay open.
- `lib/cross-page.ts`: normalized exact title/description/H1 grouping; five-word shingle Jaccard similarity >=85% for at least 80 extracted words, first 2,000 words, up to 100 pages. Similarity candidates require review. These observations do not affect category scores.
- `lib/page-audit-route.ts`: authenticated, owner-scoped history reads and atomic revision/latest-result writes. Revisions include successful and failed attempts. Latest results retain the existing run/page unique index. History summaries are capped at the latest 50 revisions; full reports are retrieved one at a time.
- `lib/audit-diff.ts`: issue IDs now passing, newly flagged IDs and measured category score deltas. Unavailable checks or failed attempts do not count as resolved problems. Scores between extraction versions or different target phrases are not directly comparable without reviewing the report context.

## Database migration and rollout

1. Retain all existing migration files and metadata unchanged.
2. Apply generated `drizzle/0001_small_doctor_doom.sql` before deploying the updated application. Sites applies pending migrations during publication.
3. This additive migration creates `audit_revisions` and index `(run, url, audited)` with a foreign key to `audit_runs`. It does not change or delete existing rows.
4. Deploy the matching 1.4.0 application source.
5. On the next audit of an existing page, the application atomically preserves its old latest snapshot if no history exists, inserts the new revision, and updates the latest page record. No bulk backfill is required.
6. Open Audit history beside a page to inspect dates, scores, changes and saved reports. Historical failed attempts display their fetch error.
7. If application rollback is needed, redeploy 1.3.12 while retaining the additive table. Never drop revisions as part of rollback. The older application does not write revision history.

The source backup does not contain live database records. Earlier snapshots already overwritten before this migration cannot be reconstructed. Revision retention/pruning and an independent full database backup policy are not implemented by this sprint.

## Accuracy and operating limits

No fake ranking/traffic/indexing checks were added and weights were not inflated. Missing assets, redirects and comparisons are displayed as observations with their method and scope. A changed extraction scope may legitimately change existing checklist results. Network checks are point-in-time observations. Large sites can be only partially discovered/verified; the UI identifies unchecked results. Rendered-browser crawling, job scheduling, backlink/ranking providers and automatic remote-site edits remain outside this sprint.
