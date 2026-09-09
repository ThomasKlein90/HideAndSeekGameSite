# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-09
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `feature/game-audit-trail`
- Baseline commit: `d1d2479` (merged host phase controls)
- Previous pull requests: #4, #5, #6, and #7, all reviewed and merged
- Product stage: Foundation and game setup

## Implemented

- Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and Supabase.
- Email magic-link authentication.
- Host game creation with initial team selection and game-code generation.
- Game-code joining.
- Host assignment of up to two players per team.
- Authenticated player display-name editing.
- Placeholder seeker question catalogue with Matching, Measuring, Thermometer, Radar, Tentacles, and Photos categories.
- Question-event data model with statuses, answer timestamps, reward notes, and row-level access policies.
- Supabase migrations and row-level access policies for the current setup flow.

## Previous Branch Change

The documentation branch `chore/document-workspace-state` was reviewed and
merged into `main` as PR #4.

- Added `.env.example` with placeholder values only.
- Added this handoff record.
- Added the pull-request checklist at `.github/pull_request_template.md`.
- Updated the README and project plan with setup and branch workflow guidance.

## Completed This Session

PR #7, `feat: add question event data model`, was reviewed and merged. The
feature branch was deleted after merge.

- Merged commit: `c7b36b0`.
- Migration: `supabase/migrations/20260907100000_question_events.sql`.
- Types: `src/lib/supabase/database.types.ts`.
- The migration has not yet been applied to a local or linked Supabase project.

## Known Setup Gaps

- `.env.local` must be created locally from `.env.example` and filled with the Supabase project URL and publishable key. Never commit it.
- `supabase/config.toml` enables `./seed.sql`, but `supabase/seed.sql` is not currently present. Verify local `supabase db reset` behavior before choosing whether to add a seed file or disable seeding.
- No automated test suite or database type-generation script is currently defined.
- The linked Supabase project and local Supabase CLI availability still need to be confirmed.

## Validation

- `git status --short --branch`: main was clean after the feature merge.
- Workspace diagnostics for `src/lib/supabase/database.types.ts`: passed.
- `git diff --check`: passed before the feature merge.
- `npm run lint`: blocked because `npm` is not available in the current PowerShell PATH.
- `npm run build`: blocked because `npm` is not available in the current PowerShell PATH.
- Migration application: not yet applied to a local or linked Supabase project.
- Manual question-event validation: pending Supabase configuration.
- Current seeker-answer-history diff: `git diff --check` passed.
- Current question-round-history diff: `git diff --check` passed.

## Current Development Slice

The seeker submission, Hider Team answer workflow, and seeker answer-history
slices are merged into `main`. Round-history persistence and duplicate question protection were merged into
`main` as PRs #10 and #11. Seeker-only map annotations are now being
implemented on `feature/seeker-map-annotations`.

- Hider players can load pending question events for their game and submit
  answers with the template's expected answer control.
- Answer submissions set the event to `answered`, record the answering player
  and timestamp, and optionally record a physical-card reward note.
- Seekers can review answered question events for their game, including the
  answer timestamp and optional reward note, and manually refresh the history.
- Joined players refresh their assigned team after joining, allowing the Hider
  Team view to render when assignment is already available.
- Realtime updates remain a future slice.
- A unique database index prevents the same active question template from being
  submitted twice in one round; cancelled events remain resubmittable.
- The existing host update policy preserves an admin correction path.
- Seekers can create, view, and delete private note, pin, and eliminated-area
  annotations scoped to their current game and round.
- Hiders can log physical cards and move cards between held, used, and expired
  states.
- The question-events migration is still not applied to a configured Supabase
  environment.

The next session should validate audit-log privacy/persistence against Supabase,
then implement final-hiding reference points or the seeker-status panel.

## Start-Of-Session Procedure

1. Open the repository at the workspace root.
2. Read this file, [PROJECT_PLAN.md](PROJECT_PLAN.md), and the repository instructions.
3. Confirm the current branch and worktree are clean.
4. Update from `origin/main` before starting a new major change.
5. Create a focused branch from the updated `main`.
6. Confirm the exact next task and the validation command before editing.

The current session branch is `feature/seeker-map-annotations`, created from
merged `main` commit `69f5148`.

## Resume In Agent Window

1. Open this repository folder in VS Code.
2. Open Copilot Chat and select **Agent** mode, not Plan mode.
3. Start from the clean `main` branch and update it from `origin/main`.
4. Read this file, `PROJECT_PLAN.md`, `AGENTS.md`, and `.github/copilot-instructions.md`.
5. Create `feature/seeker-question-submission` from updated `main`.
6. Send this message in the Agent window:

	`Resume from WORKSPACE_HANDOFF.md. Confirm the merged main baseline, create or verify feature/seeker-question-submission, and implement only the next documented slice. Check the relevant Next.js guidance before editing.`

The Agent should confirm the branch, baseline commit, clean worktree, next task,
and first validation command before changing code.

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
