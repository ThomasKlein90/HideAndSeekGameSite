create function public.is_valid_playable_districts(selected_districts text[])
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select
    cardinality(selected_districts) between 1 and 18
    and selected_districts <@ array[
      'Central and Western District',
      'Eastern District',
      'Islands District',
      'Kowloon City District',
      'Kwai Tsing District',
      'Kwun Tong District',
      'North District',
      'Sai Kung District',
      'Sha Tin District',
      'Sham Shui Po District',
      'Southern District',
      'Tai Po District',
      'Tsuen Wan District',
      'Tuen Mun District',
      'Wan Chai District',
      'Wong Tai Sin District',
      'Yau Tsim Mong District',
      'Yuen Long District'
    ]::text[]
    and array_position(selected_districts, null) is null
    and cardinality(selected_districts) = (
      select count(distinct district_name)
      from unnest(selected_districts) as district(district_name)
    );
$$;

revoke execute on function public.is_valid_playable_districts(text[]) from public;
grant execute on function public.is_valid_playable_districts(text[]) to authenticated;

alter table public.game_settings
  add column playable_districts text[] not null default array[
    'Central and Western District',
    'Eastern District',
    'Islands District',
    'Kowloon City District',
    'Kwai Tsing District',
    'Kwun Tong District',
    'North District',
    'Sai Kung District',
    'Sha Tin District',
    'Sham Shui Po District',
    'Southern District',
    'Tai Po District',
    'Tsuen Wan District',
    'Tuen Mun District',
    'Wan Chai District',
    'Wong Tai Sin District',
    'Yau Tsim Mong District',
    'Yuen Long District'
  ]::text[],
  add constraint game_settings_playable_districts_valid
    check (public.is_valid_playable_districts(playable_districts));

drop function public.create_game(text, public.game_team, integer, integer);

create function public.create_game(
  game_name text,
  host_team public.game_team,
  hider_head_start_seconds integer default 900,
  final_hiding_radius_meters integer default 500,
  selected_playable_districts text[] default array[
    'Central and Western District',
    'Eastern District',
    'Islands District',
    'Kowloon City District',
    'Kwai Tsing District',
    'Kwun Tong District',
    'North District',
    'Sai Kung District',
    'Sha Tin District',
    'Sham Shui Po District',
    'Southern District',
    'Tai Po District',
    'Tsuen Wan District',
    'Tuen Mun District',
    'Wan Chai District',
    'Wong Tai Sin District',
    'Yau Tsim Mong District',
    'Yuen Long District'
  ]::text[]
)
returns table (id uuid, name text, join_code text, phase public.game_phase)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_game public.games;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a game.';
  end if;

  if char_length(trim(game_name)) not between 1 and 100 then
    raise exception 'Game name must be between 1 and 100 characters.';
  end if;

  if hider_head_start_seconds not between 0 and 7200 then
    raise exception 'Hider head start must be between 0 and 7200 seconds.';
  end if;

  if final_hiding_radius_meters not between 25 and 5000 then
    raise exception 'Final hiding radius must be between 25 and 5000 meters.';
  end if;

  if selected_playable_districts is null
    or not public.is_valid_playable_districts(selected_playable_districts)
  then
    raise exception 'Select one or more valid Hong Kong districts for the playable area.';
  end if;

  insert into public.games (host_id, name, join_code)
  values (
    auth.uid(),
    trim(game_name),
    upper(substr(md5(gen_random_uuid()::text), 1, 6))
  )
  returning * into created_game;

  insert into public.game_players (game_id, user_id, team, role, is_team_assigned)
  values (created_game.id, auth.uid(), host_team, 'host', true);

  insert into public.game_settings (
    game_id,
    hider_head_start_seconds,
    final_hiding_radius_meters,
    playable_districts
  )
  values (
    created_game.id,
    hider_head_start_seconds,
    final_hiding_radius_meters,
    selected_playable_districts
  );

  insert into public.rounds (game_id, number, hiding_team, started_at)
  values (created_game.id, 1, 'hiders', now());

  return query
  select
    created_game.id,
    created_game.name,
    created_game.join_code,
    created_game.phase;
end;
$$;

revoke execute on function public.create_game(
  text,
  public.game_team,
  integer,
  integer,
  text[]
) from public;
grant execute on function public.create_game(
  text,
  public.game_team,
  integer,
  integer,
  text[]
) to authenticated;
