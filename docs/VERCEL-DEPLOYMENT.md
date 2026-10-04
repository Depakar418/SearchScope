# Vercel migration candidate

This branch adds a native Next.js build for Vercel. The Sites build remains `pnpm build` on `main`. A successful Vercel build does **not** migrate the Sites D1 database or its ChatGPT account IDs.

## Why the imported `main` failed

`pnpm build` invokes Vinext and outputs a Cloudflare Worker, not Next.js's `.next/routes-manifest.json`. Vercel imported it with the Next.js preset and expected `.next`. This branch provides `vercel.json` and `pnpm build:vercel`; do not set the Vercel Output Directory manually.

## Required services

1. Create a Turso database for production and enable backups. Connect it to the Vercel project, or add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel Production (and separate credentials for Preview). Keep tokens out of Git.
2. Create a **GitHub OAuth App** with the final Vercel production URL as Homepage URL and `https://YOUR-DOMAIN/api/auth/callback/github` as Authorization callback URL. Add `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` to Vercel. Generate a random `AUTH_SECRET` and add it to each environment. Use a separate OAuth app or callback URL for Preview if testing sign-in there.
3. Apply the existing SQLite schema to the **empty** Turso database with `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate:vercel` from a trusted terminal. The script refuses a database with untracked tables; it does not copy account or audit records.
4. In Vercel Project Settings, use Framework Preset **Next.js**, Root Directory `./`, Build Command `pnpm build:vercel` (or leave the project override empty to use `vercel.json`), and leave Output Directory at the Next.js default. The production branch remains `main` until the preview and data migration are verified.

## Existing data and ownership

The Sites D1 database and account IDs are independent of the new Turso database and GitHub identities. A fresh Vercel deployment starts empty. Do **not** copy D1 rows into Turso and assume GitHub users own them; the IDs differ. Export D1 with an authorized database export, make an encrypted backup, explicitly map each Sites account ID to a verified GitHub provider ID, and reconcile row counts, foreign keys, projects, memberships, audits, revisions, evidence and history. The app never guesses this mapping from email. Keep the Sites version and D1 data intact until the import and access tests pass.

## Release checks

- `pnpm build:vercel` must create `.next/routes-manifest.json`.
- Check unauthenticated and forged `oai-authenticated-user-id` requests cannot read project APIs.
- Sign in through GitHub; verify owner, invited member and unrelated user access separately.
- Run a small audit, inspect evidence and rerun a page. Verify stored history after deployment.
- Then test 25 and 100 page crawls against Vercel duration and rate limits; the current audit queue is browser-driven and needs an open tab.
- Only promote the tested branch to `main` and production after historical data and access checks pass.

The Sites demo is deployed separately through its supported Save version → Deploy version flow. Git pushes to Vercel do not update Sites.
