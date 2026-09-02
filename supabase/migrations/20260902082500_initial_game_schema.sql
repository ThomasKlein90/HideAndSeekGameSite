create type public.game_team as enum ('hiders', 'seekers');
create type public.game_phase as enum (
  'setup',
  'hider_head_start',
  'active_seeking',
  'final_hiding',
  'round_complete',
  'game_complete'
);
create type public.player_role as enum ('host', 'player');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6}$'),
  phase public.game_phase not null default 'setup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_players (
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  team public.game_team not null,
  role public.player_role not null default 'player',
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create unique index game_players_one_host_per_game
  on public.game_players (game_id)
  where role = 'host';

create table public.game_settings (
  game_id uuid primary key references public.games (id) on delete cascade,
  hider_head_start_seconds integer not null default 900
    check (hider_head_start_seconds between 0 and 7200),
  final_hiding_radius_meters integer not null default 500
    check (final_hiding_radius_meters between 25 and 5000),
  allowed_transit_modes text[] not null default array['mtr', 'tram', 'light_rail', 'ferry'],
  board_boundary jsonb,
  no_go_areas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  number integer not null check (number > 0),
  hiding_team public.game_team not null,
  started_at timestamptz,
  final_hiding_started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_id, number)
);

create index rounds_game_id_idx on public.rounds (game_id);
create index game_players_user_id_idx on public.game_players (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger games_set_updated_at
before update on public.games
for each row execute procedure public.set_updated_at();

create trigger game_settings_set_updated_at
before update on public.game_settings
for each row execute procedure public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Player'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create function public.is_game_host(target_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games
    where id = target_game_id
      and host_id = auth.uid()
  );
$$;

create function public.is_game_member(target_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.game_players
    where game_id = target_game_id
      and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.game_settings enable row level security;
alter table public.rounds enable row level security;

create policy "Profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Game members can view their games"
on public.games for select
to authenticated
using (host_id = auth.uid() or public.is_game_member(id));

create policy "Users can create games they host"
on public.games for insert
to authenticated
with check (host_id = auth.uid());

create policy "Hosts can update games"
on public.games for update
to authenticated
using (host_id = auth.uid())
with check (host_id = auth.uid());

create policy "Hosts can delete games"
on public.games for delete
to authenticated
using (host_id = auth.uid());

create policy "Game participants can view players"
on public.game_players for select
to authenticated
using (public.is_game_host(game_id) or public.is_game_member(game_id));

create policy "Hosts can add players"
on public.game_players for insert
to authenticated
with check (public.is_game_host(game_id));

create policy "Hosts can update players"
on public.game_players for update
to authenticated
using (public.is_game_host(game_id))
with check (public.is_game_host(game_id));

create policy "Hosts can remove players"
on public.game_players for delete
to authenticated
using (public.is_game_host(game_id));

create policy "Game participants can view settings"
on public.game_settings for select
to authenticated
using (public.is_game_host(game_id) or public.is_game_member(game_id));

create policy "Hosts can create settings"
on public.game_settings for insert
to authenticated
with check (public.is_game_host(game_id));

create policy "Hosts can update settings"
on public.game_settings for update
to authenticated
using (public.is_game_host(game_id))
with check (public.is_game_host(game_id));

create policy "Game participants can view rounds"
on public.rounds for select
to authenticated
using (public.is_game_host(game_id) or public.is_game_member(game_id));

create policy "Hosts can create rounds"
on public.rounds for insert
to authenticated
with check (public.is_game_host(game_id));

create policy "Hosts can update rounds"
on public.rounds for update
to authenticated
using (public.is_game_host(game_id))
with check (public.is_game_host(game_id));

create policy "Hosts can delete rounds"
on public.rounds for delete
to authenticated
using (public.is_game_host(game_id));
