drop function public.create_game(text, public.game_team, integer, integer);

create function public.create_game(
  game_name text,
  host_team public.game_team,
  hider_head_start_seconds integer default 900,
  final_hiding_radius_meters integer default 500
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
    final_hiding_radius_meters
  )
  values (
    created_game.id,
    hider_head_start_seconds,
    final_hiding_radius_meters
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

revoke execute on function public.create_game(text, public.game_team, integer, integer)
  from public;
grant execute on function public.create_game(text, public.game_team, integer, integer)
  to authenticated;
