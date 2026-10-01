# SearchScope — Development log and feature inventory

Current release: 1.4.0

This document is versioned with the application. It records implemented scope and changes; future items below are not implemented features.

## Feature inventory

| Area | Feature | First release | Status | Scope |
| --- | --- | --- | --- | --- |
| Foundation | DOM content extraction, selector evidence and cross-page comparisons | 1.4.0 | Available | Semantic content extraction from initial HTML; explicit evidence and comparison methods. No rendered-browser validation. |
| Inputs | Public URL, pasted HTML and pasted text audits | 1.0.0 | Available | One page at a time; initial HTML only. |
| SEO | Page title, description, H1, canonical, robots directives, image alt, language, viewport and target phrase | 1.0.0 | Available | Source markup checks. Does not establish actual index status. |
| AEO | Sections, audience questions, lists/tables and JSON-LD syntax | 1.0.0 | Available | Editorial signals and JSON syntax; not an answer-engine visibility measurement. |
| GEO | Attribution, possible supporting links and date signals | 1.0.0 | Available | Heuristics; author expertise, factual claims and source quality require manual review. |
| Reports | Evidence, suggestions, category filters, finding search and metadata outline | 1.0.0 | Available | Saved website runs and revision history; standalone pasted-content reports remain session-only. |
| Exports | CSV task list and complete JSON report | 1.0.0 | Available | Downloads generated in the browser. |
| SEO | Duplicate titles/descriptions, canonical syntax/conflicts, empty/skipped headings, image sizing/source hints, link names/destinations, HTTPS and Open Graph metadata | 1.1.0 | Available | 12 additional source checks. Link destinations and rendering are not tested. |
| AEO | Readable initial-content check | 1.1.0 | Available | Detects empty extracted content; JavaScript rendering remains untested. |
| Reports | Error/warning/opportunity totals, priority action plan, why it matters, fix steps, affected elements, examples, retest instructions and reference links | 1.1.0 | Available | Confirmed errors are separated from contextual warnings and editorial opportunities. |
| Exports | Detailed CSV and downloadable Markdown audit report | 1.1.0 | Available | Includes severity, priority, impact, steps, affected elements and verification. |
| Documentation | Versioned feature inventory and added/changed/removed development log | 1.1.0 | Available | Visible in the app, with downloadable development documentation. |
| Data | Keyword volumes, ranking and backlink databases | — | Not implemented | Needs a licensed provider and an integration. |
| Data | Search Console metrics and actual index coverage | — | Not implemented | Needs verified-site access and an integration. |
| Performance | PageSpeed Insights, Lighthouse and Core Web Vitals | — | Not implemented | No performance score or field data is currently collected. |
| Crawl | Recursive URL discovery and link response verification | 1.4.0 | Available | Bounded same-origin source crawl and safe HTTP verification. Rendered JavaScript remains unimplemented. |
| AI visibility | Measured mentions, citations and competitor visibility in AI answers | — | Not implemented | Checklist scores do not measure these outcomes. |
| Projects | Persistent audit revisions | 1.4.0 | Available | Owner-scoped successful and failed page audit attempts. Scheduling and automatic website edits are not implemented. |
| Crawl | Partial discovery fallback and visible pending-page queue | 1.3.0 | Available | Uses sitemap, homepage links and optional WordPress REST URLs; each selected page appears before its report finishes. |
| Reports | Sticky guidance panel and check-mark improvement steps | 1.3.1 | Available | Desktop guidance remains visible beside evidence; mobile layouts return to normal flow. |
| Reports | Lazy-loaded image source resolution and inspection links | 1.3.2 | Available | Prefers public data-src and lazy-source URLs over inline placeholders so image evidence can be opened directly. |
| Reports | Finding toggles, deep links and persistent fix-guide context | 1.3.3 | Available | Finding rows expand inline, the selected issue name remains visible in the guide, and hashes reopen the same finding. |

## 1.4.0 — 2026-10-02 — Sprint 1 foundation reliability

### Added

- DOM-based main-content extraction with section-aware heading context.
- Structured element evidence with selectors, HTML snippets and absence/document evidence.
- Bounded recursive crawling with depth, referring URL, discovery source and crawl status.
- HTTP link verification with internal/external classification and redirect traces.
- Cross-page metadata/H1 duplicates and transparent main-content similarity candidates.
- Append-only audit revisions with saved reports, scores, findings and measured changes.

### Changed

- Content metrics use extracted main content rather than navigation/footer text.
- Affected-element lists match the specific issue and support incremental display.
- Current page results remain fast to query while prior attempts are preserved.

### Removed

- Regex-based primary HTML extraction.
- Overwriting the only saved audit snapshot on re-audit.

### Validation

TypeScript, DOM/evidence fixtures, bounded crawl and link verification fixtures, cross-page comparisons, SQL migration and history-route checks, report regressions and production build.

### Remaining limits

Initial HTML only; external CSS and JavaScript visibility remain untested. Crawling and link checking return explicit partial results at safety budgets. Cross-page observations do not change checklist scores. Legacy results are preserved when next re-audited; earlier overwritten history cannot be recovered.

## 1.3.12 — 2026-10-02 — Consistent website summary cards

### Added

- Passed, All checks and Needs attention website summary totals.

### Changed

- Website page-list overview uses Errors, Warnings, Passed, All checks and Needs attention cards.
- Audited, selected and discovered page totals remain in the overview heading.

### Removed

- Dedicated Opportunities card and Audited pages count card from the website overview.

### Validation

TypeScript, aggregate summary rendering checks, audit fixtures and production build.

### Remaining limits

Website cards sum finding groups across completed page reports; repeated groups on different pages count separately. Unmeasured checks remain separate from actual errors.

## 1.3.11 — 2026-10-02 — Finding filters and heading evidence placement

### Added

- All checks and Needs attention summary filters replace Opportunities and Unavailable cards.
- Heading findings show affected headings with preceding context and suggested level.

### Changed

- Five summary cards sit below the report navigation and are hidden in Page details.
- Page details contains neutral metadata, phrase usage, heading inventory and meta tags.
- Heading problems and fix guidance live in SEO findings and priority findings.

### Removed

- Duplicated heading problem highlights and category issue summaries in Page details.
- Dedicated opportunity and unavailable summary cards.

### Validation

TypeScript checks, audit fixtures, report rendering and production build.

### Remaining limits

Unavailable remains an unmeasured check, not an HTTP error. Suggested improvements remain available through report filters and Needs attention.

## 1.3.10 — 2026-10-02 — Website score overview

### Added

- Overall, SEO, AEO and GEO animated website checklist gauges.
- Audited coverage and measured-page counts explain the score scope.

### Changed

- Website issue totals use consistent labeled cards with severity icons and descriptions.
- Scores update from the current completed page reports without additional requests.

### Removed

- Ambiguous website issue-type count labels.

### Validation

TypeScript checks, aggregate score fixtures, report rendering and production build.

### Remaining limits

Category scores average measured page scores equally; overall averages available category means. Failed, pending and unavailable results are excluded. Partial audits do not represent the full website.

## 1.3.9 — 2026-10-01 — Clearer report controls and summary cards

### Added

- Finding-group summary cards explain their count and offer a clear filter action.
- Selected summary cards expose their filter state.

### Changed

- Report menu, search and status filter share one desktop toolbar, wrapping on smaller screens.
- The active report tab uses a filled bordered button with 4px corners.
- All five summary cards use the same label, count and action layout.

### Removed

- Partial left severity borders on finding rows.

### Validation

TypeScript checking, audit fixtures, report rendering checks and production build.

### Remaining limits

Summary counts represent finding groups, not affected-element counts; checklist scores remain source heuristics.

## 1.3.8 — 2026-10-02 — Unified page report navigation

### Added

- One report menu: All issues, Fix first, SEO, AEO, GEO and Page details, with Fix first selected by default.
- All issues stacks category cards without additional new-tab buttons.
- Page details uses collapsed arrow-toggle cards for metadata, phrase usage, headings and meta tags.
- Back to website pages preserves the current inventory and filters.

### Changed

- Website page reports remain in Audit workspace; Content analyzer stays a separate input workflow.
- Priority findings share the same accordion workspace as other categories.

### Removed

- The separate Fix first report block above the category navigation.
- Automatic scrolling when a finding is expanded in the unified report.

### Validation

TypeScript checking, audit fixtures, report rendering, report-tab checks and production build.

### Remaining limits

Report tabs still use session snapshots. Scores remain source-check heuristics, not search performance measurements.

## 1.3.7 — 2026-10-02 — Dedicated category report tabs

### Added

- Fix first, SEO, AEO and GEO buttons open a dedicated full-width report tab.
- Issue groups start collapsed and expand affected elements with the existing sticky guidance workspace.
- Browser-session snapshots reuse the current audit without a new scan; popup/storage errors are explained.

### Changed

- Category summary buttons open report tabs instead of changing the dashboard filter.

### Removed

None.

### Validation

TypeScript checks, audit fixtures, report rendering checks, snapshot/selection checks and production build.

### Remaining limits

New tabs hold a snapshot, not a live re-audit. Their report URLs only work within the transferred browser tab session.

## 1.3.6 — 2026-10-02 — Clearer score gauges and evidence links

### Added

- Animated semicircle SEO, AEO and GEO checklist gauges with a shared red–orange–green scale and reduced-motion support.

### Changed

- One audited-page link appears above the evidence list; individual rows keep only relevant image and destination links.

### Removed

- Repeated audited-page links in every evidence row.

### Validation

TypeScript checks, report rendering checks and production build.

### Remaining limits

Scores remain source-check summaries, not measured rankings or AI visibility.

## 1.3.5 — 2026-10-02 — Fix first inline accordion workspace

### Added

- Fix first items now expand their full evidence-and-guidance workspace directly inside the Fix first card.
- The same finding details component is reused so evidence stays left and issue/solution guidance stays right.

### Changed

- Fix first actions no longer move the user to a separate findings section; category tabs continue to use the same expandable finding rows.

### Removed

None.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

One Fix first item is expanded at a time. Report data remains session-scoped.

## 1.3.4 — 2026-10-02 — Simpler sticky guidance scrolling

### Added

- Sticky guidance now uses the page scroll instead of a nested internal scrollbar.

### Changed

- Removed the guidance column max-height and overflow rules so long fix instructions remain part of one continuous page flow.

### Removed

- Nested scrollbar inside the sticky guidance panel.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

On very small screens the guidance column remains in normal document flow.

## 1.3.3 — 2026-10-02 — Clearer finding navigation

### Added

- Fix-first actions open the exact finding inline with its error name and solution context.
- Finding hashes make expanded reports directly reopenable from a copied URL.
- Sticky guidance is preserved by allowing the report panel to overflow without trapping the sticky pane.

### Changed

- Opening or closing a finding updates the URL hash and keeps the evidence-and-guidance workspace synchronized.

### Removed

None.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

The hash reopens a finding only while the current report contains that finding; report data remains session-scoped.

## 1.3.2 — 2026-10-02 — Usable image evidence links

### Added

- Image evidence now resolves data-src, lazy-load and source-set URLs when the visible src is an inline placeholder.
- Direct image inspection links remain available alongside the audited-page link.

### Changed

- Image rows show a public asset URL and preview whenever the audited markup exposes one.

### Removed

None.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

If a page only exposes an inline image and no public fallback URL, the audited-page link remains the reliable inspection path.

## 1.3.1 — 2026-10-02 — Persistent guidance and clearer fix steps

### Added

- Sticky desktop guidance panel keeps issue explanations and solutions visible while evidence is reviewed.
- Check-mark improvement steps make each action easier to scan.

### Changed

- Responsive layouts disable sticky positioning on smaller screens to preserve natural scrolling.

### Removed

None.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

Sticky positioning applies to the report workspace; browser layout and long-page behavior still require live visual validation.

## 1.3.0 — 2026-10-01 — Resilient discovery and clearer issue solutions

### Added

- Homepage-link and optional WordPress REST fallbacks when a readable sitemap is unavailable.
- Partial inventories returned when robots, sitemap or individual fetches time out.
- Selected pages are listed immediately with Pending state, per-page URL, type and issue columns.
- Question-and-answer issue summaries with separate issue, solution, evidence, example and verification sections.

### Changed

- Discovery uses bounded 5-second sitemap requests and a 25-second overall safety window.
- Progress counts completed and failed reports instead of hiding undiscovered pending pages.
- Image evidence truncates inline data URIs and previews safe public image URLs when available.
- Finding details now use a two-pane evidence-and-guidance workspace with severity-colored issue/solution cards and clearer expanded-row hierarchy.
- Fix-first findings now open the exact matching report and scroll to its detailed workspace.
- Single-page re-audits show SEO/AEO/GEO score changes after a page is retested.
- Issue labels use plain-language names such as Missing image alt text and Incorrect heading hierarchy.

### Removed

None.

### Validation

TypeScript checking, audit fixtures, server-rendered report checks and production build.

### Remaining limits

Fallback discovery only sees public, same-origin links exposed in the homepage or WordPress API. JavaScript-only navigation, private routes and pages omitted from public discovery remain outside the inventory.

## 1.2.0 — 2026-10-01 — Website discovery and page-wise audit workspace

### Added

- Sitemap and sitemap-index discovery with homepage-first inventory.
- Owner-scoped persistent audit runs with page reports and failed-page records.
- Page table with Home, Page, Blog / Post, Newsletter, Article, Category, Product and Other filters.
- SEO, AEO and GEO page-wise rating, quality labels, issue totals and sortable views.
- Per-page phrase occurrence, descriptive density, title/description/H1 placement and a re-audit phrase control.
- Highlighted heading/source previews so affected elements are visible in context.
- Separate category explanations explaining what is measured, what is not measured and how to improve.

### Changed

- Audit workspace now starts with website discovery instead of asking users to enter every URL.
- Sitemap limits, same-origin checks and page-type confidence labels make discovery bounded and transparent.
- Failed and pending pages no longer receive scores.
- Development document now records the page-wise workflow and persistent history.

### Removed

- The requirement to manually submit every discovered URL for a website audit.
- Empty AEO/GEO result states without an explanation of the measurement boundary.

### Validation

TypeScript checking, audit fixtures, report-render checks and production build. Live sitemap discovery, D1 migrations and browser interaction still require deployment/runtime validation.

### Remaining limits

No guarantee that a sitemap lists every page; no crawling of pages omitted from the sitemap; no JavaScript rendering, Search Console, rankings, backlinks, Core Web Vitals or measured AI citations.

## 1.1.0 — 2026-10-01 — Detailed issue reports and development tracking

### Added

- 13 additional source/content checks: duplicate titles and descriptions; canonical syntax and declaration conflicts; empty headings and heading-level skips; image dimension and source hints; unnamed and empty/JavaScript links; HTTPS URL; readable initial content; social preview metadata.
- Separate error, warning, improvement opportunity and unavailable totals.
- Fix-first list sorted by severity and priority.
- Per-finding impact, numbered fix steps, affected-element examples, confidence, reference and verification instructions.
- Detailed CSV columns and downloadable Markdown audit report.
- Feature inventory, release history and downloadable development log.

### Changed

- Finding labels explain contextual issues instead of presenting every finding as a generic Review.
- Report overview defaults to findings needing attention; passed and unavailable checks remain accessible.
- HTTP noindex findings update severity and priority consistently.
- Supporting-link classification compares URL origins rather than string prefixes.
- Sample includes intentional duplicate-title and JSON-LD syntax errors plus contextual warnings.
- Checklist totals and scores now include additional applicable checks; scores from different versions should not be compared directly.

### Removed

- Generic one-sentence-only recommendation display.
- Combined “to review” summary that concealed the distinction between errors and opportunities.

### Validation

Audit-engine and API fixtures, export assertions, TypeScript checking and production build. Browser and WebMCP interaction tests are unavailable in this environment.

### Remaining limits

No site-wide crawl, JavaScript rendering, ranking/backlink/keyword datasets, Core Web Vitals or measured AI citations.

## 1.0.0 — 2026-10-01 — Initial audit workspace

### Added

- Public one-page URL audits with crawler checks, bounded fetching and public-DNS preflight.
- Pasted HTML and text analysis.
- 16 baseline checks across SEO, AEO and GEO.
- Evidence, basic suggestions, checklist scores, categories, filtering and metadata outline.
- CSV and JSON exports; built-in sample.
- Coverage and usage guides; optional browser WebMCP action when supported.

### Changed

None.

### Removed

None.

### Validation

Audit extraction and API fixtures, TypeScript checking and production build. Browser and WebMCP interaction tests were unavailable.

### Remaining limits

Single page, source only, session-only reports. No third-party search/performance/AI datasets.

## Report interpretation

Errors are observed source problems such as missing titles, duplicate titles, conflicting/malformed canonicals or invalid JSON-LD. Warnings need contextual review; opportunities are optional editorial or presentation improvements. Passed means the specific source check passed, not that the site has no SEO problems. Unavailable checks were not measured. HTML extraction remains a lightweight source scan. Every applicable check is weighted equally (pass 1, review 0.5, fail 0); unavailable checks are excluded. SEO/AEO/GEO scores are checklist summaries, not rank or citation forecasts.
