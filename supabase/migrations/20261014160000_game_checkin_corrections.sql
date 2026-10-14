create policy "Game hosts can view all station check-ins"
on public.game_checkins for select
to authenticated
using (public.is_game_host(game_id));

create table public.game_checkin_corrections (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  previous_station_code text not null,
  corrected_station_code text not null,
  previous_checked_in_at timestamptz not null,
  corrected_checked_in_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index game_checkin_corrections_game_created_at_idx
  on public.game_checkin_corrections (game_id, created_at desc);

alter table public.game_checkin_corrections enable row level security;

create policy "Game hosts can view check-in correction history"
on public.game_checkin_corrections for select
to authenticated
using (public.is_game_host(game_id));

revoke all on public.game_checkin_corrections from anon, authenticated;
grant select on public.game_checkin_corrections to authenticated;

create function public.correct_station_checkin(
  target_game_id uuid,
  target_user_id uuid,
  target_station_code text,
  target_checked_in_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_phase public.game_phase;
  previous_station_code text;
  previous_checked_in_at timestamptz;
  corrected_station_code text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before correcting a station check-in.';
  end if;

  select phase
  into current_phase
  from public.games
  where id = target_game_id
    and host_id = auth.uid()
  for update;

  if not found then
    raise exception 'Only the game host can correct station check-ins.';
  end if;

  if current_phase = 'game_complete' then
    raise exception 'Check-ins cannot be corrected after the game is complete.';
  end if;

  corrected_station_code := trim(target_station_code);
  if target_station_code is null
    or char_length(corrected_station_code) not between 1 and 16 then
    raise exception 'Choose a valid MTR station for the correction.';
  end if;

  if target_checked_in_at is null or target_checked_in_at > now() then
    raise exception 'The corrected report time must not be in the future.';
  end if;

  select station_code, checked_in_at
  into previous_station_code, previous_checked_in_at
  from public.game_checkins
  where game_id = target_game_id
    and user_id = target_user_id
  for update;

  if not found then
    raise exception 'The player has no station check-in to correct.';
  end if;

  if previous_station_code = corrected_station_code
    and previous_checked_in_at = target_checked_in_at then
    return;
  end if;

  insert into public.game_checkin_corrections (
    game_id,
    user_id,
    actor_id,
    previous_station_code,
    corrected_station_code,
    previous_checked_in_at,
    corrected_checked_in_at
  )
  values (
    target_game_id,
    target_user_id,
    auth.uid(),
    previous_station_code,
    corrected_station_code,
    previous_checked_in_at,
    target_checked_in_at
  );

  update public.game_checkins
  set station_code = corrected_station_code,
      checked_in_at = target_checked_in_at
  where game_id = target_game_id
    and user_id = target_user_id;
end;
$$;

revoke execute on function public.correct_station_checkin(
  uuid,
  uuid,
  text,
  timestamptz
) from public, anon;
grant execute on function public.correct_station_checkin(
  uuid,
  uuid,
  text,
  timestamptz
) to authenticated;
