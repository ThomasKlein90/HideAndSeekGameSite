create type public.question_category as enum (
  'matching',
  'measuring',
  'thermometer',
  'radar',
  'tentacles',
  'photos'
);

create type public.question_answer_type as enum (
  'yes_no',
  'number',
  'text',
  'photo'
);

create table public.question_templates (
  id uuid primary key default gen_random_uuid(),
  category public.question_category not null,
  title text not null check (char_length(title) between 1 and 100),
  prompt text not null check (char_length(prompt) between 1 and 500),
  answer_type public.question_answer_type not null,
  reward_rule text not null default 'To be confirmed',
  sort_order integer not null unique check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger question_templates_set_updated_at
before update on public.question_templates
for each row execute procedure public.set_updated_at();

insert into public.question_templates (
  category,
  title,
  prompt,
  answer_type,
  sort_order
)
values
  ('matching', 'Matching placeholder', 'Add the approved Matching question here.', 'text', 1),
  ('measuring', 'Measuring placeholder', 'Add the approved Measuring question here.', 'number', 2),
  ('thermometer', 'Thermometer placeholder', 'Add the approved Thermometer question here.', 'number', 3),
  ('radar', 'Radar placeholder', 'Add the approved Radar question here.', 'yes_no', 4),
  ('tentacles', 'Tentacles placeholder', 'Add the approved Tentacles question here.', 'text', 5),
  ('photos', 'Photos placeholder', 'Add the approved Photos question here.', 'photo', 6);

alter table public.question_templates enable row level security;

create policy "Authenticated users can view active question templates"
on public.question_templates for select
to authenticated
using (is_active);
