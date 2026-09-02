# Hide and Seek Hong Kong

A private, mobile-first companion website for a two-hiders-versus-two-seekers
transit hide and seek game in Hong Kong.

The application is in its early foundation stage. Its planned features include
a Hong Kong transit map, role-specific game boards, question tracking, timers,
and manual physical-card reward logging. See [PROJECT_PLAN.md](./PROJECT_PLAN.md)
for the living project checklist.

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
