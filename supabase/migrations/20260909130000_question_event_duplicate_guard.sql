create unique index question_events_one_active_template_per_round_idx
  on public.question_events (game_id, round_id, question_template_id)
  where status <> 'cancelled' and round_id is not null;
