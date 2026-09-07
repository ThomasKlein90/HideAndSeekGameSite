# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `chore/clarify-handoff-workflow`
- Baseline commit: `72c394f` (`Merge branch 'chore/document-workspace-state'`)
- Previous pull request: [#4](https://github.com/ThomasKlein90/HideAndSeekGameSite/pull/4), merged
- Product stage: Foundation and game setup

## Implemented

- Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and Supabase.
- Email magic-link authentication.
- Host game creation with initial team selection and game-code generation.
- Game-code joining.
- Host assignment of up to two players per team.
- Placeholder seeker question catalogue with Matching, Measuring, Thermometer, Radar, Tentacles, and Photos categories.
- Supabase migrations and row-level access policies for the current setup flow.

## Previous Branch Change

The documentation branch `chore/document-workspace-state` was reviewed and
merged into `main` as PR #4.

- Added `.env.example` with placeholder values only.
- Added this handoff record.
- Added the pull-request checklist at `.github/pull_request_template.md`.
- Updated the README and project plan with setup and branch workflow guidance.

## Current Branch Change

This branch makes the resume process explicit and corrects the post-merge
status recorded by the previous handoff.

- Updated the baseline to the merged `main` commit.
- Recorded PR #4 as merged.
- Added a fixed start-of-session and end-of-session procedure below.

## Known Setup Gaps

- `.env.local` must be created locally from `.env.example` and filled with the Supabase project URL and publishable key. Never commit it.
- `supabase/config.toml` enables `./seed.sql`, but `supabase/seed.sql` is not currently present. Verify local `supabase db reset` behavior before choosing whether to add a seed file or disable seeding.
- No automated test suite or database type-generation script is currently defined.
- The linked Supabase project and local Supabase CLI availability still need to be confirmed.

## Validation

- `git status --short --branch`: clean at the start of this branch.
- `git diff --check`: passed.
- `npm run lint`: blocked because `npm` is not available in the current PowerShell PATH.
- `npm run build`: blocked because `npm` is not available in the current PowerShell PATH.
- Manual Supabase flow validation: pending Supabase configuration.

## Next Development Slice

After this branch is reviewed and merged, create `feature/player-display-names`
from the updated `main`. Implement display-name editing after email sign-in,
validate it, and merge that branch before beginning question-event work.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm the current branch and worktree are clean.
4. Update from `origin/main` before starting a new major change.
5. Create a focused branch from the updated `main`.
6. Confirm the exact next task and the validation command before editing.

For the next development session, the expected branch is
`feature/player-display-names` and the expected first task is display-name
editing in `src/components/game-setup.tsx`.

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
