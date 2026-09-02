create function public.create_game(
  game_name text,
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

  insert into public.game_players (game_id, user_id, team, role)
  values (created_game.id, auth.uid(), 'seekers', 'host');

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

  return query
  select
    created_game.id,
    created_game.name,
    created_game.join_code,
    created_game.phase;
end;
$$;

grant execute on function public.create_game(text, integer, integer) to authenticated;
