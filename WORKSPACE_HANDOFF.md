# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/player-display-names`
- Baseline commit: `72c394f` (`Merge branch 'chore/document-workspace-state'`)
- Previous pull requests: [#4](https://github.com/ThomasKlein90/HideAndSeekGameSite/pull/4) and the handoff workflow PR, merged
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

This branch adds authenticated display-name editing to the existing game setup
flow.

- Loads the signed-in user's profile display name.
- Validates and saves a trimmed display name between 1 and 50 characters.
- Uses the existing self-update profile policy; no migration was needed.

## Known Setup Gaps

- `.env.local` must be created locally from `.env.example` and filled with the Supabase project URL and publishable key. Never commit it.
- `supabase/config.toml` enables `./seed.sql`, but `supabase/seed.sql` is not currently present. Verify local `supabase db reset` behavior before choosing whether to add a seed file or disable seeding.
- No automated test suite or database type-generation script is currently defined.
- The linked Supabase project and local Supabase CLI availability still need to be confirmed.

## Validation

- `git status --short --branch`: clean at the start of this branch.
- Workspace diagnostics for `src/components/game-setup.tsx`: passed.
- `git diff --check`: pending because the terminal stopped returning output.
- `npm run lint`: blocked because `npm` is not available in the current PowerShell PATH.
- `npm run build`: blocked because `npm` is not available in the current PowerShell PATH.
- Manual display-name validation: pending Supabase configuration.

## Next Development Slice

After this branch is reviewed and merged, create `feature/question-events`
from the updated `main`. Add the question-event migration and matching typed
database contract before implementing seeker submission or hider answers.

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
