alter table public.game_players
add column is_team_assigned boolean not null default false;

update public.game_players
set is_team_assigned = true
where role = 'host';

create function public.enforce_team_size()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  assigned_players integer;
begin
  if new.is_team_assigned then
    select count(*)
    into assigned_players
    from public.game_players
    where game_id = new.game_id
      and team = new.team
      and is_team_assigned
      and (tg_op = 'INSERT' or user_id <> new.user_id);

    if assigned_players >= 2 then
      raise exception 'A team can have no more than two players.';
    end if;
  end if;

  return new;
end;
$$;

create trigger game_players_enforce_team_size
before insert or update of team, is_team_assigned on public.game_players
for each row execute procedure public.enforce_team_size();

drop function public.create_game(text, integer, integer);

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

  return query
  select
    created_game.id,
    created_game.name,
    created_game.join_code,
    created_game.phase;
end;
$$;

create function public.join_game(game_join_code text)
returns table (id uuid, name text, join_code text, phase public.game_phase)
language plpgsql
security definer
set search_path = ''
as $$
declare
  joined_game public.games;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a game.';
  end if;

  select *
  into joined_game
  from public.games
  where join_code = upper(trim(game_join_code));

  if not found then
    raise exception 'No game matches that join code.';
  end if;

  if exists (
    select 1
    from public.game_players
    where game_id = joined_game.id
      and user_id = auth.uid()
  ) then
    return query
    select joined_game.id, joined_game.name, joined_game.join_code, joined_game.phase;
    return;
  end if;

  if (
    select count(*)
    from public.game_players
    where game_id = joined_game.id
  ) >= 4 then
    raise exception 'This game already has four players.';
  end if;

  insert into public.game_players (game_id, user_id, team)
  values (joined_game.id, auth.uid(), 'seekers');

  return query
  select joined_game.id, joined_game.name, joined_game.join_code, joined_game.phase;
end;
$$;

create function public.assign_player_team(
  target_game_id uuid,
  target_user_id uuid,
  selected_team public.game_team
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_game_host(target_game_id) then
    raise exception 'Only the game host can assign teams.';
  end if;

  update public.game_players
  set team = selected_team,
      is_team_assigned = true
  where game_id = target_game_id
    and user_id = target_user_id;

  if not found then
    raise exception 'That player is not part of this game.';
  end if;
end;
$$;

revoke execute on function public.create_game(text, public.game_team, integer, integer) from public;
revoke execute on function public.join_game(text) from public;
revoke execute on function public.assign_player_team(uuid, uuid, public.game_team) from public;

grant execute on function public.create_game(text, public.game_team, integer, integer) to authenticated;
grant execute on function public.join_game(text) to authenticated;
grant execute on function public.assign_player_team(uuid, uuid, public.game_team) to authenticated;
