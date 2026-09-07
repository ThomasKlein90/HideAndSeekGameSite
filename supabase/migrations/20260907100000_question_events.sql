create type public.question_event_status as enum (
  'pending',
  'answered',
  'cancelled'
);

create table public.question_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  round_id uuid references public.rounds (id) on delete set null,
  question_template_id uuid not null references public.question_templates (id) on delete restrict,
  asked_by uuid not null references public.profiles (id) on delete restrict,
  status public.question_event_status not null default 'pending',
  answer text,
  answered_by uuid references public.profiles (id) on delete set null,
  answered_at timestamptz,
  reward_note text,
  reward_logged_by uuid references public.profiles (id) on delete set null,
  reward_logged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      status = 'pending'
      and answer is null
      and answered_by is null
      and answered_at is null
    )
    or (
      status = 'answered'
      and answer is not null
      and answered_by is not null
      and answered_at is not null
    )
    or status = 'cancelled'
  ),
  check ((answered_at is null) = (answered_by is null)),
  check ((reward_logged_at is null) = (reward_logged_by is null))
);

create index question_events_game_id_created_at_idx
  on public.question_events (game_id, created_at);

create index question_events_round_id_idx
  on public.question_events (round_id);

create trigger question_events_set_updated_at
before update on public.question_events
for each row execute procedure public.set_updated_at();

alter table public.question_events enable row level security;

create policy "Game members can view question events"
on public.question_events for select
to authenticated
using (public.is_game_member(game_id));

create policy "Seekers can create question events"
on public.question_events for insert
to authenticated
with check (
  asked_by = auth.uid()
  and exists (
    select 1
    from public.game_players
    where game_id = question_events.game_id
      and user_id = auth.uid()
      and team = 'seekers'
  )
  and exists (
    select 1
    from public.question_templates
    where id = question_events.question_template_id
      and is_active
  )
);

create policy "Hiders and hosts can update question events"
on public.question_events for update
to authenticated
using (
  exists (
    select 1
    from public.game_players
    where game_id = question_events.game_id
      and user_id = auth.uid()
      and (team = 'hiders' or role = 'host')
  )
)
with check (
  exists (
    select 1
    from public.game_players
    where game_id = question_events.game_id
      and user_id = auth.uid()
      and (team = 'hiders' or role = 'host')
  )
);
