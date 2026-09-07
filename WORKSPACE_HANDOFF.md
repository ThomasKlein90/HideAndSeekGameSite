# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/question-events`
- Baseline commit: `af7c305` (merged player display-name feature)
- Previous pull requests: documentation, handoff workflow, and display-name changes, all merged
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

This branch defines the question-event data model and typed database contract
before adding question submission or answer controls.

- Added `question_event_status` with pending, answered, and cancelled states.
- Added question events linked to games, optional rounds, templates, players,
	answers, answer timestamps, and manually logged reward notes.
- Added row-level policies for member reads, seeker inserts, and hider/host
	updates.
- Updated `database.types.ts` to match the migration.

## Known Setup Gaps

- `.env.local` must be created locally from `.env.example` and filled with the Supabase project URL and publishable key. Never commit it.
- `supabase/config.toml` enables `./seed.sql`, but `supabase/seed.sql` is not currently present. Verify local `supabase db reset` behavior before choosing whether to add a seed file or disable seeding.
- No automated test suite or database type-generation script is currently defined.
- The linked Supabase project and local Supabase CLI availability still need to be confirmed.

## Validation

- `git status --short --branch`: clean at the start of this branch.
- Workspace diagnostics for `src/lib/supabase/database.types.ts`: passed.
- `git diff --check`: passed.
- `npm run lint`: blocked because `npm` is not available in the current PowerShell PATH.
- `npm run build`: blocked because `npm` is not available in the current PowerShell PATH.
- Migration application: not yet applied to a local or linked Supabase project.
- Manual question-event validation: pending Supabase configuration.

## Next Development Slice

Open a pull request for this branch before merging. Review the migration and
typed contract together, then apply the migration in a configured Supabase
environment before implementing UI actions.

After this branch is reviewed and merged, create
`feature/seeker-question-submission` from the updated `main`. Implement seeker
submission and the hider answer workflow against the question-event contract.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm the current branch and worktree are clean.
4. Update from `origin/main` before starting a new major change.
5. Create a focused branch from the updated `main`.
6. Confirm the exact next task and the validation command before editing.

For the next development session, the expected branch is
`feature/seeker-question-submission` and the expected first task is connecting
the seeker board to question-event creation.

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
