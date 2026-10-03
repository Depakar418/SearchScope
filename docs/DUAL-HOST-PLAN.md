# SearchScope: Git + Vercel + Sites

Status: architecture and migration plan, 2026-10-03. Vercel is **not deployed**. The existing Sites deployment remains the only hosted SearchScope application.

## Roles

| System | Purpose | Source of truth |
| --- | --- | --- |
| Private Git repository | Source version history, reviews and rollback point | Application source and database migrations only; never credentials or user records |
| Vercel | Intended production host | Tested production branch of the Git repository |
| ChatGPT Sites | Existing demo and local development companion | A separate Sites deployment from a reviewed commit; never the production database |

Git does not back up the production database. Schedule provider-managed database backups and periodically verify an export and restore before decommissioning the Sites D1 data. Avoid putting audit records or account data in Git.

## Existing dependencies to replace for Vercel

1. `package.json`, `vite.config.ts`, `build/sites-worker.ts` and the `scripts/run-framework.mjs` build target use Vinext/Cloudflare Workers. Build a separate native Next.js target for Vercel. Preserve the Sites target while the migration is validated.
2. `db/index.ts` imports `env` from `cloudflare:workers` and returns a D1 binding. Introduce a database interface with independent Sites and production adapters. Select a Vercel-compatible database, migrate the schema and real data, then reconcile row counts and foreign keys. Do not point both hosts at the same writable database by default.
3. `app/chatgpt-auth.ts` and `lib/accounts.ts` trust Sites-injected `oai-authenticated-user-*` headers; `/signin-with-chatgpt` and `/signout-with-chatgpt` are Sites paths. On Vercel, use an independently configured identity provider, signed server-side sessions, and stable internal user IDs. Strip/ignore client-supplied identity headers at the boundary. Map existing user/project memberships only through a verified identity migration; never match ownership on an unverified email alone.
4. API routes and server pages that read the D1 adapter or Sites identity must use the new abstractions. Keep all project authorization checks on the server.
5. The current browser-driven page queue requires an open tab. Validate 127–200 page runs and request timeouts on Vercel; introduce a durable job worker if production audits must continue after the tab closes.

## Ordered migration

1. Commit the current passing changes on a review branch after excluding generated output, secrets and local state. Connect a private Git remote; enable protected production branch and preview deployments.
2. Add the Vercel runtime and database adapter without removing Sites. Run unit/integration tests against both adapters and the native Next.js build.
3. Configure production identity, database and secrets within Vercel. Keep separate preview/demo/production credentials and datasets.
4. Export the Sites D1 database through an authorized Sites/Cloudflare data path, back it up, import it into the new production database, and verify account, project, audit, page, revision and evidence counts. Test project ownership and IDOR protections with real migrated accounts.
5. Deploy a Vercel preview from Git. Test sign-in, project access, audit creation, crawling, single-page rerun, history, exports, 25-page and 200-page limits. Review resource usage and mobile UI.
6. Promote the tested commit to Vercel production. Keep the old Site intact during verification. Only then announce the Vercel link as production.
7. Deploy future reviewed commits to the Sites demo separately through the approved Sites Save version → Deploy flow. A Git push alone does not automatically update Sites.

## Release rules

- A production Git push or merge triggers Vercel's configured deployment; preview branches receive separate preview URLs. Verify the deployed commit and rollback path.
- Use anonymized/synthetic demo data in Sites when sharing a demo. The current Sites deployment has its own real D1 history and sign-in flow; it is not automatically a safe public demo.
- A Vercel URL does not override application authentication. Decide whether the landing/demo view is public while project workspaces stay private.
- Hosting changes do not remove this ChatGPT execution environment's approval restrictions. Vercel and its database also enforce their own build, runtime, access and usage limits.

## Information needed for the deployment stage

- Git provider/repository under the user's account, and Vercel account/team connection.
- Production database provider and its backup/restore policy.
- Identity provider choice and the intended public-versus-signed-in pages.
- Authorized export of existing Sites D1 records if historical reports must move.

Do not claim the migration complete or remove Sites until a live Vercel deployment passes the release checks.
