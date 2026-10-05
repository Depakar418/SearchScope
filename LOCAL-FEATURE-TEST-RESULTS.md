# Local feature testing and sign-in update

Date: 5 October 2026. Project: SearchScope. Branch: seo-aeo-geo-completion.

## Result

Local testing no longer needs GitHub sign-in. Run:

```bash
npm run dev:local
```

Open http://127.0.0.1:3000. The app identifies the local testing account and displays a test-mode banner. The command creates/migrates a local SQLite database using the existing libSQL adapter. Local projects, reports and profile data persist in `.searchscope-local/testing.db`. No Supabase account, OAuth credentials or remote database credentials are required for this mode. Stop with Ctrl+C.

This change is local and has not been pushed or deployed to Vercel. Your existing Windows checkout needs these changes before this command is available.

## Confirmed checks

| Check | Result | Scope |
| --- | --- | --- |
| Automated tests | 40 passed, 0 failed | 36 completion tests, 3 local authentication tests, 1 database adapter/rollback test |
| Audit accuracy suite | 42 cases passed | All 29 stable check IDs; pinned scores; evidence; exports; immutable history; latest-attempt comparisons |
| Feature scripts | All 10 passed | Audit engine, foundation, project/account permissions, report rendering, unified reports, tabs, project view, website aggregation, evidence context, cross-page dashboard |
| Local HTTP workflow | 20 requests passed | Account access, identity spoof rejection, root/profile/project page rendering, profile update and invalid timezone rejection, project creation/list/read/update/duplicate rejection/archive/restore, audit-history list, missing project rejection, cross-origin mutation rejection |
| Production HTTP safeguard | Passed | Built production server with Vercel marker and local-test flag still returns 401 for unauthenticated and forged-header account requests; GitHub sign-in remains available |
| Native Next.js/Vercel build | Passed | `node scripts/vercel-build.mjs` |
| TypeScript | Passed | `tsc --noEmit` after native build |
| Focused lint | Passed | Local authentication module, proxy, startup script, tests, layout, account menu, sign-in/out pages, adapter and migration script |
| Whitespace check | Passed | `git diff --check` |

The local integration check follows the sign-in redirect and reaches the profile without a GitHub session. Test projects created by that check are archived in the local testing database. They have no production effect. Schema initialization applies all eight existing migrations and tracks them to avoid reapplying migrations on restart.

## Implemented safeguards

- Explicit local-test flag plus development mode are required.
- Production, test environment and Vercel disable local identity access.
- The local startup command refuses production/Vercel and binds to loopback.
- Client-supplied identity headers cannot choose another account.
- Local mode uses a fixed account, not an arbitrary browser-provided identity.
- Existing project access, validation and cross-origin checks remain active.
- SQLite connection support is limited to local test mode; hosted deployments retain the Turso configuration requirements.
- Test data is ignored by git. No production data or credentials are copied.
- Sign-in redirects use the existing safe relative-return-path validation.

## What is not yet fully tested

These are automated, rendering and actual local HTTP tests. They do not establish that every interactive browser workflow, keyboard interaction or mobile layout has been exercised. Full browser click-through QA remains outstanding. Live website crawling under real network conditions, real GitHub OAuth, remote Turso persistence and multiple real-user invitation workflows remain outside this local verification. Existing automated account/project permission and invitation tests pass, but the single local account is not a substitute for a live multi-user test.

Google login, email/password or email-link login, and Supabase have not been added. They require a separate authentication/provider configuration. No database migration to Supabase was performed. Existing lint debt across the full repository is not resolved by the focused checks above.

## Re-run checks

```bash
npm run test:local-auth
npm run test:completion
npm run test:phase2
npm run test:vercel-db
node scripts/project-checks.mjs
npm run build:vercel
```

To use a different local port, set `SEARCHSCOPE_LOCAL_PORT` before `npm run dev:local`; the default is 3000. The original development and deployment commands continue to use normal authentication.
