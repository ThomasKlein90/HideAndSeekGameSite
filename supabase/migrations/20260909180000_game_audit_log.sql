create table public.game_audit_log (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (char_length(action) between 1 and 100),
  from_phase public.game_phase,
  to_phase public.game_phase,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index game_audit_log_game_created_at_idx
  on public.game_audit_log (game_id, created_at desc);

alter table public.game_audit_log enable row level security;

create policy "Game members can view audit entries"
on public.game_audit_log for select
to authenticated
using (public.is_game_member(game_id) or public.is_game_host(game_id));

revoke insert, update, delete on public.game_audit_log from authenticated;

create or replace function public.transition_game_phase(
  target_game_id uuid,
  next_phase public.game_phase
)
returns public.game_phase
language plpgsql
security definer
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

  insert into public.game_audit_log (
    game_id,
    actor_id,
    action,
    from_phase,
    to_phase,
    details
  )
  values (
    target_game_id,
    auth.uid(),
    'phase_transition',
    current_phase,
    next_phase,
    jsonb_build_object('source', 'host_control')
  );

  return next_phase;
end;
$$;
