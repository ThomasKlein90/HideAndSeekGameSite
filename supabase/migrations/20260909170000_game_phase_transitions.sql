create or replace function public.transition_game_phase(
  target_game_id uuid,
  next_phase public.game_phase
)
returns public.game_phase
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_phase public.game_phase;
  allowed_transition boolean;
begin
  select phase
  into current_phase
  from public.games
  where id = target_game_id
    and host_id = auth.uid()
  for update;

  if current_phase is null then
    raise exception 'Only the game host can transition this game.';
  end if;

  allowed_transition := (
    (current_phase = 'setup' and next_phase = 'hider_head_start')
    or (current_phase = 'hider_head_start' and next_phase = 'active_seeking')
    or (current_phase = 'active_seeking' and next_phase = 'final_hiding')
    or (current_phase = 'final_hiding' and next_phase = 'round_complete')
    or (current_phase = 'round_complete' and next_phase = 'game_complete')
  );

  if not allowed_transition then
    raise exception 'That game phase transition is not allowed.';
  end if;

  update public.games
  set phase = next_phase,
      phase_started_at = now()
  where id = target_game_id;

  return next_phase;
end;
$$;

revoke execute on function public.transition_game_phase(uuid, public.game_phase)
  from public;
grant execute on function public.transition_game_phase(uuid, public.game_phase)
  to authenticated;
