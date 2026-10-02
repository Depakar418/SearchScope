# SearchScope account and project access — v1.5.0

## Architecture and identity boundary

SearchScope runs on Sites. The Sites dispatcher handles Sign in with ChatGPT and forwards a stable, Site-scoped authenticated user ID with optional email/name. SearchScope uses that ID for authorization. The email is for display and matching a recipient to a pending invitation; it is never the ownership key. The browser does not send a user ID or role to the server as an authority.

The identity provider handles account creation, credentials, password changes/recovery, email verification, sign-in/out, sessions and any upstream OAuth. SearchScope does not see a password, reset token, OAuth callback or provider session list. It cannot reliably display other signed-in accounts or switch among them without signing out through the provider. The `/profile` Security section explains these limits and how to change identity.

## Relationship and roles

`accounts.id` is the stable platform ID. `project_members` records project ID, user ID and role; `projects.owner` is the authoritative owner ID. Existing owners are recognized immediately and receive a membership row when they open Account. Historical `audit_runs.owner` remains the original audit actor. Authorization of project-bound runs, page reports, revisions and frozen snapshots now follows current project membership; null-project legacy runs stay creator-only.

| Role | Read/export | Run/re-audit | Edit settings | Manage members | Transfer owner |
| --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | All roles | Yes |
| Admin | Yes | Yes | Yes, excluding archive/restore | Editors/Viewers | No |
| Editor | Yes | Yes | No | No | No |
| Viewer | Yes | No | No | No | No |

API checks implement these permissions. The UI also disables or hides inappropriate controls. Membership removal takes effect for all historical project data even if that user originally ran the audit.

## Invitation and transfer flow

Project Settings → Access & members lets an authorized member create an invitation for a recipient email. It expires after seven days and returns a link to share manually. No email is sent. The recipient must sign in with the invited email and type the exact project name to accept. Invalid, revoked, expired or used invitations cannot grant access. An Admin cannot replace or revoke an Owner's Admin/ownership invitation.

Only the current Owner can initiate ownership transfer, after typing the project name and seeing the consequences. A pending transfer does not change ownership. Acceptance by the recipient changes `projects.owner` in a database batch, makes the previous owner an Admin, adds the recipient's Owner membership and records one ownership event. Project ID, run IDs, page reports, revisions, evidence, snapshots, exports and settings remain attached to their original records. A conflicting same-website owner project prevents the transfer before data changes.

Email matching proves only that the Sites dispatcher supplied the invited email for the signed-in account. SearchScope does not claim to perform separate email verification. Pending invitations are visible only to the matching signed-in email, while authorized project managers can see their project's invitation list. Invitation lookup does not disclose whether an arbitrary recipient has a SearchScope account.

## Additive migrations

`0005_modern_quentin_quire.sql` creates `accounts`, `project_members`, `project_invites` and `project_events`. `0006_loose_warpath.sql` adds a per-acceptance nonce to invitations. Both are schema-only and preserve applied migrations `0000` through `0004` and existing audit data. Sites applies these migrations before the Worker release. Existing project owners are authorized through `projects.owner` even before opening the new profile page.

Future changes must append migrations. Do not rewrite previously applied SQL or migrate audit records to the new owner's original user ID: the Project ID and member relationship carry access.

## Routes and UI

- `/profile`: account name, provider email, HTTPS avatar URL, company, timezone, provider-managed security explanation and recipient invitation acceptance.
- `GET/PATCH /api/account`: synchronized identity/profile, provider email read-only.
- `POST /api/account/invitations`: recipient acceptance with invitation status, expiry, actor email, confirmation and current inviter authority checks.
- `GET/POST /api/projects/:id/access`: role-aware members, pending invites, event history, invite/revoke/role/remove/transfer operations.
- Project list and workspace display current role and active account. Account menu gives profile, provider sign-out and account-change guidance.
- Error components handle 400/401/403/404/408/429/500/502/503/504 with plain language. Unknown server failures return a sanitized 500 response. The platform sign-in flow owns its own login/verification/error pages.

## Security and validation

The app stores no passwords, password hashes or password reset/verification tokens. It relies on dispatcher-owned sign-in and forwards no privileged browser-supplied account IDs. Mutating JSON routes check cross-origin browser requests. Public APIs authorize on the server. Unknown failures do not expose database messages or stack traces. Invitation records have random IDs, seven-day expiry, recipient matching, one-use status and acceptance nonce. Tests verify a wrong recipient, wrong confirmation, revoked/expired/replayed links, viewer/editor/admin restrictions, cross-project/removed-user denial, one recorded ownership transfer and byte-for-byte retention of pages, revisions and snapshots.

Validated with real in-memory SQLite and the generated migrations, TypeScript, 29-check audit regressions, rendering checks and the production Worker build. Controlled fixtures are not a live multi-account or mobile browser test. Live provider behavior, keyboard and mobile UI, provider session expiry/revocation, account-switching availability and email delivery must be verified in the relevant platform environment. Account switching and provider recovery are not implemented by SearchScope because Sites exposes one active identity and no password/OAuth/session APIs for an app-owned flow.
