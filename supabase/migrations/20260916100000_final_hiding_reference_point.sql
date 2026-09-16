alter table public.game_settings
  add column final_hiding_reference_label text
    check (
      final_hiding_reference_label is null
      or char_length(final_hiding_reference_label) between 1 and 150
    ),
  add column final_hiding_reference_latitude double precision
    check (
      final_hiding_reference_latitude between -90 and 90
    ),
  add column final_hiding_reference_longitude double precision
    check (
      final_hiding_reference_longitude between -180 and 180
    ),
  add constraint game_settings_reference_coordinates_pair
    check (
      (final_hiding_reference_latitude is null)
      = (final_hiding_reference_longitude is null)
    );

create function public.set_final_hiding_reference_point(
  target_game_id uuid,
  reference_label text,
  reference_latitude double precision,
  reference_longitude double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_game_host(target_game_id) or public.is_hider(target_game_id)) then
    raise exception 'Only the host or Hider Team can set the final hiding reference point.';
  end if;

  if (reference_latitude is null) <> (reference_longitude is null) then
    raise exception 'Reference latitude and longitude must be provided together.';
  end if;

  if reference_latitude is not null
    and (reference_latitude < -90 or reference_latitude > 90) then
    raise exception 'Reference latitude must be between -90 and 90.';
  end if;

  if reference_longitude is not null
    and (reference_longitude < -180 or reference_longitude > 180) then
    raise exception 'Reference longitude must be between -180 and 180.';
  end if;

  update public.game_settings
  set final_hiding_reference_label = nullif(trim(reference_label), ''),
      final_hiding_reference_latitude = reference_latitude,
      final_hiding_reference_longitude = reference_longitude
  where game_id = target_game_id;

  if not found then
    raise exception 'Game settings were not found.';
  end if;
end;
$$;

revoke execute on function public.set_final_hiding_reference_point(
  uuid,
  text,
  double precision,
  double precision
) from public;
grant execute on function public.set_final_hiding_reference_point(
  uuid,
  text,
  double precision,
  double precision
) to authenticated;
