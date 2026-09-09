create type public.seeker_annotation_type as enum (
  'note',
  'pin',
  'eliminated_area'
);

create table public.seeker_annotations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  round_id uuid references public.rounds (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  annotation_type public.seeker_annotation_type not null,
  title text not null check (char_length(title) between 1 and 100),
  note text not null default '' check (char_length(note) <= 500),
  location_label text check (location_label is null or char_length(location_label) <= 150),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (annotation_type = 'note' and latitude is null and longitude is null)
    or annotation_type <> 'note'
  ),
  check ((latitude is null) = (longitude is null))
);

create index seeker_annotations_game_round_idx
  on public.seeker_annotations (game_id, round_id, created_at desc);

create trigger seeker_annotations_set_updated_at
before update on public.seeker_annotations
for each row execute procedure public.set_updated_at();

alter table public.seeker_annotations enable row level security;

create policy "Seekers can view their own annotations"
on public.seeker_annotations for select
to authenticated
using (created_by = auth.uid() and public.is_game_member(game_id));

create policy "Seekers can create their own annotations"
on public.seeker_annotations for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.game_players
    where game_id = seeker_annotations.game_id
      and user_id = auth.uid()
      and team = 'seekers'
  )
);

create policy "Seekers can update their own annotations"
on public.seeker_annotations for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Seekers can delete their own annotations"
on public.seeker_annotations for delete
to authenticated
using (created_by = auth.uid());
