# SearchScope — SEO / AEO / GEO Completion Sprint

Date: 5 October 2026. Implementation branch: `seo-aeo-geo-completion`, based on local Phase 2 validation commit `a3cbee79d6617be5e4d62117be4467c70e499207`. Before coding, reviewed `POST_PHASE2_CURRENT_STATE_AUDIT.md` and inspected the current engine,29 checks, result/evidence models, score/aggregation, cross-page selection, reports, exports and test harnesses. Application release constant remains1.7.0; this is an unreleased implementation branch. Engine becomes **1.6.0** because source predicates/projections changed. Content intelligence becomes **2.1.0**; source-signal model1.0.0. No deployment, remote push, migration, production configuration change or new external integration was performed.

**SEO/AEO/GEO COMPLETION STATUS: PARTIALLY COMPLETE.** The requested local implementation and regression checks are complete. This does not certify all 20 acceptance criteria in a real browser/production environment. The unchanged lint gate and existing real-world P0 acceptance work remain outstanding. No new scored check, duplicate crawler/parser/score/history engine, or fake production result was created.

## Implementation summary

### AEO improvements — 6 groups

1. Shared question candidates now drive the existing `content-question` check and content intelligence. Question headings accept question punctuation or common question stems (including “How to practice”); literal question sentences inside paragraphs are also detected. Navigation/footer/hidden boilerplate remains excluded by existing DOM extraction.
2. Normalized answer candidates capture question, page/section/nearest heading/selector, actual question and answer evidence, answer format and distance in DOM source positions. Answer candidates stop at the next heading; paragraph questions use the following text in that same paragraph.
3. Paragraph/List/Table/Mixed/None formats and Direct answer/Structured answer/Weak answer/No clear answer source cues are exposed. Labels are deterministic review cues, not semantic certifications. All answer candidates carry `status: REVIEW`.
4. Supporting adjacent blocks, links located inside the candidate blocks and page-level attribution signals are retained. Attribution is explicitly page-level, not automatically tied to an answer. External links do not prove support.
5. Completeness cues report character/block/link counts. Clarity cues report source structure and literal question-term overlap. No opaque answer-quality or AI-generated score exists.
6. Report details, existing AEO category panels, saved content intelligence and exports expose the model. Native collapsed disclosures and “Show more” controls keep reading manageable.

**Detection rules:** at most 200 question candidates; first 3 adjacent blocks; answer preview up to 1200 characters. A paragraph cue needs at least 50 characters and a literal nontrivial question-term overlap; list/table/mixed cues need at least 30 characters. These thresholds are transparent heuristics; they cannot determine relevance, truth, completeness, accessibility or answer selection. No adjacent answer is an observed absence in the captured structure, not proof that the question is unanswered elsewhere. Scores still measure the existing question-presence check, not these added answer judgments.

### GEO improvements — 4 groups

1. Normalized entity/context signals contain type/value/source/evidence/confidence/page/section and OBSERVATION classification. Organization, Product, Service, Person/author, Location, Industry, Technology, Topic, Regulatory subject and Business context types are supported.
2. JSON-LD declarations (including arrays, nested objects and `@graph`), author metadata, OpenGraph site name, keyword metadata, title/headings, visible labelled context and anchor text provide source evidence. Literal examples such as WordPress, DPDPA and healthcare yield contextual review signals; this is a bounded vocabulary, not universal named-entity recognition. Postal-address locality/country declarations provide location context.
3. Declared names use High detection confidence; context inferences use Medium/Low. High means a declaration was captured, not that the organization/person/entity is authentic, recognized by Google, or selected by AI systems.
4. One freshness extractor supplies the existing date check, evidence, intelligence, reports and exports. It inspects JSON-LD datePublished/dateModified, article publication/modification metadata, date/DC.date metadata, main-content time elements and explicitly labelled ISO-like visible publication/update dates. Invalid candidates remain visible rather than becoming generic absence evidence.

JSON-LD signal traversal is bounded to depth 8 and1000 visited values per block; entity inputs inspect at most100 captured blocks,40 headings,80 paragraphs and20 anchors. Entity/freshness outputs each cap at200 signals. These caps mean the model is a bounded source projection, not an exhaustive knowledge graph.

### SEO improvements — 5 groups

1. Canonical target projection separates declared/resolved URL, usable syntax, same-origin/external/unknown relation, HTTP status, redirect chain, final URL/match, fetch failure and budget availability. Relative pasted canonicals without an observed URL base keep VALID syntax but TARGET_NOT_VERIFIED with no invented resolved target.
2. Canonical URLs are prioritised within the existing unique destination verifier. The20-destination /15-second per-page ceiling is retained and clamps caller overrides. Redirect/HEAD/GET, DNS/public URL and robots policy remain in the existing infrastructure; robots verification receives the same deadline. No extra canonical fetch engine or additional scoring is added.
3. Link projection uses VERIFIED_2XX/3XX/4XX/5XX, REDIRECTED, BLOCKED, TIMEOUT, REQUEST_ERROR, NOT_VERIFIED and BUDGET_EXHAUSTED. Product policy labels only confirmed404/410 as broken.403/429 restrictions, timeouts, failed requests and budget exhaustion never become broken links.503 is a verified error response requiring review, not silently called a missing page.
4. Target phrase presence now reuses exact phrase counting from statistics, eliminating “art” passing from “partial” while its occurrence count is zero. Leading whitespace in JavaScript href is handled consistently by the check and evidence. The primary title check is now named “SEO title presence”, matching its observable predicate.
5. Latest-attempt selection gives valid timestamps precedence over missing/invalid dates; equal-valid or all-unknown ties use the last supplied record. An explicitly empty attempt timestamp is no longer replaced by a report-generation date in cross-page analysis. Failed latest attempts suppress older success. Unknown dates cannot establish historical recency; ties remain deterministic rather than invented.

### Evidence improvements — 5 groups

1. Existing canonical finding projection gains audit/page identity, finding type, detection confidence/meaning, location, recommendation and check-specific limitation without changing stored historical reports.
2. Finding UI consistently exposes What we found / Why it matters / Where / Evidence / What to fix / How to verify / Limitation. Missing title is ISSUE; pass, unavailable and freshness observations are OBSERVATION; optional and contextual reviews remain OPPORTUNITY/RECOMMENDATION/OBSERVATION, not automatically errors.
3. Link evidence exposes visible/accessibility identity, captured href, resolved destination and explicit HTTP state. Canonical evidence exposes resolved target and verification state. Existing image dimensions/alt/source and heading context remain readable before selectors.
4. Schema source preview reports parse state, `@context` and string types from arrays/graphs. A truncated/unavailable snippet is NOT_MEASURED, not incorrectly claimed malformed. Invalid captured complete JSON is explicitly INVALID_JSON. Existing schema scoring retains its captured raw-script syntax predicate.
5. CSS selectors, HTML and fingerprints stay in technical disclosure. Source snippets remain escaped React text; they are never injected as executable markup. Existing “no visible text” facts may still describe genuinely unnamed links, but richer URL/name/content fields are used for identity first.

### Reporting improvements — 6 groups

1. Page and website Fix-first ordering is deterministic and explained using severity, existing guide priority, affected page/element scope, observed/heuristic detection confidence and stable ID. Website reasons identify patterns across audited pages. No traffic, revenue, volume or ranking impact is fabricated.
2. Aggregation distinguishes unique finding types (category/check ID), groups (category/check ID/severity), affected pages, unique captured page/selector elements, page/check occurrences, all result instances and evaluated PASS/REVIEW/FAIL instances. Repeated check instances are never called hundreds of website issues. Absence findings have no invented DOM element count.
3. Coverage displays discovered, selected, analyzed, failed, blocked, outside-selection/skipped and pending. New coverage.failed excludes blocked; legacy summary.failed still includes blocked for compatibility. Coverage = round100×analyzed/selected; empty selection is null. “Skipped” means outside selection, not a hidden crawler failure. The legacy robots-blocked token undercount is fixed.
4. Checklist/source-signal score context and exclusions remain beside scores. “Strong/Low checklist result” replaces ambiguous checklist-coverage labels. Website scores remain averages of available measured page category scores; overall averages available categories. Unmeasured/failed/pending pages never become successful analyses or zero scores.
5. Re-audit/history/compare UI shows compatible stored before/after states, RESOLVED/NEW/UNCHANGED, score changes and run coverage changes. A new PASS is required for resolution; NA/NM, failed attempts, mismatched engine version or target phrase cannot prove a fix. Manual opportunity “Resolved” is labelled “Marked resolved manually”; unsupported opportunity-type filters were removed. No historic snapshot is rescored or mutated.
6. JSON/CSV/Markdown include the same canonical finding object for every29 checks, stable IDs, category/status/severity, finding type/detection confidence, explanation, evidence/location, recommendation/verification, contribution/version/timestamp and stored audit ID where available. Source-signal and canonical/link projections are also included. Standalone audit ID remains null/blank, never invented. Frozen export derives convenience fields at serialization while preserving the underlying stored snapshot. Export never fetches or calls analyze.

## Observable, heuristic and not measured

| Class | What it means | Examples |
|---|---|---|
| Observable | Captured source or a recorded HTTP outcome | Missing title, declared author/date/name, list/table, requested URL,404 response |
| Heuristic / REVIEW | Source cues supporting human review | Likely adjacent answer, term overlap, inferred context/topic, appropriate structure, potential similar content |
| NOT_MEASURED / NOT_VERIFIED | Required source/context/request is unavailable | Rendered answers, semantic accuracy, selected canonical, exhausted link budget, old snapshot without full signal records |

Not measured: rankings, traffic, authority, keyword volume, AI visibility/citation probability, featured-snippet probability, actual AI selection, factual freshness, entity recognition, rendered CSS/JavaScript, field performance and definitive orphan/cannibalization conclusions. No Search Console, Analytics, PageSpeed, competitors/backlinks, billing, scheduling, email or automated WordPress fixes were added.

## Freshness policy and examples

- FRESHNESS_SIGNAL_DETECTED: one supported valid declaration.
- MULTIPLE_FRESHNESS_SIGNALS: multiple valid declarations without a detected contradiction.
- FRESHNESS_SIGNAL_CONFLICT: differing calendar dates for the same published/modified type, or modification preceding publication. Different publication and update dates alone are not a conflict.
- NO_FRESHNESS_SIGNAL: no captured supported candidates.
- INVALID_DATE_SIGNAL: candidates exist but no valid normalized date.

Each candidate retains source/type/raw value/normalized date/validity/evidence. Mixed valid and invalid candidates remain individually visible even when the overall status is detected/multiple/conflict. ISO-like dates are validated against calendar days; date-only values normalize to YYYY-MM-DD. Zoned timestamps normalize to UTC; unzoned timestamps retain their local representation because source timezone is unknown. Unsupported date formats remain uninterpreted. A2001 declaration is still a declared date, never proof of outdated content.

Example: JSON-LD dateModified2026-09-18 → modified /2026-09-18 /JSON-LD dateModified /FRESHNESS_SIGNAL_DETECTED. JSON-LD dateModified2026-09-20 plus metadata modified2026-09-18 → conflict for review.2026-02-30 → invalid candidate with its actual source evidence.

## Scoring, confidence and verification

The sole existing score formula remains round100×(PASS +0.5×REVIEW)/evaluated checks, equal weight; unavailable states are excluded. New signals are not additional scored checks. Conflicting date declarations now produce REVIEW for the existing date check; correction of phrase presence or whitespace href may legitimately change that existing result. Engine 1.6.0 prevents unsafe fix comparisons against1.5.0 snapshots.

Detection confidence is separate from status, severity, priority and score. High means a directly captured fact/declaration/absence/HTTP response; Medium/Low qualify structural/editorial inference. It is never a ranking/citation likelihood. Raw check.confidence values observed/heuristic remain compatible; canonical detectionConfidence makes their interpretation explicit. Source models support High/Medium/Low without inventing percentages.

Example verification: missing alt → REVIEW; compatible re-audit with alt attribute → PASS /RESOLVED. Removing the image → NOT_APPLICABLE is not a verified fix. Timeout → no completed report is not resolution. Engine/phrase changes → scoreChanges null, no fix counts. Re-audit compares the latest saved page revision; completed frozen snapshots preserve their sealed reports. A historical report without the new freshness model shows unavailable records rather than fabricated reconstruction.

## Validation results

Node24.19.0 in the local workspace. No live provider credentials or remote production database was used. New controlled fetch fixtures intercept DNS/robots/HTTP so canonical/link tests exercise the existing verifier without actual outbound traffic.

| Validation | Result | Scope |
|---|---|---|
| `npm run test:completion` |36/36 PASS |22 requested A–V fixtures plus14 boundary/reconciliation/rendering cases |
| `npm run test:phase2` |PASS |42 accuracy cases, all 29 IDs, three pinned completion projections and complete CSV reconciliation |
| `npm run test:vercel-db` |1/1 PASS |Real local SQLite adapter read/rollback; not remote Turso |
| `node scripts/audit-checks.mjs` |PASS |Existing engine/URL/security/HTTP/export checks |
| `node scripts/foundation-checks.mjs` |PASS |DOM/evidence/bounded fetch/robots/history/snapshot fixtures |
| `node scripts/project-checks.mjs` |PASS |Local SQL project, roles/invites/transfer, history, comparison, intelligence and export regressions |
| `node scripts/report-render-check.mjs` |PASS |Server-rendered findings/guidance/development log |
| `node scripts/unified-report-check.mjs` |PASS |Existing menu/collapsed findings plus10 primary page-detail accordions and source disclosures |
| `node scripts/report-tabs-check.mjs` |PASS |Scope/order/snapshot/opener/popup mocks |
| `node scripts/project-view-check.mjs` |PASS |Server-rendered project hub/workspace/destination view |
| `node scripts/website-aggregation-check.mjs` |PASS |Groups/elements/current attempts/88-page instance separation |
| `node scripts/evidence-context-check.mjs` |PASS |Readable evidence/heading/escaped snippets |
| `node scripts/cross-page-dashboard-check.mjs` |PASS |200-page cap/template exclusion/similarity/127-of 164 coverage/auth-scoped view fixtures |
| `npm run test:phase2-performance` |PASS |Offline10/25/50/100/127/200 generated-source fixtures |
| `npm run build:vercel` |PASS |Next compilation/routes manifest; no deployment |
| `tsc --noEmit --incremental false` after Vercel |PASS |Current typed source and correct generated Next declarations |
| `npm run build` |PASS |Sites/Vinext target compilation; no publication |
| Standalone tsc after switching to Sites output |KNOWN FAILURE |Same4 generated Next route exports as the Phase2 baseline; per-target output isolation remains outstanding |
| Full lint |FAIL:21 errors /33 warnings |Exactly54 normalized baseline diagnostics;0 new,0 removed. No suppression added |
| New source signal module/UI/tests lint |PASS:0 errors /0 warnings |New files only; does not claim full app lint passes |

Tests added: **36 named tests**, **22 deterministic scenario inputs**, one reviewed completion-golden file. Tests passed: **36 new named tests +42 existing accuracy cases +1 adapter test**, plus **10 existing regression harnesses** and **6 benchmark sizes**. These are different denominators; do not sum them into a fabricated coverage percentage or assertion count.

The original `phase2-golden.json` is preserved. The current runner reads the new pinned completion goldens; intentional differences are engine 1.6.0, precise title naming, date provenance/absence wording/evidence. Original complete/sample/text category score triplets remain100/100/83,80/80/50 andnull/100/100 respectively. Goldens are not regenerated by the test runner. Harness compilation lists were extended for the new real dependencies; expected version/coverage/accordion assertions were updated for actual intended behavior, not weakened to hide failures.

## Offline performance measurement

Single in-process run. Analysis includes existing DOM/check work and added source models. Export timing includesJSON reconciliation. No network, browser, deployment or remote persistence measured. Heap is a process-wide sampled high value across datasets, not retained dataset size or a guaranteed peak. Timings are not production guarantees or a statistically established speedup.

| Pages | Analysis ms | Comparison ms | Summary/score/export ms | Total ms | Sampled heap MB |
|---:|---:|---:|---:|---:|---:|
| 10 | 35.41 | 2.24 | 23.91 | 61.56 | 16.68 |
| 25 | 34.84 | 2.88 | 23.81 | 61.53 | 26.09 |
| 50 | 48.33 | 6.98 | 58.30 | 113.61 | 35.58 |
| 100 | 134.07 | 19.01 | 118.90 | 271.99 | 43.12 |
| 127 | 108.55 | 22.46 | 146.41 | 277.42 | 56.62 |
| 200 | 242.80 | 36.02 | 274.91 | 553.74 | 98.25 |

Existing page caps, same-origin discovery, robots/DNS/public URL guards, request timeouts, redirect limit, response-size caps and bounded unique link verification remain. No blind crawler optimisation or background/unbounded job system was added. Large nested documents, high evidence payloads, real network budgets and200-page remote persistence still need practical validation.

## Accessibility and UX validation scope

Modified report disclosures use native details/summary; controls use named buttons and collapsed defaults; source text/code is escaped. New source panels use wrapping/pre-wrap and a one-column provenance layout on mobile, inherited report styling and explicit focus-visible treatment. Long answer/entity lists have incremental display controls. Empty/no-source/invalid/unverified states are explicit; existing report tabs, search/filter/pagination and fetch/loading/error paths remain.

Server-rendered component checks verify panel names, statuses, limitations, coverage, collapsed state and preserved navigation. These checks do not simulate keyboard input, measure focus/contrast/layout at device sizes or prove downloaded browser bytes. A local Playwright module exists but its Chromium executable is not installed. No fresh browser screenshots or live mobile/keyboard acceptance were produced. Earlier deployment screenshots do not certify this branch.

The optional Impeccable context helper was blocked by automatic approval review after an unauthorized GitHub request attempt. It was not retried indirectly. Existing source/CSS context and local validation were used instead. This did not block code implementation; it is not evidence of actual production/browser acceptance.

## Final acceptance matrix

| Acceptance criterion | Status | Evidence/scope |
|---|---|---|
| 1. AEO answer signals clearer and evidence-backed | IMPLEMENTED / locally verified | Shared question detector; question/answer source evidence, adjacency, format, support cues, explicit REVIEW. |
| 2. GEO entity/context signals clearer and evidence-backed | IMPLEMENTED / locally verified | Declarations and literal context cues have type/value/source/evidence/confidence/page/section; no recognition claim. |
| 3. Freshness accurately represented | IMPLEMENTED / locally verified | Shared calendar validator and metadata/time/JSON-LD/visible-label extractor; explicit invalid/conflict/missing states. |
| 4. Canonical targets clearly classified | IMPLEMENTED / locally verified | Existing bounded verifier; syntax/origin/status/redirect/final match/failure/budget states, no inferred broken target. |
| 5. Links distinguish verified failure from unverified | IMPLEMENTED / locally verified | Explicit HTTP/redirect/blocked/timeout/error/budget states; only confirmed404/410 labelled broken. |
| 6. Findings explain observed facts | IMPLEMENTED / locally verified | Canonical projection feeds finding UI and exports; observed summary, impact, location, recommendation, verification and limitation. |
| 7. Human-readable evidence | IMPLEMENTED / locally verified | Captured values/names/URLs/dimensions/headings and status before selectors; graph schema parse/type/context display. |
| 8. Meaningful confidence | IMPLEMENTED / locally verified | Detection confidence High/Medium/Low; existing observed/heuristic values preserved for compatibility. |
| 9. Deterministic explainable Fix-first | IMPLEMENTED / locally verified | Severity, guide priority, affected scope/elements, source confidence, stable-ID tie break; reasons visible. |
| 10. Aggregation separates instances from issues | IMPLEMENTED / locally verified | Finding types, groups, pages, unique captured elements, page/check occurrences and total/measured check instances distinct. |
| 11. Visible audit coverage | IMPLEMENTED / locally verified | Discovered/selected/analyzed/failed/blocked/outside-selection/pending; analyzed divided by selected. |
| 12. Transparent score context | IMPLEMENTED / locally verified | Existing equal-weight score engine retained; measured pages/instances, exclusions and source-only limits disclosed. |
| 13. Re-audit can verify fixes | IMPLEMENTED / locally verified | Existing auditDiff/revisions; compatible new PASS required; visible before/after/RESOLVED/NEW/UNCHANGED. |
| 14. Historical comparisons | IMPLEMENTED / local SQL and fixture verified | Latest attempts and frozen reports; coverage delta and unchanged findings. Actual remote/user workflow remains NOT VERIFIED. |
| 15. Exports match UI model | IMPLEMENTED / locally verified | All29 stable IDs and canonical finding objects inJSON/CSV/Markdown; enriched frozen download is a pure projection. |
| 16. No unsupported search/AI claims | LOCALLY VERIFIED | No external ranking/traffic/AI visibility measurement introduced; UI/models/docs state limits. |
| 17. No duplicate scoring engine | LOCALLY VERIFIED | Existing checklistScores/websiteScores remain; no added check IDs or semantic score. |
| 18. No fake/demo production data introduced | LOCALLY VERIFIED | New synthetic inputs are tests only; existing SAMPLE preserved; actual reports derive from captured source. |
| 19. Existing functionality remains intact | LOCAL REGRESSIONS PASS; E2E NOT VERIFIED | Project/access/history/snapshot/adapter/report/cross-page regressions pass; auth/Turso/browser/live crawl acceptance still pending. |
| 20. Tests cover behavior | LOCALLY VERIFIED | 36 new tests over22 requested fixtures,42 existing accuracy cases, three pinned current goldens,10 regression harnesses, adapter and6 sizes. |

## Known limitations and remaining current-phase work

1. Execute current-branch interactive keyboard/focus/expansion/tab/filter/pagination/mobile/zoom/download/new-tab/re-audit/history workflows in a real browser. Browser rendering is not established by SSR assertions.
2. Verify real GitHub login/logout/expiry and actual Turso migration/persistence/transactions/project switching/refresh/relogin and tenant roles/invites/removal/ownership transfer. Local SQL fixtures are not provider or production tests.
3. Run controlled real10/25/50/100/127/200-page crawls with blocked/timeout/partial cases; reconcile coverage, elapsed time, memory, storage and recovery. Offline performance is not a crawl result.
4. Close unchanged full-lint 21/33 gate and isolate hosting-target generated declarations. This sprint did not suppress diagnostics or modify production config; unrelated lint fixes remain outside its scope.
5. Resolve existing archived-project mutation policy and public audit quota/rate/concurrency/aggregate request-budget/security acceptance identified in the post-Phase2 audit. This sprint does not certify those policies or claim a new exploit.
6. Source heuristics cannot establish semantic answer correctness/completeness, attribution authenticity, true freshness, factual citation support or entity recognition. Bounded English/context vocabularies and ISO-like date grammar are deliberate limits; supported formats/terms can be expanded only with evidence and fixtures.
7. Unknown/tied attempt times use an explicit deterministic policy; no historical timestamp is invented. Old snapshots lack complete new signal records; they remain immutable and may show unavailable source fields. Engine upgrade comparison requires a new compatible baseline.

No new product module is needed to close these items. No external search/AI visibility integration is implied by the existing 29 checks. No production acceptance or deployment approval is granted by this document.

## Requested completion summary

AEO IMPROVEMENTS:6 groups — shared questions; normalized candidate/evidence/location/distance; format/direct/weak cues; supporting explanation/links/attribution; completeness/clarity review; UI/intelligence/export connection.

GEO IMPROVEMENTS:4 groups — typed context/entity model; evidence from declared and visible sources; calibrated detection confidence; shared valid/invalid/conflicting freshness.

SEO IMPROVEMENTS:5 groups — canonical classification; existing bounded target verification; explicit link outcomes; phrase/href/title accuracy; latest-attempt timestamp policy.

EVIDENCE IMPROVEMENTS:5 groups — consistent finding projection; seven-part explanation; readable destination/canonical/asset fields; schema graph/type/context/parse status; technical disclosure and escaped source.

REPORTING IMPROVEMENTS:6 groups — explained priorities; distinct aggregation metrics; coverage; score context; verified history/comparison transitions; all-format identity/projection parity including frozen export.

TESTS ADDED:36 named tests;22 scenario fixtures;1 reviewed current golden file.

TESTS PASSED:36 new tests;42 existing accuracy cases;1 adapter test;10 regression harnesses;6 offline size fixtures. TypeScript after Vercel and both hosting builds pass.

KNOWN LIMITATIONS:source-only deterministic heuristics; bounded vocabulary/date/output; actual browser/provider/remote database/crawl acceptance outstanding; unchanged lint and cross-target generated types gate.

REMAINING CURRENT-PHASE WORK:the seven acceptance/quality items above, before deployment or claiming end-to-end completion.

FINAL VERDICT:

**SEO/AEO/GEO COMPLETION STATUS: PARTIALLY COMPLETE**
