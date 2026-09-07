# Hide and Seek Hong Kong

A private, mobile-first companion website for a two-hiders-versus-two-seekers
transit hide and seek game in Hong Kong.

The application is in its early foundation stage. Its planned features include
a Hong Kong transit map, role-specific game boards, question tracking, timers,
and manual physical-card reward logging. See [PROJECT_PLAN.md](./PROJECT_PLAN.md)
for the living project checklist.

Use [WORKSPACE_HANDOFF.md](./WORKSPACE_HANDOFF.md) to resume work after a
development session. It records the verified repository state, validation
results, open setup issues, current branch, pull request status, and next task.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available commands

- `npm run dev` - start the development server.
- `npm run lint` - run the ESLint checks.
- `npm run build` - create a production build.
- `npm run start` - run the production build.

## Supabase setup

The schema and access policies are defined in
[`supabase/migrations/`](./supabase/migrations/). Create a Supabase project,
then copy `.env.example` to `.env.local` and fill in its project URL and
publishable key. Do not commit `.env.local`.

For local Supabase development, review `supabase/config.toml` before running a
database reset. It currently enables `supabase/seed.sql`, but that seed file is
not present yet.

To apply the migration to a linked project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Technology

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Supabase for authentication, PostgreSQL, row-level security, and real-time
  updates

## GitHub Workflow

Keep `main` as the integration branch. Create one focused branch from the
latest merged `main` for each major change, open a pull request, run the
focused checks plus `npm run lint` and `npm run build`, and review the complete
diff before merging. Start the next major change only after the previous pull
request has been approved and merged.

Before ending a session, update [WORKSPACE_HANDOFF.md](./WORKSPACE_HANDOFF.md)
with the current branch, commit, files changed, validation results, migration
status, pull request status, known issues, and the next action. Never record
credentials or secret values there.
