# SearchScope foundation follow-up — v1.4.2

## Scope and architecture assessment

The two supplied specifications describe successive phases. The Sprint 1 completion specification explicitly prohibits Sprint 2 intelligence at this stage. This release addresses foundation gaps in the existing application; it does not implement or claim completion of Sprint 2.

Existing architecture: React/Vinext frontend, Worker request handlers, D1 SQLite persistence, parse5 DOM extraction, bounded sitemap/recursive discovery, safe HTTP fetching and destination verification. Projects own runs; runs own latest page results and append-only revisions. Report components consume stored reports. Browser state drives the audit queue. All 21 SEO, 5 AEO and 3 GEO checks and their equal weighting are preserved.

The inspection found that DOM parsing, main-content exclusions, element evidence, recursive discovery, metadata checks, destination validation, cross-page duplicate/similarity observations and page revisions already existed. Remaining gaps included structured blocks, a stable consumer contract, immutable whole-run results, provenance in page reports, and detailed comparison observations.

## Changes and service boundaries

| Module | Change and purpose |
| --- | --- |
| `lib/dom-extraction.ts` | Extracts source-ordered sections/articles, paragraphs, lists, table rows/cells, literal question headings and preceding/parent/following heading relationships from the existing DOM. Breadcrumb containers are excluded from main content. |
| `lib/normalized-page.ts` | Typed, versioned projection over the stored document and report. Exposes identities, metadata, content, links, images, structured data and crawl context. Incoming links are supplied by the existing audit graph; absent data stays null. No duplicate parser or document storage. |
| `lib/audit.ts`, `lib/audit-service.ts` | Persists source audit/page context and X-Robots-Tag. Empty/JavaScript href observations no longer use the misleading broken-link title. |
| `lib/discovery.ts` | Adds conservative Service, FAQ, About, Contact and Legal classifications using declared schema or explicit URL paths; existing estimate labels remain. |
| `lib/link-analysis.ts` | Prioritizes canonical and internal destinations within the existing bounded validation budget. |
| `lib/audit-snapshot.ts` | Seals a completed audit with a small revision manifest, avoiding another copy of large reports/evidence. Stores inventory, selection and configuration for historical coverage. |
| `lib/page-audit-route.ts` | Seals completion atomically with saved results. Re-audits update the latest workspace and add a revision; they do not replace the frozen manifest. |
| Run and project-comparison APIs | `GET /api/runs/:id?project=:project&snapshot=1` returns stored frozen results. Comparison uses frozen completed snapshots, with existing owner/project authorization. |
| `lib/project-analysis.ts` | Adds stored metadata, content-change, link-state and redirect observations, before/after check counts, discovery counts and cross-page groups. Scope differences remain explicit. |
| `app/crawl-coverage.tsx` | Expandable source/depth distribution and per-URL crawl/audit records in Overview. Unknown depth is not presented as zero. |
| `app/page-detail.tsx` | Fetch/discovery metadata and paginated extracted-block inspection. Existing findings and fix accordions remain. |
| `app/project-workspace.tsx` | Grouped project navigation, frozen snapshot viewer/export, and richer comparison details. Latest workspace and frozen history have distinct labels. |
| `lib/report-export.ts` | CSV/Markdown include fetch, crawl, link-validation and header records; JSON retains the complete stored report. |

Existing APIs remain compatible. No new search checks, external SEO providers, inferred search demand, intelligence scores or AI features were added. Separate Content Analyzer behavior is preserved.

## Database and migration

New schema-only migration: `drizzle/0004_romantic_ultimatum.sql`.

Adds `audit_snapshots`, keyed by run, with sealed date, provenance, inventory, selection, configuration and revision manifest. Existing migrations and data are retained. The manifest joins immutable `audit_revisions`; it does not duplicate their report blobs. Existing revision/run indexes support lookups.

Steps:

1. Retain the existing source backup. That ZIP is not a live database backup.
2. Apply migration 0004 through Sites deployment before the new Worker is uploaded.
3. New completed runs are sealed automatically in the result transaction.
4. Existing completed runs are captured lazily when opening/comparing a snapshot or before re-audit. This baseline is explicitly labeled legacy: overwritten history from before this release cannot be reconstructed.
5. Verify creation, single-page re-audit, frozen history and cross-project denial. Existing runs do not need re-auditing to remain readable; new structured extraction requires a new audit.

Do not roll back by deleting historical snapshots or rewriting applied migrations. Future fixes should be additive.

## Integrity, security and performance

Frozen history renders stored data without fetching the source website. It preserves report text, evidence, metadata, destination observations and scores. Remote image previews may still reflect the current asset; source image bytes are not archived.

Whole-audit score/count comparisons describe the selected coverage. Per-page fixed/new finding counts require successful reports with matching extraction versions and phrases. Content comparison is withheld across differing versions. Missing/failed/unchecked destinations are not claimed as verified fixes.

Existing private-network/DNS/redirect safeguards and ownership checks remain. React escapes extracted markup. No new raw HTML execution is introduced. CSV formula protection remains. Full element evidence remains in exports; snippet limits are disclosed. Large block lists initially show 20 items. Existing crawl/link budgets and recent-result reuse remain in force.

## Validation and limitations

Automated checks cover TypeScript, existing 29-check fixtures, structural extraction with nested lists/tables and excluded chrome, valid selectors and full affected-element evidence, HTTP/redirect/robots behavior, SQLite migration preservation, project isolation, immutable snapshots after re-audit, normalized contract identities, cross-page comparisons and report rendering/export behavior. Controlled fixtures are not claimed to be live-site audits.

Commands: `pnpm exec tsc --noEmit --incremental false`; `node scripts/audit-checks.mjs`; `node scripts/foundation-checks.mjs`; `node scripts/project-checks.mjs`; `node scripts/project-view-check.mjs`; `node scripts/report-render-check.mjs`; `node scripts/unified-report-check.mjs`; `node scripts/report-tabs-check.mjs`; production Worker build.

**Sprint 1's complete Definition of Done is not yet signed off.** Remaining acceptance gaps:

- Live interactive, keyboard, sticky-layout and mobile browser QA remains unverified in this environment. Server-rendered markup tests do not replace it.
- Representative live audits across all 14 requested website structures have not been completed; existing tests use controlled fixtures.
- Discovery remains bounded; sitemap-only depth can be unknown. The excluded metric counts discovery candidates, not a unique excluded-URL inventory with a reason for every rejected candidate.
- Persisted discovery outcomes and page attempts exist, but every transient queue/fetch transition is not persisted as a separate crawl event. The browser must remain open to process the queue.
- Discovery and analysis may fetch the same page separately; there is no persistent response-body cache or server job queue.
- Latest-page and revision reports still use bounded JSON storage. Snapshot manifests avoid further blob duplication, but this is not an unlimited-crawl data warehouse.
- Rendered JavaScript, external CSS visibility, full raw response archives, and image-byte archives are not provided.

## Sprint 2 readiness and plan (not implemented)

Use `NormalizedPageDocument` as the source contract, keyed by project/audit/page revision and document version. The future UI-independent intelligence engine must consume this stored projection and the existing link graph, never recrawl in UI renders. Persist immutable analysis records keyed by source revision and analysis version; cache until the source/version changes or explicit reanalysis is requested. Opportunities require their own persisted workflow and evidence references, separate from audit error counts.

Before Sprint 2 implementation, close the acceptance gaps above and review source-volume limits. Then design analysis/opportunity tables and owner-scoped APIs, build deterministic evidence-backed page-type-aware analysis, and expose working Content Intelligence, Topics and Content Gaps views. No such unfinished navigation is exposed now. A separate Sprint 2 architecture/migration/testing review is still required before that phase is coded.
