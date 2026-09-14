# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-14
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/rls-helpers-and-game-session-restore`
- Baseline commit: `5f66903` (merged database status update, PR #16)
- Product stage: RLS helper functions & join_game fix, active game session reload restore, and migration 20260914090000.

## Implemented

- Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and Supabase.
- Email magic-link authentication.
- Host game creation with initial team selection and game-code generation.
- Game-code joining.
- Host assignment of up to two players per team.
- Authenticated player display-name editing.
- Placeholder seeker question catalogue with Matching, Measuring, Thermometer, Radar, Tentacles, and Photos categories.
- Question-event data model with statuses, answer timestamps, reward notes, and row-level access policies.
- Seeker private map annotations (notes, pins, eliminated areas).
- Hider physical card log and hand management.
- Shared current-round dashboard with timer, phase display, host transition controls, and append-only audit trail.
- Active game session restore on page reload and switch/leave game control.
- Remote Supabase database (project `gthvxhakvehnrvvzcglh`) with PL/pgSQL SECURITY DEFINER helper functions, join_game disambiguation, and seeker annotation policy updates.

## Previous Branch Change

The documentation branch `chore/document-workspace-state` was reviewed and
merged into `main` as PR #4.

- Added `.env.example` with placeholder values only.
- Added this handoff record.
- Added the pull-request checklist at `.github/pull_request_template.md`.
- Updated the README and project plan with setup and branch workflow guidance.

## Completed This Session

PRs #12 through #15 were reviewed and merged:

- PR #12: seeker annotations and Hider physical-card log.
- PR #13: shared current-round dashboard with hider timer and final-hiding radius.
- PR #14: server-validated host phase controls.
- PR #15: append-only host phase-transition audit trail.
- Node.js 24.19.0 LTS and npm 11.17.0 were installed with WinGet.
- `npm ci`, `npm run lint`, and `npm run build` now complete successfully.

## Known Setup Gaps

- `.env.local` must be created locally from `.env.example` and filled with the Supabase project URL and publishable key. Never commit it.
- `supabase/config.toml` enables `./seed.sql`, but `supabase/seed.sql` is not currently present. Verify local `supabase db reset` behavior before choosing whether to add a seed file or disable seeding.
- No automated test suite or database type-generation script is currently defined.
- The worktree is linked to Supabase project `gthvxhakvehnrvvzcglh` through `supabase/.temp/linked-project.json`.
- Supabase CLI access requires a temporary TLS workaround because the network HTTPS inspection certificate is not trusted by Node: `NODE_TLS_REJECT_UNAUTHORIZED=0`. Prefer installing the organization root certificate and using `NODE_EXTRA_CA_CERTS` when available.
- Remote database migration commands also require `SUPABASE_DB_PASSWORD` in the terminal session. The password must never be committed or pasted into chat. Rotate any password exposed during setup before resuming.

## Validation

- `npm run lint`: passed cleanly.
- `npm run build`: passed cleanly.
- `git diff --check`: passed.
- Remote database migrations: All 12 migrations (enums, tables, RLS policies, indexes, RPC function, triggers) successfully executed on Supabase project `gthvxhakvehnrvvzcglh` via Dashboard SQL editor.

## Current Development Slice

All Phase 1 and Phase 3/4 baseline question event, seeker annotation, hider card log, timer, phase control, and audit trail slices are implemented and merged into `main`. The remote database schema is fully up to date.

Next available slices from `PROJECT_PLAN.md`:
1. Phase 4 - Final hiding radius display and reference hiding point marker.
2. Phase 2 - Hong Kong Interactive Base Map (Leaflet / OpenStreetMap / MTR transit layers).

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm the current branch and worktree are clean.
4. Update from `origin/main` before starting a new major change.
5. Create a focused branch from the updated `main`.
6. Confirm the exact next task and the validation command before editing.

## Resume In Agent Window

1. Open this repository folder in VS Code.
2. Open Copilot Chat and select **Agent** mode, not Plan mode.
3. Start from the clean `main` branch and update it from `origin/main`.
4. Read this file, `PROJECT_PLAN.md`, `AGENTS.md`, and `.github/copilot-instructions.md`.
5. Check the relevant installed Next.js guidance in `node_modules/next/dist/docs/` before editing application code.
6. Start a fresh PowerShell terminal and add the installed Node directory to the terminal PATH if required:

	`$nodeDir="C:\Users\tklein2\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"; $env:PATH="$nodeDir;$env:PATH"`

7. For the remote Supabase commands only, set a rotated database password in the terminal and use the temporary TLS workaround:

	`$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; $env:SUPABASE_DB_PASSWORD="<rotated password>"; npx.cmd supabase migration list`

8. If the migration list succeeds, inspect local versus remote versions, then run `npx.cmd supabase db push` only after confirming the pending migrations. Re-run `npx.cmd supabase migration list` after the push.
9. Clear the temporary values immediately afterward:

	`Remove-Item Env:NODE_TLS_REJECT_UNAUTHORIZED; Remove-Item Env:SUPABASE_DB_PASSWORD`

10. Validate migrations and RLS using separate authenticated host, hider, and seeker accounts. At minimum verify: game creation produces round 1; seeker annotations are private; Hider card logs are Hider-only; question submission/answering permissions work; phase transitions are host-only and write audit entries.
11. Run `npm run lint`, `npm run build`, and `git diff --check` before a new feature branch or PR.

### Copy-ready restart prompt

`Resume from WORKSPACE_HANDOFF.md. Confirm origin/main is at merged PR #15 or later, switch to an updated clean main branch, and do not start a new product feature yet. First use the linked Supabase project gthvxhakvehnrvvzcglh to inspect and safely apply the pending migrations. Node is installed but may need the documented WinGet Node directory prepended to PATH; use npx.cmd in PowerShell. The CLI requires the documented temporary TLS bypass due to an untrusted network inspection certificate, and a rotated SUPABASE_DB_PASSWORD set only in the terminal. Never print or paste secrets. After migration application, validate key RLS behavior with separate host/hider/seeker accounts, run npm run lint and npm run build, then report results and propose the next Project Plan slice. Check the relevant Next.js guidance before any application-code edits.`

## End-Of-Session Checklist

1. Update `Last verified`, `Working branch`, and baseline/current commit.
2. Record completed work and the files changed.
3. Record lint, build, test, and manual validation results.
4. Record migration status, including whether migrations were only created or also applied.
5. Record known problems and the single best next action.
6. Record the pull-request URL and status, or state `Not opened yet`.
7. Confirm no credentials, keys, or machine-specific secrets were added.

Before ending a session, leave the worktree either clean on `main` after a
merged pull request or clearly marked on the active feature branch with its
commit and pull-request status.

## Branch And Review Policy

- Keep `main` as the integration branch.
- Create one focused branch from the latest merged `main` for each major change.
- Open a pull request for every branch and use the repository pull-request checklist.
- Run focused checks plus `npm run lint` and `npm run build` before review.
- Review application code, migrations, generated types, and the final diff.
- Merge only after approval and passing checks.
- Start the next major branch from the updated `main` after merge.
