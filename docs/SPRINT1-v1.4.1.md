# SearchScope Sprint 1 foundation report — v1.4.1

## Status

The project-based foundation is implemented and its automated backend, migration, evidence and rendering checks pass. This is not a claim that every Sprint 1 acceptance criterion has been manually verified. Live browser interaction, sticky positioning, keyboard flows and mobile visual QA remain unverified because the supported browser-testing capability is unavailable in this session. No Sprint 2 intelligence features were added.

The 21 SEO, 5 AEO and 3 GEO checks remain in place. Applicable checks retain equal weighting: pass = 1, review = 0.5, fail = 0; unmeasured checks are excluded. Network observations, cross-page candidates, project issue aggregation and link relationships do not add checklist points.

## Architecture assessment and resulting changes

| Area | Previous architecture | Result |
| --- | --- | --- |
| Projects | Owner-scoped audit runs without a project entity | Website projects with names, origins, descriptions, active/archive status and dates |
| Isolation | Owner/run authorization | Project ownership and exact project context required for project-bound runs, pages, revisions and comparisons |
| Persistence | Latest page reports and append-only revisions | Additive project association, audit configuration, start/finish timestamps and structured fetch records |
| Migration | Existing audits had no project | Explicit, idempotent, owner-scoped import by valid website origin; malformed URLs remain unassigned |
| Crawling | Sitemap discovery plus bounded source crawl | Normalized URLs, meaningful query parameters preserved, tracking parameters removed, provenance and outcome metadata |
| Fetching | Safe requests and human-readable failures | Requested/final URL, initial/final status, redirects, time, decoded content size/type and classified failures |
| Content | DOM-based structural extraction | A normalized PageDocument with main text, boilerplate regions, metadata, images, links, structured-data source and extraction confidence |
| Headings | Content-only headings used by checks | Full heading inventory with DOM order, classification, section, selector and context; existing checks still use content headings |
| Evidence | Selector/snippet/context | Page identity, element classification, attributes and explicit snippet truncation; all evidence included in JSON/CSV/Markdown |
| Links | Bounded HTTP verification | Link kinds and provenance, first/final response status, redirect traces, bounded recent-result reuse and canonical observations |
| Cross-page data | Duplicate metadata/H1 and shingle similarity | Recurring existing findings by page, within-crawl incoming/outgoing relationships and scope-aware run comparisons |
| Product flow | One global audit workspace | Projects → one project sidebar → Overview / Audits / Pages / Issues / Content Analyzer / Opportunities / Reports / History / Settings |

### Data relationships

- A project belongs to one authenticated Site user. The owner and normalized website origin have a unique index.
- Audit runs belong to that owner and optionally to a project. Null project associations represent retained legacy data.
- Latest page results belong to a run; `(run, URL)` remains unique.
- Audit revisions are append-only and indexed by `(run, URL, audit date)`.
- Page/report/evidence/project relationships derive from the authorized run. User-supplied project IDs are never trusted without authorization.
- Bounded report/document data remains JSON in page/revision rows. Indexed ownership and run relationships avoid loading every user's reports. This is a bounded foundation, not an unlimited crawl warehouse; very large crawls would need normalized document/link/evidence storage and background workers.

## Migration steps

1. Retain a source backup of v1.4.0 and a database backup using the hosting provider's database facilities. The existing source ZIP contains code, migrations and documentation, **not live database records or credentials**.
2. Keep applied migrations `0000` and `0001` unchanged.
3. Apply `0002_lovely_cerise.sql`: creates `projects`, adds nullable run project/config/start/finish fields and indexes. It does not guess any project's ownership or delete existing runs.
4. Apply `0003_dazzling_risque.sql`: adds nullable fetch-record JSON fields to latest page results and revisions. Existing rows remain valid.
5. The Sites deployment applies the packaged additive migrations. For another host, apply these migrations once in order before serving the new routes.
6. Sign in, open Projects and select **Import existing audits**. Import matches the current user's valid absolute HTTP/HTTPS origins, reuses an existing project where possible and associates that user's runs atomically per website. Other users' records are untouched. Repeating import does not duplicate projects or associations.
7. Review the reported ambiguous count. Unassigned legacy runs remain accessible in `/legacy`; do not guess a website for malformed historic site values.
8. Validate two different projects, their run lists and page history before considering a rollback. A source rollback does not require dropping additive columns/tables; dropping them would destroy associations and is not part of this migration.

## User flow and navigation

Create a Website project or import existing audits. Open the project, then use Audits to set a page limit and crawl depth. Every selected URL has a row, including pending and failed pages. Open a page report, expand a finding and inspect affected elements beside the fix guide. Page report navigation keeps Audits active. Re-audit one page to preserve credits and append a revision.

Issues aggregates the existing finding groups with checklist, topic, severity, page and text filters. Passed and unmeasured checks can be inspected without treating unmeasured results as confirmed errors. Destination verification separately shows real missing, restricted, failed or unverified HTTP observations. Cross-page duplicate/similarity candidates and link relationships are available for review.

Content Analyzer remains separate: analyze text, HTML or a public URL in the selected project context without overwriting a saved website audit. Standalone analysis is not saved as a website run. Opportunities only lists opportunity findings generated by the existing engine.

Project cards show current audit counts, dates and latest available category averages. Open/Edit actions lead to project navigation/settings. **Archive** retains all audit history and prevents new audits until restored; it is not permanent deletion. Runs and revisions remain private to their owner even though the Site interface is public. Collaborative sharing of saved projects is not implemented.

## URL, crawl and fetch contracts

- URL normalization removes fragments and common tracking keys (`utm_*`, `gclid`, `fbclid`, `msclkid`), normalizes host casing/default ports and unreserved path escapes, and preserves meaningful query values/order.
- HTTP/HTTPS, `www`/non-`www` and trailing-slash variants are not blindly merged. Observed redirects are retained for review. Same-origin scope is conservative; it does not assume every subdomain belongs to the website.
- Each discovery entry retains normalized URL, source, discovery time, depth/referrer when known, crawl outcome, HTTP/final URL/redirect metadata where attempted, and an error classification where observed.
- Sitemap-only URLs can have unknown depth/referrer. This is reported as unknown, not invented.
- Source crawling is bounded to depth 0–5, at most 100 page fetches and a 20-second crawl budget. Depth 0 fetches the root but does not recursively follow links. Sitemap inventory discovery is separately bounded to 12 sitemap files, 1,000 URLs and 25 seconds.
- Link checking is bounded to 20 unique destinations and 15 seconds per page. Remaining destinations are explicitly unchecked. Canonical observations share that verification budget.
- A previously checked destination in the same run may be reused for up to five minutes, with its actual observation timestamp and a cache label. Single-page re-audits obtain fresh observations.
- Redirect loops/limits, restricted responses, timeouts, robots failures and non-HTML results are not mislabeled as confirmed missing pages. HTTP 404/410 is required for a confirmed missing-destination observation.
- Response size is bounded. Initial HTML is decoded and parsed; JavaScript rendering, external CSS visibility and computed styles are not inspected.

## Extraction and evidence contracts

DOM parsing handles malformed HTML and character entities. Semantic main/article landmarks are preferred. Otherwise, body content excludes structurally identified navigation, headers, footers, sidebars, cookie banners and hidden elements. Classification is structural: semantic roots receive higher extraction confidence than a body fallback; this is not a proof of rendered visibility.

PageDocument retains metadata, main content, boilerplate-region text, all heading classifications, visible images, link types/provenance and JSON-LD source. The existing checks use main-content headings. Full inventory permits manual inspection of navigation/footer/hidden headings without contaminating H1 or hierarchy findings.

Element evidence records include page URL/label, affected tag, valid DOM selector, source snippet, text, parent context, page section/classification and attributes. Absence and document-level checks explicitly have no fabricated selector. Snippets have a 2,000-character cap and a truncation flag. Evidence lists support incremental display and are not silently limited to the first few occurrences. An element may occur in multiple finding groups; occurrence totals are not unique-element totals.

## Cross-page and history behavior

- Duplicate title, description and H1 comparisons use Unicode-normalized, case-insensitive, whitespace-normalized text. Empty values are not duplicate groups.
- Similar-content candidates use ≥85% five-word-shingle Jaccard overlap, at least 80 extracted words, the first 2,000 words, and up to 100 pages. This compares extracted content, not navigation/footer text, and requires manual review.
- Recurring groups aggregate existing check IDs/severities across pages without creating new checks.
- Link relationships reflect links found in fetched initial HTML. **No internal links found within crawled pages** is used instead of claiming a definitive orphan page.
- Canonical syntax/relation/destination observations remain distinct from search-engine canonical selection. A canonical to another URL can be intentional.
- Separate-run comparisons report scores, new/passing finding groups, changed failures and URLs added/removed from the **selection**. Selected URL changes are not confirmed website additions/deletions.
- Only successful reports with matching report/extraction versions and target phrases can produce fix counts or score deltas. Failed, missing or unmeasured reports never count as fixes. Version/phrase changes are disclosed.
- Current pages remain efficient to query while full successful and failed attempts are retained in revisions. Existing pre-revision snapshots are preserved as baselines on the next re-audit. Earlier overwritten snapshots cannot be reconstructed.

## Validation

Passed commands: `pnpm exec tsc --noEmit`, `node scripts/audit-checks.mjs`, `node scripts/foundation-checks.mjs`, `node scripts/project-checks.mjs`, `node scripts/project-view-check.mjs`, `node scripts/report-render-check.mjs`, `node scripts/unified-report-check.mjs`, `node scripts/report-tabs-check.mjs`, and the production Worker build. Fixtures use controlled HTTP responses and real in-memory SQLite with foreign keys enabled; they do not pretend to be live website audits.

| Acceptance area | Evidence/status |
| --- | --- |
| 1. Project creation | SQLite route fixture: valid Website creation, normalized origin and date fields |
| 2. Project editing | Route fixture: name changes; site changes rejected once audits exist |
| 3. Project deletion rule | Archive/restore fixture; runs and revisions retained |
| 4. Duplicate project handling | Owner/origin duplicate rejected; unique index retained |
| 5. Run creation | Scoped run fixture with saved depth/page-limit configuration |
| 6. Sitemap discovery | Existing sitemap parsing and bounded discovery regression fixtures |
| 7. Internal-link discovery | Controlled same-origin recursive discovery fixtures |
| 8. Crawl depth | Depth-one fixture; beyond-depth URLs not recursively discovered |
| 9. Crawl/page limits | Engine bounds and explicit partial/unchecked result fixtures |
| 10. URL normalization | Tracking removal, meaningful queries, fragments/default ports/path escapes and slash preservation |
| 11. Domain boundaries | Safe URL/DNS/cross-origin redirect regressions |
| 12. Redirect detection | Safe redirect and redirect-loop fixture assertions |
| 13. Broken links | HTTP 404 classification fixture; restricted/unverified states kept separate |
| 14. Precise evidence | Real selectors resolved against parsed fixture DOM; page/attributes/classification assertions |
| 15. Main-content extraction | Navigation/footer/sidebar/cookie/hidden exclusion fixtures |
| 16. Heading context | Content heading checks plus classified full inventory assertions |
| 17. Duplicate titles | Cross-page duplicate fixtures |
| 18. Duplicate descriptions | Cross-page duplicate fixtures |
| 19. Duplicate H1 | Cross-page duplicate fixtures |
| 20. Similar content | Main-content shingle similarity fixtures |
| 21. Run/revision preservation | Additive migration and multiple-attempt SQLite route fixtures |
| 22. Run comparison | Matching-scope comparison fixture; changed phrase/failure cases do not count as fixes |
| 23. Resolved issues | Missing-alt/hierarchy fixture changes produce verified passing groups |
| 24. New issues | Existing diff checks and introduced-group assertions |
| 25. Two-project isolation | Wrong/missing project context and wrong-owner routes rejected |
| 26. Export integrity | JSON/CSV/Markdown contain actual report and structured evidence; scoped export source |
| 27. Single-page re-audit | Two attempts retained; latest page and run association remain scoped |
| 28. Mobile/interaction UX | Responsive CSS and server-rendered navigation/accordions implemented; live browser visual/keyboard/sticky verification remains open |

Rendering tests validate markup and wiring, not pixel layout or real pointer/keyboard interaction. The acceptance report deliberately leaves live UX verification open.

## Changed modules

- Database: `db/schema.ts`, additive `drizzle/0002_*`, `drizzle/0003_*` and corresponding snapshots/journal.
- Project/server APIs: `lib/projects.ts`, `lib/history.ts`, `app/api/projects/**`, run/page routes and project-context checks for standalone URL analysis.
- Foundation/data: `lib/url-normalization.ts`, `lib/discovery.ts`, `lib/web-fetch.ts`, `lib/dom-extraction.ts`, `lib/audit.ts`, `lib/audit-service.ts`, `lib/link-analysis.ts`, `lib/project-analysis.ts`, `lib/report-export.ts`.
- UI: Projects homepage, project route/workspace, dedicated Content Analyzer, destination-observation accordions, scoped WebsiteManager/AuditHistory, stylesheet, retained legacy workspace.
- Documentation/tests: release inventory, public development log, this report, project/API/rendering checks and updated regression harnesses.

## Remaining limits and deferred work

No new keyword/backlink providers, rank tracking, Search Console, PageSpeed/Core Web Vitals, measured AEO/GEO visibility, automatic content generation or search-engine indexing claims. No unattended background crawl worker or job scheduler: keep the audit browser open while pages are processed; pause/resume and saved partial results remain supported. Run lists currently show up to 100 most-recent entries; older records are retained. No shared/team project authorization or permanent-delete/retention automation. Large-scale normalized evidence storage, full browser rendering and visual UX verification remain separate work. These are not represented as completed features.
