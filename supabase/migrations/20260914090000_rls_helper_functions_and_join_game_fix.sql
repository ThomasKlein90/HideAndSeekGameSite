-- 1. Redefine helper functions using PL/pgSQL SECURITY DEFINER to prevent inlining and RLS recursion
create or replace function public.is_game_host(target_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.games
    where id = target_game_id
      and host_id = auth.uid()
  );
end;
$$;

create or replace function public.is_game_member(target_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.game_players
    where game_id = target_game_id
      and user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_seeker(target_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.game_players
    where game_id = target_game_id
      and user_id = auth.uid()
      and team = 'seekers'
  );
end;
$$;

create or replace function public.is_hider(target_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.game_players
    where game_id = target_game_id
      and user_id = auth.uid()
      and team = 'hiders'
  );
end;
$$;

grant execute on function public.is_game_host(uuid) to authenticated, anon;
grant execute on function public.is_game_member(uuid) to authenticated, anon;
grant execute on function public.is_seeker(uuid) to authenticated, anon;
grant execute on function public.is_hider(uuid) to authenticated, anon;

-- 2. Fix ambiguous join_code reference in join_game()
create or replace function public.join_game(game_join_code text)
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
  from public.games g
  where g.join_code = upper(trim(game_join_code));

  if not found then
    raise exception 'No game matches that join code.';
  end if;

  if exists (
    select 1
    from public.game_players gp
    where gp.game_id = joined_game.id
      and gp.user_id = auth.uid()
  ) then
    return query
    select joined_game.id, joined_game.name, joined_game.join_code, joined_game.phase;
    return;
  end if;

  if (
    select count(*)
    from public.game_players gp
    where gp.game_id = joined_game.id
  ) >= 4 then
    raise exception 'This game already has four players.';
  end if;

  insert into public.game_players (game_id, user_id, team, role, is_team_assigned)
  values (joined_game.id, auth.uid(), 'seekers', 'player', false);

  return query
  select joined_game.id, joined_game.name, joined_game.join_code, joined_game.phase;
end;
$$;

grant execute on function public.join_game(text) to authenticated;

-- 3. Update seeker_annotations insert policy to use is_seeker()
drop policy if exists "Seekers can create their own annotations" on public.seeker_annotations;
create policy "Seekers can create their own annotations"
on public.seeker_annotations for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_seeker(game_id)
);
