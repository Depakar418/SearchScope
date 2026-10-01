# SearchScope

A private, single-page SEO/AEO/GEO audit workspace built with React, TypeScript, Vinext and a Cloudflare Workers-compatible API.

## Use

1. Open the published application and choose **Try a sample audit**.
2. Expand a finding to inspect its evidence and suggested action.
3. Enter a public website URL or select **Paste HTML** / **Paste text**.
4. Optionally set a target phrase, run the analysis and filter **Needs attention**.
5. Export CSV for a task list or JSON for the full report. Reports are session-only; export before leaving.

## Release 1.1.0

The app now exposes 29 applicable/conditional checks, separate error/warning/opportunity totals, a fix-first plan, detailed per-finding guidance and detailed CSV/Markdown/JSON exports.

The feature inventory and release history live in `lib/releases.ts` and the application’s **Features & development** view. Update that source for each release and run `node scripts/generate-development-doc.mjs` to refresh the downloadable `public/SearchScope-Development-Log.md`. Record added, changed, removed, validation and remaining limitations honestly.

## Current capabilities

- Public single-page initial-HTML retrieval, with robots.txt handling, timeouts, public-DNS validation, redirect checks and bounded response bodies.
- HTML/text analysis; metadata, headings, image alt attributes, robots directives, JSON-LD syntax, content structure, attribution/source/date signals.
- Transparent evidence and equal-weight checklist scores (pass=1, review=.5, fail=0; unavailable excluded).
- Responsive interface, category filtering, finding search, heading outline, CSV and JSON exports.
- Optional browser WebMCP action `run_page_audit` when the browser exposes the API. Browser/WebMCP integration could not be exercised in the build session.

## Limits

This is an initial audit release, not feature parity with Semrush, Ahrefs, Screaming Frog or GTmetrix. It does not crawl a whole site, render JavaScript, verify links, access private pages, persist project history, or modify websites. Extraction uses a lightweight HTML scan and can misinterpret unusual or malformed markup. Plain text cannot establish page metadata or technical SEO status. JSON-LD parsing does not validate schema semantics or rich-result eligibility. AEO/GEO checks are editorial heuristics and require human judgment. No rank, AI inclusion or citation guarantee is made.

Keyword volumes, backlinks, ranks, Search Console data, field performance, and measured AI citations require separate providers and integrations. Fetch duration is not a Core Web Vitals measurement. Public-DNS preflight rejects known private/reserved destinations; deployment fetch protections remain part of the security boundary.

## Validate

- `node scripts/audit-checks.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- Sites build workflow (Cloudflare Worker bundle)

The fixture tests include successful URL audits with mocked public responses, text exclusions, invalid and graph JSON-LD, robots groups, unsafe URLs/DNS, indexing headers, redirects, oversized pages and invalid input. They do not prove that every remote website is reachable. Live results depend on the website's access controls and connectivity.
