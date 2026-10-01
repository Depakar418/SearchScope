# SearchScope — Development log and feature inventory

Current release: 1.1.0

This document is versioned with the application. It records implemented scope and changes; future items below are not implemented features.

## Feature inventory

| Area | Feature | First release | Status | Scope |
| --- | --- | --- | --- | --- |
| Inputs | Public URL, pasted HTML and pasted text audits | 1.0.0 | Available | One page at a time; initial HTML only. |
| SEO | Page title, description, H1, canonical, robots directives, image alt, language, viewport and target phrase | 1.0.0 | Available | Source markup checks. Does not establish actual index status. |
| AEO | Sections, audience questions, lists/tables and JSON-LD syntax | 1.0.0 | Available | Editorial signals and JSON syntax; not an answer-engine visibility measurement. |
| GEO | Attribution, possible supporting links and date signals | 1.0.0 | Available | Heuristics; author expertise, factual claims and source quality require manual review. |
| Reports | Evidence, suggestions, category filters, finding search and metadata outline | 1.0.0 | Available | Session-only results; no server-side report history. |
| Exports | CSV task list and complete JSON report | 1.0.0 | Available | Downloads generated in the browser. |
| SEO | Duplicate titles/descriptions, canonical syntax/conflicts, empty/skipped headings, image sizing/source hints, link names/destinations, HTTPS and Open Graph metadata | 1.1.0 | Available | 12 additional source checks. Link destinations and rendering are not tested. |
| AEO | Readable initial-content check | 1.1.0 | Available | Detects empty extracted content; JavaScript rendering remains untested. |
| Reports | Error/warning/opportunity totals, priority action plan, why it matters, fix steps, affected elements, examples, retest instructions and reference links | 1.1.0 | Available | Confirmed errors are separated from contextual warnings and editorial opportunities. |
| Exports | Detailed CSV and downloadable Markdown audit report | 1.1.0 | Available | Includes severity, priority, impact, steps, affected elements and verification. |
| Documentation | Versioned feature inventory and added/changed/removed development log | 1.1.0 | Available | Visible in the app, with downloadable development documentation. |
| Data | Keyword volumes, ranking and backlink databases | — | Not implemented | Needs a licensed provider and an integration. |
| Data | Search Console metrics and actual index coverage | — | Not implemented | Needs verified-site access and an integration. |
| Performance | PageSpeed Insights, Lighthouse and Core Web Vitals | — | Not implemented | No performance score or field data is currently collected. |
| Crawl | Site-wide crawling, broken-link validation and rendered-JavaScript audits | — | Not implemented | Current auditing is single-page initial-source inspection. |
| AI visibility | Measured mentions, citations and competitor visibility in AI answers | — | Not implemented | Checklist scores do not measure these outcomes. |
| Projects | Persistent audit history, scheduled audits and automatic site changes | — | Not implemented | Results are in the current browser session. No automatic website edits. |

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
