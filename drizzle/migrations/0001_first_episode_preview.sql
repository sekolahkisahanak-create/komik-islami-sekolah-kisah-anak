
create or replace function public.can_read_episode(_episode_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when public.is_admin() then true
      when not (e.published and e.release_at <= now()) then false
      when (e.is_premium or (s.is_premium and e.number > (select min(number) from public.episodes x where x.series_id = e.series_id))) then public.has_premium_access(s.id)
      when e.number = (select min(number) from public.episodes x where x.series_id = e.series_id) then true
      else auth.uid() is not null
    end
    from public.episodes e join public.series s on s.id = e.series_id where e.id = _episode_id
  ), false)
$$;
