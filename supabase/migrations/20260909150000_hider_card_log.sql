create type public.card_log_status as enum (
  'held',
  'used',
  'expired'
);

create table public.hider_card_log (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  round_id uuid references public.rounds (id) on delete set null,
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  card_name text not null check (char_length(card_name) between 1 and 100),
  status public.card_log_status not null default 'held',
  note text not null default '' check (char_length(note) <= 300),
  received_at timestamptz not null default now(),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'held') = (used_at is null))
);

create index hider_card_log_game_status_idx
  on public.hider_card_log (game_id, status, received_at desc);

create trigger hider_card_log_set_updated_at
before update on public.hider_card_log
for each row execute procedure public.set_updated_at();

alter table public.hider_card_log enable row level security;

create policy "Hiders can view card logs"
on public.hider_card_log for select
to authenticated
using (
  exists (
    select 1
    from public.game_players
    where game_id = hider_card_log.game_id
      and user_id = auth.uid()
      and team = 'hiders'
  )
);

create policy "Hiders can create card logs"
on public.hider_card_log for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and exists (
    select 1
    from public.game_players
    where game_id = hider_card_log.game_id
      and user_id = auth.uid()
      and team = 'hiders'
  )
);

create policy "Hiders can update card logs"
on public.hider_card_log for update
to authenticated
using (
  exists (
    select 1
    from public.game_players
    where game_id = hider_card_log.game_id
      and user_id = auth.uid()
      and team = 'hiders'
  )
)
with check (
  exists (
    select 1
    from public.game_players
    where game_id = hider_card_log.game_id
      and user_id = auth.uid()
      and team = 'hiders'
  )
);

create policy "Hiders can delete card logs"
on public.hider_card_log for delete
to authenticated
using (
  exists (
    select 1
    from public.game_players
    where game_id = hider_card_log.game_id
      and user_id = auth.uid()
      and team = 'hiders'
  )
);
