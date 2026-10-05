# Phase 2 inspection — baseline 1.7.0

Inspected before changing engine code. Base: merged main ec08f57.

## One execution path

`auditURL` fetches initial HTML, calls `analyze`, adds X-Robots-Tag observations, recalculates with the same scoring helper, and verifies bounded link destinations. `analyze` uses `extractDocument` and executes 29 inline check definitions. `normalizedPage` is an existing stored-report projection, not a second parser. Check data is stored in page revisions and frozen audit manifests.

`resultState` converts the legacy check status to explicit states. `checkCounts` and `websiteAuditSummary` share that mapping. `websiteFindingGroups` groups ID/category/severity and deduplicates current page attempts. `websiteScores` intentionally averages persisted page scores; historical scores must not be silently recomputed under a new engine.

`AuditReport`/`FindingDetails`/`ElementEvidence`, `WebsiteOverview`, `AuditDashboard`, and CSV/Markdown/JSON consume reports. Cross-page and content intelligence are separate evidence-backed observations, not additional score components.

## Actual check map

The inline definitions, not a conceptual list, are the registry. There is one implementation per ID. Duplicate title elements within one document and duplicate titles across pages are different observations, not competing implementations.

| Check ID | Category | Name | Execution | Input/output/evidence | Severity | Contribution | Report location |
|---|---|---|---|---|---|---|---|
| `title` | SEO | Missing or unclear SEO title | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['title']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `description` | SEO | Missing meta description | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['description']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `h1` | SEO | Main heading | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['h1']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `canonical` | SEO | Canonical declaration | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['canonical']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `index` | SEO | Indexing directives | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['index']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `alt` | SEO | Missing image alt text | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['alt']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `lang` | SEO | Document language | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['lang']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `viewport` | SEO | Mobile viewport | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['viewport']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-keyword` | SEO | Target topic | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-keyword']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-structure` | AEO | Scannable structure | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-structure']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-question` | AEO | Explicit questions | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-question']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-list` | AEO | Lists and comparisons | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-list']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `schema` | AEO | Structured data syntax | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['schema']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-attribution` | GEO | Author or organization attribution | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-attribution']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-sources` | GEO | Possible supporting links | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-sources']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-date` | GEO | Date context | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-date']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `title-duplicates` | SEO | Duplicate title elements | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['title-duplicates']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `description-duplicates` | SEO | Duplicate description tags | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['description-duplicates']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `canonical-valid` | SEO | Canonical URL syntax | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['canonical-valid']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `canonical-count` | SEO | Conflicting canonical declarations | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['canonical-count']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `heading-empty` | SEO | Empty heading text | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['heading-empty']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `heading-order` | SEO | Incorrect heading hierarchy | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['heading-order']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `image-dimensions` | SEO | Image dimensions and layout stability | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['image-dimensions']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `image-src` | SEO | Image source missing | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['image-src']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `anchor-text` | SEO | Missing link text or name | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['anchor-text']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `link-href` | SEO | Empty or non-navigation link destination | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['link-href']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `transport` | SEO | HTTPS page URL | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['transport']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `content-visible` | AEO | Readable initial content | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['content-visible']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |
| `social-meta` | SEO | Social preview metadata | `lib/audit.ts: analyze` | Condition and source evidence in the matching `add` call; `evidenceFor` attaches DOM/absence records | `guides['social-meta']` and shared status/severity mapping | PASS=1, REVIEW=0.5, FAIL=0; excluded otherwise | Category tab, All issues, Fix first, exports |

## Semantics and gaps

PASS means only the stated source condition passed. FAIL is an observed source problem. REVIEW is contextual/editorial review. Missing optional entity checks are NOT_APPLICABLE; unavailable markup in text mode is NOT_MEASURED. Link states separately classify 404/410, access restrictions, robots policy, budget, timeout, network and server errors; they must not be converted into fabricated scored findings.

Gaps found: whitespace metadata; arbitrary viewport content; arbitrary aspect-ratio declaration; mixed-case JSON-LD evidence selection; ambiguous NA labels; stale cross-page attempt selection; no shared score-methodology disclosure; no pinned golden report fixture.

Already correct: 29 stable check IDs; primary readable evidence with collapsed technical details; source-only boundaries; append-only revisions and immutable snapshots; explicit coverage; finding-group vs check-evaluation counting; no ranking/traffic/citation claims; bounded safe fetching and server-side project authorization.

## Validation scope

Controlled regression tests cannot certify real signed-in audits, mobile keyboard behavior, external crawl timing, database migration or production resource usage. Those acceptance criteria remain explicit release gates.

## Defined semantics after the targeted changes

All HTML-only checks are NOT_MEASURED for plain-text input. Scored states retain their legacy severity from `guides`: FAIL → error, PASS → pass, unavailable → unavailable, REVIEW → warning/opportunity as defined per ID. Confidence and explanation live in the existing per-ID guide; they are not inferred from score. Every row below uses the same `add` execution and `evidenceFor` source selector.

| Check ID | Executed condition and limits |
|---|---|
| `title` | First extracted title must be nonempty; absent/blank FAIL. Does not judge search intent or rewriting. |
| `description` | First trimmed description nonempty PASS; absent/blank REVIEW. Snippet selection unmeasured. |
| `h1` | Exactly one extracted main-content H1 PASS; otherwise REVIEW, not an automatic ranking error. |
| `canonical` | Trimmed declared href present PASS; missing/blank REVIEW. Destination/selection unmeasured. |
| `index` | Source robots/googlebot noindex or none REVIEW; otherwise PASS. URL service adds HTTP X-Robots-Tag observations. Actual indexing unmeasured. |
| `alt` | Visible source images with absent alt REVIEW; all attributes present PASS, including decorative empty alt; no images NOT_APPLICABLE. |
| `lang` | Trimmed html lang present PASS; absent/blank REVIEW. Language correctness unverified. |
| `viewport` | Comma-separated width=device-width declaration PASS; otherwise REVIEW. Actual rendered mobile usability unmeasured. |
| `content-keyword` | Trimmed optional phrase occurs literally in extracted text PASS; absent phrase REVIEW; no supplied target NOT_APPLICABLE. |
| `content-structure` | Main-content H2 (or paragraph breaks for text input) PASS; otherwise REVIEW. Editorial heuristic. |
| `content-question` | Main-content question heading (or literal text question) PASS; otherwise REVIEW. Questions are not obligatory. |
| `content-list` | Main-content list/table (or textual list marker) PASS; otherwise REVIEW. No snippet-inclusion inference. |
| `schema` | Invalid JSON-LD FAIL; detected @type from valid blocks PASS; none REVIEW. MIME case insensitive. Syntax only, not schema eligibility. |
| `content-attribution` | Author metadata, valid JSON-LD author/publisher, or recognized main byline PASS; otherwise REVIEW. Text mode observes attribution wording only. Identity/expertise unverified. |
| `content-sources` | External main-content links REVIEW for relevance/support; none NOT_MEASURED. Navigation/footer links do not establish support. |
| `content-date` | Calendar-valid recognized ISO-like metadata/JSON-LD/time date (or matching text date) PASS; otherwise REVIEW. Date context only, no freshness claim. |
| `title-duplicates` | More than one title FAIL; one PASS; none NOT_APPLICABLE. Primary-title presence is a separate check. |
| `description-duplicates` | More than one description REVIEW; one PASS; none NOT_APPLICABLE. |
| `canonical-valid` | Missing/blank href, unsupported protocol, credentials or URL parse failure FAIL; usable syntax PASS; no declaration NOT_APPLICABLE. Resolve against extracted base where available; pasted relative syntax uses a placeholder base. |
| `canonical-count` | Several resolved declared URLs differing FAIL; repeated same href REVIEW; one PASS; none NOT_APPLICABLE. Relative URLs use the extracted base; a placeholder is used for pasted input without a valid base. |
| `heading-empty` | Any empty main heading REVIEW; headings with text PASS; no headings NOT_APPLICABLE. |
| `heading-order` | Any increase larger than one heading level REVIEW; no skips PASS; no headings NOT_APPLICABLE. |
| `image-dimensions` | Positive finite numeric width/height pair or supported positive numeric inline aspect ratio PASS; otherwise REVIEW; no images NOT_APPLICABLE. External CSS, cascade and CLS unmeasured. |
| `image-src` | No src/srcset/lazy-source attribute REVIEW; source present PASS; no images NOT_APPLICABLE. HTTP asset availability unmeasured. |
| `anchor-text` | Linked anchor without an extracted accessible name REVIEW; named linked anchors PASS; no anchors NOT_APPLICABLE. Source ARIA/image/SVG naming reused. |
| `link-href` | Empty or JavaScript href REVIEW; other source hrefs PASS; no anchors NOT_APPLICABLE. HTTP validation remains a separate bounded observation. |
| `transport` | URL input HTTP REVIEW, HTTPS PASS; pasted HTML/text NOT_MEASURED. Does not establish transport security beyond scheme. |
| `content-visible` | Any extracted readable words PASS; none REVIEW. External rendering and quality remain unmeasured. |
| `social-meta` | Both trimmed Open Graph title and description nonempty PASS; otherwise REVIEW. No ranking contribution beyond checklist. |

Deterministic coverage: `tests/phase2-quality.test.ts`, `tests/fixtures/phase2-complete.html`, and three pinned projections in `tests/fixtures/phase2-golden.json`; HTTP/robots/redirect/link states are additionally covered by existing audit/foundation tests. Golden files cannot be regenerated by the regression runner.
