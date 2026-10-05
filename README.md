# SearchScope

SearchScope is a project-based SEO/AEO/GEO audit workspace built with React, TypeScript, Vinext and a Cloudflare Workers-compatible API. It audits captured initial HTML, stores project-bound audit runs and page revisions, and presents source evidence for findings.

## Use

1. Sign in with the configured ChatGPT identity and create or open a Website project.
2. Enter its public website URL, choose a page limit and crawl depth, then start an audit. SearchScope discovers URLs from sitemaps and bounded same-origin crawling.
3. Use **Audits** for the selected run's scores, status and coverage; **Pages** for the discovered inventory; **Issues** for findings; and **Cross-page Analysis** for measured page relationships.
4. Open a page report to inspect grouped findings and affected-element evidence. Re-audit one selected page after making a change.
5. Export a report or use History to compare saved runs. Pasted HTML and text reports are session-only.

## Current scope

- The current testing entitlement offers 10, 25, 50, 100 and 200 selected pages. There is no billing integration or paid-plan enforcement.
- Audits use initial HTML. DOM extraction separates main content from navigation, footer, sidebar and hidden content where identifiable. Evidence includes readable identity, section context, source snippets and selectors in technical details.
- The 29 source checks cover metadata, headings, images, links, structured-data syntax and editorial SEO/AEO/GEO signals. Checklist scores describe these measured checks, not rankings, search visibility or AI citations.
- Cross-page Analysis compares duplicate metadata and H1 values, heuristic main-content similarity, internal link relationships and observed canonical destinations. Similarity is a review candidate, not proof of duplicate content or keyword cannibalization.
- Project membership and authorization use stable account IDs and server-side access checks. Hosting and sign-in depend on the configured Sites environment.

## Limits

There is no rendered JavaScript audit or screenshot service. A URL fragment can locate an element only when its captured ID still exists on the live page. Search volume, backlinks, rankings, Search Console, Core Web Vitals and measured AI visibility need external data sources. Live 127-page SucceedLEARN and mobile visual checks have not been completed in this execution environment. A large audit currently requires the browser tab to remain open while the client submits page requests. Publishing the current local build remains subject to the Sites approval workflow.

## Development and validation

The versioned feature inventory and added/changed/removed history are in `lib/releases.ts`. Run `node scripts/generate-development-doc.mjs` to refresh `public/SearchScope-Development-Log.md` after updating the inventory.

The proposed Git/Vercel production and Sites demo split, including authentication and data migration requirements, is documented in `docs/DUAL-HOST-PLAN.md`.

Run `node node_modules/typescript/bin/tsc --noEmit`, `node scripts/audit-checks.mjs`, `node scripts/foundation-checks.mjs`, `node scripts/project-checks.mjs`, `node scripts/project-view-check.mjs`, `node scripts/report-render-check.mjs`, `node scripts/unified-report-check.mjs`, `node scripts/website-aggregation-check.mjs`, `node scripts/evidence-context-check.mjs`, `node scripts/cross-page-dashboard-check.mjs`, and `node scripts/run-framework.mjs build` before publishing.


## Local testing without sign-in

Run `npm run dev:local`, then open http://127.0.0.1:3000. No GitHub account or cloud database credentials are needed. This command applies the existing database migrations to `.searchscope-local/testing.db` and starts the native Next.js development server on loopback with a fixed local test account. The yellow banner identifies test mode. Projects, audit history and profile changes persist in this local database between restarts.

Stop the server with Ctrl+C. The normal development/build/deployment commands do not enable this mode. Test access requires both development mode and the explicit local flag, is restricted to loopback request hosts, and is disabled when a Vercel environment marker is present. Client-supplied identity headers are always replaced. This is one test account; it does not simulate separate users or OAuth sign-in.

If port 3000 is occupied, set `SEARCHSCOPE_LOCAL_PORT` to a free port between 1024 and 65535 before running the command. Local test data is ignored by git and is never copied to a deployment. Google/email sign-in and Supabase have not been configured; the deployed application retains GitHub authentication and its existing Turso adapter.

See [LOCAL-FEATURE-TEST-RESULTS.md](LOCAL-FEATURE-TEST-RESULTS.md) for verification and remaining test gaps.
