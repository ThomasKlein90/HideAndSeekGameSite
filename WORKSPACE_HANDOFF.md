# Workspace Handoff

This file is the short operational record for resuming work after a Copilot session. Update it before ending each session and after each major branch is merged.

## Current Snapshot

- Last verified: 2026-09-07
- Repository: `ThomasKlein90/HideAndSeekGameSite`
- Integration branch: `main`
- Working branch: `chore/document-workspace-state`
- Starting commit: `38e9926` (`Merge pull request #3 from ThomasKlein90/agents/game-setup-flow`)
- Pull request: Not opened yet
- Product stage: Foundation and game setup

## Implemented

- Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and Supabase.
- Email magic-link authentication.
- Host game creation with initial team selection and game-code generation.
- Game-code joining.
- Host assignment of up to two players per team.
- Placeholder seeker question catalogue with Matching, Measuring, Thermometer, Radar, Tentacles, and Photos categories.
- Supabase migrations and row-level access policies for the current setup flow.

## Current Branch Change

This branch documents the workspace and establishes the repeatable handoff process.

- Added `.env.example` with placeholder values only.
- Added this handoff record.
- Added the pull-request checklist at `.github/pull_request_template.md`.
- Updated the README and project plan with setup and branch workflow guidance.

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

After this branch is reviewed and merged, create `feature/player-display-names` from the updated `main`. Implement display-name editing after email sign-in, validate it, and merge that branch before beginning question-event work.

## End-Of-Session Checklist

1. Update `Last verified`, `Working branch`, and starting/current commit.
2. Record completed work and the files changed.
3. Record lint, build, test, and manual validation results.
4. Record migration status, including whether migrations were only created or also applied.
5. Record known problems and the single best next action.
6. Record the pull-request URL and status, or state `Not opened yet`.
7. Confirm no credentials, keys, or machine-specific secrets were added.

## Branch And Review Policy

- Keep `main` as the integration branch.
- Create one focused branch from the latest merged `main` for each major change.
- Open a pull request for every branch and use the repository pull-request checklist.
- Run focused checks plus `npm run lint` and `npm run build` before review.
- Review application code, migrations, generated types, and the final diff.
- Merge only after approval and passing checks.
- Start the next major branch from the updated `main` after merge.
