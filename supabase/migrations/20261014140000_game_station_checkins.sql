create table public.game_checkins (
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  team public.game_team not null,
  station_code text not null check (char_length(station_code) between 1 and 16),
  checked_in_at timestamptz not null default now(),
  primary key (game_id, user_id),
  constraint game_checkins_game_player_fkey
    foreign key (game_id, user_id)
    references public.game_players (game_id, user_id)
    on delete cascade
);

create index game_checkins_game_team_checked_in_at_idx
  on public.game_checkins (game_id, team, checked_in_at desc);

alter table public.game_checkins enable row level security;

create policy "Players can view authorized station check-ins"
on public.game_checkins for select
to authenticated
using (
  (
    team = 'seekers'
    and (
      (user_id = auth.uid() and public.is_seeker(game_id))
      or public.is_hider(game_id)
    )
  )
  or (team = 'hiders' and public.is_hider(game_id))
);

revoke all on public.game_checkins from anon, authenticated;
grant select on public.game_checkins to authenticated;

create function public.submit_station_checkin(
  target_game_id uuid,
  target_station_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitting_team public.game_team;
begin
  if auth.uid() is null then
    raise exception 'Sign in before submitting a station check-in.';
  end if;

  if target_station_code is null
    or char_length(trim(target_station_code)) not between 1 and 16 then
    raise exception 'Choose a valid MTR station before checking in.';
  end if;

  select game_players.team
  into submitting_team
  from public.game_players
  join public.games on games.id = game_players.game_id
  where game_players.game_id = target_game_id
    and game_players.user_id = auth.uid()
    and game_players.is_team_assigned
    and games.phase <> 'game_complete';

  if not found then
    raise exception 'Only assigned players in an unfinished game can check in.';
  end if;

  insert into public.game_checkins (
    game_id,
    user_id,
    team,
    station_code,
    checked_in_at
  )
  values (
    target_game_id,
    auth.uid(),
    submitting_team,
    trim(target_station_code),
    now()
  )
  on conflict (game_id, user_id) do update
  set team = excluded.team,
      station_code = excluded.station_code,
      checked_in_at = excluded.checked_in_at;
end;
$$;

revoke execute on function public.submit_station_checkin(uuid, text)
  from public, anon;
grant execute on function public.submit_station_checkin(uuid, text)
  to authenticated;
