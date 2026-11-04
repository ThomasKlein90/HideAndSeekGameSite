alter table public.question_templates
  add column requires_distance_input boolean not null default false;

alter table public.question_events
  add column radar_distance_meters integer
  check (
    radar_distance_meters is null
    or radar_distance_meters between 1 and 150000
  );

update public.question_templates
set reward_rule = case category
  when 'matching' then 'Draw 3, pick 1'
  when 'measuring' then 'Draw 3, pick 1'
  when 'thermometer' then 'Draw 2, pick 1'
  when 'radar' then 'Draw 2, pick 1'
  when 'tentacles' then 'Draw 4, pick 2'
  when 'photos' then 'Draw 1'
end,
is_active = false
where (category = 'matching' and title = 'Matching placeholder')
  or (category = 'measuring' and title = 'Measuring placeholder')
  or (category = 'thermometer' and title = 'Thermometer placeholder')
  or (category = 'radar' and title = 'Radar placeholder')
  or (category = 'tentacles' and title = 'Tentacles placeholder')
  or (category = 'photos' and title = 'Photos placeholder');

insert into public.question_templates (
  category,
  title,
  prompt,
  answer_type,
  reward_rule,
  sort_order
)
values
  ('radar', '400 m range', 'Am I within 400 m of you?', 'yes_no', 'Draw 2, pick 1', 7),
  ('radar', '800 m range', 'Am I within 800 m of you?', 'yes_no', 'Draw 2, pick 1', 8),
  ('radar', '1.5 km range', 'Am I within 1.5 km of you?', 'yes_no', 'Draw 2, pick 1', 9),
  ('radar', '5 km range', 'Am I within 5 km of you?', 'yes_no', 'Draw 2, pick 1', 10),
  ('radar', '8 km range', 'Am I within 8 km of you?', 'yes_no', 'Draw 2, pick 1', 11),
  ('radar', '15 km range', 'Am I within 15 km of you?', 'yes_no', 'Draw 2, pick 1', 12),
  ('radar', '40 km range', 'Am I within 40 km of you?', 'yes_no', 'Draw 2, pick 1', 13),
  ('radar', '80 km range', 'Am I within 80 km of you?', 'yes_no', 'Draw 2, pick 1', 14),
  ('radar', '150 km range', 'Am I within 150 km of you?', 'yes_no', 'Draw 2, pick 1', 15),
  (
    'radar',
    'Custom range',
    'Am I within the selected distance of you?',
    'yes_no',
    'Draw 2, pick 1',
    16
  );

update public.question_templates
set requires_distance_input = true
where category = 'radar'
  and title = 'Custom range';

drop policy "Seekers can create question events" on public.question_events;
create policy "Seekers can create question events"
on public.question_events for insert
to authenticated
with check (
  asked_by = auth.uid()
  and status = 'pending'
  and answer is null
  and answered_by is null
  and answered_at is null
  and reward_note is null
  and reward_logged_by is null
  and reward_logged_at is null
  and exists (
    select 1
    from public.game_players
    where game_id = question_events.game_id
      and user_id = auth.uid()
      and team = 'seekers'
  )
  and round_id is not null
  and exists (
    select 1
    from public.rounds
    where id = question_events.round_id
      and game_id = question_events.game_id
      and ended_at is null
  )
  and exists (
    select 1
    from public.question_templates
    where id = question_events.question_template_id
      and is_active
  )
  and (
    (
      radar_distance_meters is null
      and not exists (
        select 1
        from public.question_templates
        where id = question_events.question_template_id
          and requires_distance_input
      )
    )
    or (
      radar_distance_meters between 1 and 150000
      and exists (
        select 1
        from public.question_templates
        where id = question_events.question_template_id
          and requires_distance_input
      )
    )
  )
);
