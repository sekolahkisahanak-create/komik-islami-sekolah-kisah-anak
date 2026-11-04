
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin','reader');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pembaca',
  notify_new_episode boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)));
  insert into public.user_roles(user_id, role) values (new.id, 'reader');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- CHILD PROFILES
create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null,
  name text not null,
  age_group text not null default '8-12',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.child_profiles to authenticated;
grant all on public.child_profiles to service_role;
alter table public.child_profiles enable row level security;
create policy "own children" on public.child_profiles for all to authenticated using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create table public.parent_pins (
  user_id uuid primary key,
  pin_hash text not null
);
grant all on public.parent_pins to service_role;
alter table public.parent_pins enable row level security;

create or replace function public.set_parent_pin(_pin text) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'Harus masuk'; end if;
  if _pin !~ '^[0-9]{4}$' then raise exception 'PIN harus 4 digit angka'; end if;
  insert into public.parent_pins(user_id, pin_hash) values (auth.uid(), crypt(_pin, gen_salt('bf')))
  on conflict (user_id) do update set pin_hash = excluded.pin_hash;
end $$;
create or replace function public.has_parent_pin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.parent_pins where user_id = auth.uid())
$$;
create or replace function public.verify_parent_pin(_pin text) returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists(select 1 from public.parent_pins where user_id = auth.uid() and pin_hash = crypt(_pin, pin_hash))
$$;

-- CATALOG
create table public.series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  synopsis text not null default '',
  genre text not null,
  age_group text not null,
  status text not null default 'Ongoing',
  sources text not null default '',
  cover_url text,
  cover_hue int not null default 250,
  is_premium boolean not null default false,
  price_idr int,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.series to anon;
grant select, insert, update, delete on public.series to authenticated;
grant all on public.series to service_role;
alter table public.series enable row level security;
create policy "public series" on public.series for select to anon, authenticated using (published or public.is_admin());
create policy "admin series write" on public.series for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  number int not null,
  title text not null,
  synopsis text not null default '',
  is_premium boolean not null default false,
  published boolean not null default false,
  release_at timestamptz not null default now(),
  ibrah text[] not null default '{}',
  discussion_question text not null default '',
  created_at timestamptz not null default now(),
  unique(series_id, number)
);
grant select on public.episodes to anon;
grant select, insert, update, delete on public.episodes to authenticated;
grant all on public.episodes to service_role;
alter table public.episodes enable row level security;
create policy "public episodes" on public.episodes for select to anon, authenticated using ((published and release_at <= now()) or public.is_admin());
create policy "admin episodes write" on public.episodes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ACCESS
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days int not null,
  price_idr int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.plans to anon;
grant select, insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "public plans" on public.plans for select to anon, authenticated using (active or public.is_admin());
create policy "admin plans" on public.plans for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text,
  plan_id uuid references public.plans(id) on delete set null,
  series_id uuid references public.series(id) on delete set null,
  amount_idr int not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own or admin orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "create own order" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  series_id uuid references public.series(id) on delete cascade,
  expires_at timestamptz,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "own subs" on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.admin_decide_order(_order_id uuid, _approve boolean) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; d int;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null or o.status <> 'pending' then raise exception 'Pesanan tidak valid'; end if;
  update public.orders set status = case when _approve then 'approved' else 'rejected' end, decided_at = now() where id = _order_id;
  if _approve then
    if o.plan_id is not null then
      select duration_days into d from public.plans where id = o.plan_id;
      insert into public.subscriptions(user_id, expires_at, order_id)
      values (o.user_id, greatest(now(), coalesce((select max(expires_at) from public.subscriptions where user_id = o.user_id and series_id is null), now())) + make_interval(days => coalesce(d,30)), o.id);
    elsif o.series_id is not null then
      insert into public.subscriptions(user_id, series_id, expires_at, order_id) values (o.user_id, o.series_id, null, o.id);
    end if;
    insert into public.notifications(user_id, title, body, link) values (o.user_id, 'Pesanan disetujui', 'Akses premium Anda sudah aktif. Selamat membaca!', '/langganan');
  else
    insert into public.notifications(user_id, title, body, link) values (o.user_id, 'Pesanan ditolak', 'Pesanan Anda belum dapat disetujui. Silakan hubungi admin.', '/langganan');
  end if;
end $$;

create or replace function public.has_premium_access(_series_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.is_admin() or exists (
      select 1 from public.subscriptions s where s.user_id = auth.uid()
      and ((s.series_id is null and s.expires_at > now()) or (s.series_id = _series_id and (s.expires_at is null or s.expires_at > now())))
    ))
$$;

create or replace function public.can_read_episode(_episode_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when public.is_admin() then true
      when not (e.published and e.release_at <= now()) then false
      when (e.is_premium or (s.is_premium and e.number > 1)) then public.has_premium_access(s.id)
      when e.number = 1 then true
      else auth.uid() is not null
    end
    from public.episodes e join public.series s on s.id = e.series_id where e.id = _episode_id
  ), false)
$$;

create table public.episode_pages (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  position int not null,
  image_url text not null
);
grant select on public.episode_pages to anon;
grant select, insert, update, delete on public.episode_pages to authenticated;
grant all on public.episode_pages to service_role;
alter table public.episode_pages enable row level security;
create policy "readable pages" on public.episode_pages for select to anon, authenticated using (public.can_read_episode(episode_id));
create policy "admin pages" on public.episode_pages for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  position int not null default 1,
  question text not null,
  options text[] not null,
  correct_index int not null default 0
);
grant select on public.quiz_questions to anon;
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant all on public.quiz_questions to service_role;
alter table public.quiz_questions enable row level security;
create policy "quiz readable" on public.quiz_questions for select to anon, authenticated using (public.can_read_episode(episode_id));
create policy "admin quiz" on public.quiz_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- READER DATA (child_id = nil uuid means parent account itself)
create table public.reading_progress (
  user_id uuid not null,
  child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  episode_id uuid not null references public.episodes(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  progress numeric not null default 0,
  finished boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, child_id, episode_id)
);
create table public.favorites (
  user_id uuid not null, child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  series_id uuid not null references public.series(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id, child_id, series_id)
);
create table public.bookmarks (
  user_id uuid not null, child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  series_id uuid not null references public.series(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id, child_id, series_id)
);
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  episode_id uuid not null references public.episodes(id) on delete cascade,
  score int not null, total int not null,
  created_at timestamptz not null default now()
);
create table public.reading_days (
  user_id uuid not null, child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  day date not null default current_date, primary key (user_id, child_id, day)
);
create table public.badges (
  user_id uuid not null, child_id uuid not null default '00000000-0000-0000-0000-000000000000',
  code text not null, label text not null,
  earned_at timestamptz not null default now(), primary key (user_id, child_id, code)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, title text not null, body text not null default '', link text,
  read boolean not null default false, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reading_progress, public.favorites, public.bookmarks, public.quiz_results, public.reading_days, public.badges, public.notifications to authenticated;
grant all on public.reading_progress, public.favorites, public.bookmarks, public.quiz_results, public.reading_days, public.badges, public.notifications to service_role;
alter table public.reading_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.bookmarks enable row level security;
alter table public.quiz_results enable row level security;
alter table public.reading_days enable row level security;
alter table public.badges enable row level security;
alter table public.notifications enable row level security;
create policy "own progress" on public.reading_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own fav" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own bm" on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own quiz" on public.quiz_results for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own days" on public.reading_days for select to authenticated using (user_id = auth.uid());
create policy "own badges" on public.badges for select to authenticated using (user_id = auth.uid());
create policy "own notif select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notif update" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "own notif delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create table public.ratings (
  user_id uuid not null, series_id uuid not null references public.series(id) on delete cascade,
  stars int not null check (stars between 1 and 5), primary key (user_id, series_id)
);
grant select, insert, update, delete on public.ratings to authenticated;
grant all on public.ratings to service_role;
alter table public.ratings enable row level security;
create policy "own ratings" on public.ratings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.series_rating(_series_id uuid) returns table(avg numeric, count bigint) language sql stable security definer set search_path = public as $$
  select round(avg(stars)::numeric, 1), count(*) from public.ratings where series_id = _series_id
$$;
grant execute on function public.series_rating(uuid) to anon, authenticated;

-- progress side effects: reading days, badges
create or replace function public.on_progress_change() returns trigger language plpgsql security definer set search_path = public as $$
declare total int; done int; streak int;
begin
  insert into public.reading_days(user_id, child_id, day) values (new.user_id, new.child_id, current_date) on conflict do nothing;
  if new.finished then
    insert into public.badges(user_id, child_id, code, label) values (new.user_id, new.child_id, 'first_finish', 'Episode Pertama Selesai') on conflict do nothing;
    select count(*) into total from public.episodes where series_id = new.series_id and published and release_at <= now();
    select count(*) into done from public.reading_progress rp join public.episodes e on e.id = rp.episode_id
      where rp.user_id = new.user_id and rp.child_id = new.child_id and rp.series_id = new.series_id and rp.finished and e.published;
    if total > 0 and done >= total then
      insert into public.badges(user_id, child_id, code, label)
      select new.user_id, new.child_id, 'series_' || new.series_id, 'Tamat: ' || title from public.series where id = new.series_id
      on conflict do nothing;
    end if;
  end if;
  select count(*) into streak from public.reading_days where user_id = new.user_id and child_id = new.child_id and day > current_date - 7;
  if streak >= 7 then
    insert into public.badges(user_id, child_id, code, label) values (new.user_id, new.child_id, 'challenge_7', 'Tantangan Baca 7 Hari') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger progress_side_effects after insert or update on public.reading_progress for each row execute function public.on_progress_change();

-- notify favoriters on publish
create or replace function public.on_episode_publish() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) then
    insert into public.notifications(user_id, title, body, link)
    select distinct f.user_id, 'Episode baru: ' || s.title, 'Episode ' || new.number || ' — ' || new.title || ' sudah terbit.', '/seri/' || s.slug
    from public.favorites f join public.series s on s.id = new.series_id
    join public.profiles p on p.id = f.user_id
    where f.series_id = new.series_id and p.notify_new_episode;
  end if;
  return new;
end $$;
create trigger episode_publish_notify after insert or update of published on public.episodes for each row execute function public.on_episode_publish();

-- CLASSES
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, name text not null,
  join_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);
create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null, display_name text not null,
  joined_at timestamptz not null default now(), primary key (class_id, user_id)
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  include_quiz boolean not null default true, due_at date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.classes, public.class_members, public.assignments to authenticated;
grant all on public.classes, public.class_members, public.assignments to service_role;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;

create or replace function public.is_class_member(_class_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.class_members where class_id = _class_id and user_id = auth.uid())
$$;
create or replace function public.is_class_owner(_class_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.classes where id = _class_id and owner_id = auth.uid())
$$;
create policy "class owner all" on public.classes for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "class member read" on public.classes for select to authenticated using (public.is_class_member(id));
create policy "members owner read" on public.class_members for select to authenticated using (user_id = auth.uid() or public.is_class_owner(class_id));
create policy "members leave" on public.class_members for delete to authenticated using (user_id = auth.uid() or public.is_class_owner(class_id));
create policy "assign owner" on public.assignments for all to authenticated using (public.is_class_owner(class_id)) with check (public.is_class_owner(class_id));
create policy "assign member read" on public.assignments for select to authenticated using (public.is_class_member(class_id));

create or replace function public.join_class(_code text, _name text) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Harus masuk'; end if;
  select id into cid from public.classes where join_code = upper(trim(_code));
  if cid is null then raise exception 'Kode kelas tidak ditemukan'; end if;
  insert into public.class_members(class_id, user_id, display_name) values (cid, auth.uid(), coalesce(nullif(trim(_name),''),'Siswa'))
  on conflict (class_id, user_id) do update set display_name = excluded.display_name;
  return cid;
end $$;

create or replace function public.class_report(_class_id uuid)
returns table(assignment_id uuid, user_id uuid, display_name text, finished boolean, quiz_score int, quiz_total int)
language sql stable security definer set search_path = public as $$
  select a.id, m.user_id, m.display_name,
    coalesce((select bool_or(rp.finished) from public.reading_progress rp where rp.user_id = m.user_id and rp.episode_id = a.episode_id), false),
    (select qr.score from public.quiz_results qr where qr.user_id = m.user_id and qr.episode_id = a.episode_id order by qr.created_at desc limit 1),
    (select qr.total from public.quiz_results qr where qr.user_id = m.user_id and qr.episode_id = a.episode_id order by qr.created_at desc limit 1)
  from public.assignments a join public.class_members m on m.class_id = a.class_id
  where a.class_id = _class_id and public.is_class_owner(_class_id)
$$;

-- PARENT REPORT
create or replace function public.parent_weekly_report(_pin text)
returns table(child_id uuid, name text, episodes_read bigint, episodes_finished bigint, quizzes_done bigint, reading_days bigint)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_parent_pin(_pin) then raise exception 'PIN salah'; end if;
  return query
  select c.id, c.name,
    (select count(*) from public.reading_progress rp where rp.user_id = auth.uid() and rp.child_id = c.id and rp.updated_at > now() - interval '7 days'),
    (select count(*) from public.reading_progress rp where rp.user_id = auth.uid() and rp.child_id = c.id and rp.finished and rp.updated_at > now() - interval '7 days'),
    (select count(*) from public.quiz_results q where q.user_id = auth.uid() and q.child_id = c.id and q.created_at > now() - interval '7 days'),
    (select count(*) from public.reading_days d where d.user_id = auth.uid() and d.child_id = c.id and d.day > current_date - 7)
  from (select cp.id, cp.name from public.child_profiles cp where cp.parent_id = auth.uid()
        union all select '00000000-0000-0000-0000-000000000000'::uuid, 'Akun Orang Tua') c;
end $$;

-- ADMIN STATS
create or replace function public.admin_stats()
returns table(series_id uuid, title text, reads bigint, finishes bigint, bookmarks bigint, favorites bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  return query select s.id, s.title,
    (select count(*) from public.reading_progress rp where rp.series_id = s.id),
    (select count(*) from public.reading_progress rp where rp.series_id = s.id and rp.finished),
    (select count(*) from public.bookmarks b where b.series_id = s.id),
    (select count(*) from public.favorites f where f.series_id = s.id)
  from public.series s order by s.created_at;
end $$;

create or replace function public.admin_episode_stats()
returns table(episode_id uuid, series_title text, number int, title text, reads bigint, finishes bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  return query select e.id, s.title, e.number, e.title,
    (select count(*) from public.reading_progress rp where rp.episode_id = e.id),
    (select count(*) from public.reading_progress rp where rp.episode_id = e.id and rp.finished)
  from public.episodes e join public.series s on s.id = e.series_id order by s.created_at, e.number;
end $$;

-- SEED
insert into public.series(slug, title, synopsis, genre, age_group, status, sources, cover_hue, featured, created_at) values
('siroh-nabawiyah-v2','Siroh Nabawiyah V2','Ikuti perjalanan hidup Rasulullah ﷺ sejak peristiwa Tahun Gajah, masa kecil yang penuh kasih sayang, hingga beliau dikenal sebagai Al-Amin — orang yang paling jujur dan terpercaya. Kisah hangat untuk dibaca bersama keluarga.','Siroh','8-12','Ongoing','Diringkas dari kitab-kitab sirah nabawiyah yang mu''tabar. Rincian rujukan per episode akan dilengkapi oleh tim Sekolah Kisah Anak.',250,true, now() - interval '5 days'),
('siroh-nabawiyah-seri-pertama','Siroh Nabawiyah Seri Pertama','Seri pertama komik sirah dari Sekolah Kisah Anak: 21 episode yang mengajak anak mengenal dan mencintai Nabi Muhammad ﷺ melalui kisah bergambar yang lembut dan mudah dipahami.','Siroh','8-12','Completed','Diringkas dari kitab-kitab sirah nabawiyah yang mu''tabar. Rincian rujukan akan dilengkapi oleh tim Sekolah Kisah Anak.',210,false, now() - interval '30 days'),
('komik-para-ulama','Komik Para Ulama','Kisah teladan empat imam besar: tentang adab kepada orang tua, kesabaran dalam majelis ilmu, kejujuran, dan kepedulian kepada tetangga. Setiap buku adalah pelajaran akhlak yang membekas.','Ulama & Sahabat','8-12','Completed','Diringkas dari kitab-kitab biografi ulama (tarajim). Rincian rujukan per kisah akan dilengkapi oleh tim Sekolah Kisah Anak.',30,true, now() - interval '20 days'),
('abu-bakar-ash-shiddiq','Abu Bakar Ash-Shiddiq: Memberi Semua Hartanya','Kisah sahabat terdekat Rasulullah ﷺ yang tidak ragu menyerahkan seluruh hartanya di jalan Allah. Sebuah kisah tentang keyakinan, kedermawanan, dan cinta kepada Allah dan Rasul-Nya.','Ulama & Sahabat','8-12','Ongoing','Diringkas dari kitab-kitab sirah dan biografi sahabat. Rincian rujukan akan dilengkapi oleh tim Sekolah Kisah Anak.',160,true, now() - interval '3 days'),
('nafs-leveling','Nafs Leveling: The Gate of Fitnah','Komik remaja tentang perjuangan melawan hawa nafsu di tengah dunia yang penuh godaan. Setiap "level" adalah latihan jiwa — riyadhah — untuk menjadi pribadi yang lebih kuat imannya. Khusus pembaca 13 tahun ke atas.','Remaja 13+','13+','Ongoing','Konsep tazkiyatun nafs diringkas dari karya-karya ulama tentang penyucian jiwa. Rincian rujukan akan dilengkapi oleh tim Sekolah Kisah Anak.',0,false, now() - interval '1 days');

insert into public.episodes(series_id, number, title, synopsis, published, release_at, ibrah, discussion_question)
select s.id, v.n, v.t, v.syn, true, now() - make_interval(days => 10 - v.n), v.ib, v.dq
from public.series s, (values
 (1,'Tahun Gajah','Pasukan bergajah datang hendak menghancurkan Ka''bah, namun Allah melindungi rumah-Nya dengan cara yang menakjubkan. Pada tahun itulah sebuah kelahiran mulia dinantikan.', array['Allah Maha Kuasa menjaga apa yang Dia kehendaki.','Kesombongan tidak akan menang melawan kehendak Allah.','Kita bertawakal kepada Allah saat menghadapi masalah besar.'], 'Pernahkah kamu merasa takut, lalu Allah memberi jalan keluar? Ceritakan bersama ayah/ibu.'),
 (2,'Kelahiran Sang Nabi','Di kota Makkah lahirlah seorang bayi yatim bernama Muhammad. Kakeknya, Abdul Muthalib, menyambutnya dengan penuh gembira dan kasih sayang.', array['Setiap anak adalah amanah yang disambut dengan kasih sayang.','Anak yatim harus disayangi dan dilindungi.','Allah menyiapkan kebaikan besar bagi hamba-Nya sejak kecil.'], 'Bagaimana cara kita menyayangi teman yang tidak lagi memiliki ayah atau ibu?'),
 (3,'Perjalanan ke Madinah','Muhammad kecil diajak ibunya, Aminah, mengunjungi keluarga di Madinah. Dalam perjalanan pulang, beliau harus menghadapi kehilangan yang sangat menyedihkan.', array['Kesabaran saat kehilangan orang yang dicintai.','Berbakti kepada ibu selama masih bersama.','Allah selalu menjaga hamba-Nya meski dalam kesedihan.'], 'Apa yang bisa kita lakukan hari ini untuk menyenangkan hati ibu?'),
 (4,'Perjalanan ke Syam','Remaja Muhammad ikut pamannya, Abu Thalib, berdagang ke negeri Syam. Di tengah perjalanan, seorang pendeta melihat tanda-tanda istimewa pada diri beliau.', array['Bekerja dan belajar sejak muda adalah kebaikan.','Menaati dan menemani orang tua dalam kebaikan.','Akhlak mulia dapat dilihat oleh orang lain.'], 'Kebaikan apa yang ingin kamu tunjukkan agar orang lain mengenalmu sebagai anak yang baik?'),
 (5,'Al-Amin','Penduduk Makkah memberi Muhammad gelar Al-Amin karena kejujurannya. Saat terjadi perselisihan tentang Hajar Aswad, beliau memberikan jalan keluar yang adil bagi semua.', array['Kejujuran membuat kita dipercaya orang lain.','Bersikap adil dan mencari jalan damai saat berselisih.','Gelar terbaik didapat dari akhlak, bukan harta.'], 'Pernahkah kamu jujur walaupun sulit? Bagaimana rasanya?')
) as v(n,t,syn,ib,dq) where s.slug = 'siroh-nabawiyah-v2';

insert into public.episodes(series_id, number, title, synopsis, published, release_at, ibrah, discussion_question)
select s.id, g, 'Episode ' || g, 'Bagian ke-' || g || ' dari Siroh Nabawiyah Seri Pertama: mengenal kehidupan Rasulullah ﷺ dan meneladani akhlak beliau.', true, now() - make_interval(days => 40 - g),
  array['Mengenal Rasulullah ﷺ membuat kita semakin mencintai beliau.','Akhlak Nabi ﷺ adalah teladan terbaik dalam keseharian.','Belajar sirah bersama keluarga mendekatkan hati.'],
  'Akhlak Nabi ﷺ apa yang ingin kamu tiru minggu ini?'
from public.series s, generate_series(1,21) g where s.slug = 'siroh-nabawiyah-seri-pertama';

insert into public.episodes(series_id, number, title, synopsis, published, release_at, ibrah, discussion_question)
select s.id, v.n, v.t, v.syn, true, now() - make_interval(days => 15 - v.n), v.ib, v.dq
from public.series s, (values
 (1,'Imam Ahmad & Penjual Roti','Dalam perjalanan, Imam Ahmad bermalam di dekat masjid dan bertemu seorang penjual roti yang selalu berzikir sambil bekerja. Dari pertemuan itu, terungkap kisah doa yang dikabulkan.', array['Berzikir bisa dilakukan sambil bekerja.','Orang sederhana pun bisa sangat mulia di sisi Allah.','Rendah hati kepada siapa saja yang kita temui.'], 'Zikir apa yang bisa kita ucapkan bersama saat beraktivitas di rumah?'),
 (2,'Imam Syafi''i: Segera Pulang Saat Ibu Memanggil','Imam Syafi''i kecil sangat mencintai ilmu, tetapi beliau lebih mencintai ibunya. Ketika ibu memanggil, beliau segera pulang tanpa menunda.', array['Berbakti kepada ibu didahulukan.','Ilmu yang berkah tumbuh dari adab yang baik.','Bersegera memenuhi panggilan orang tua.'], 'Apa yang biasanya kamu lakukan saat ayah atau ibu memanggil?'),
 (3,'Imam Malik: Enam Belas Sengatan','Saat mengajarkan hadits, Imam Malik disengat kalajengking berkali-kali, namun beliau tetap tenang demi memuliakan majelis ilmu.', array['Memuliakan majelis ilmu.','Sabar menahan rasa sakit.','Bersungguh-sungguh dalam menuntut dan mengajarkan ilmu.'], 'Bagaimana cara kita bersikap sopan ketika guru sedang mengajar?'),
 (4,'Imam Abu Hanifah: Tetangga Tukang Sepatu','Imam Abu Hanifah memiliki tetangga tukang sepatu yang sering bernyanyi keras di malam hari. Ketika tetangga itu ditangkap, beliau justru datang menolongnya.', array['Berbuat baik kepada tetangga.','Membalas gangguan dengan kebaikan.','Kepedulian dapat mengubah hati seseorang.'], 'Kebaikan apa yang bisa keluarga kita lakukan untuk tetangga?')
) as v(n,t,syn,ib,dq) where s.slug = 'komik-para-ulama';

insert into public.episodes(series_id, number, title, synopsis, published, release_at, ibrah, discussion_question)
select s.id, 1, 'Memberi Semua Hartanya', 'Ketika Rasulullah ﷺ mengajak para sahabat bersedekah untuk perjuangan, Abu Bakar datang membawa seluruh hartanya. Saat ditanya apa yang ia tinggalkan untuk keluarganya, jawabannya membuat semua terharu.', true, now() - interval '2 days',
  array['Yakin bahwa Allah Maha Pemberi rezeki.','Bersedekah dengan hati yang ikhlas.','Mencintai Allah dan Rasul-Nya di atas segalanya.'],
  'Apa yang bisa kita sedekahkan minggu ini, walau sedikit?'
from public.series s where s.slug = 'abu-bakar-ash-shiddiq';

insert into public.episodes(series_id, number, title, synopsis, published, release_at, ibrah, discussion_question)
select s.id, v.n, v.t, v.syn, true, now() - make_interval(days => 5 - v.n), v.ib, v.dq
from public.series s, (values
 (0,'Chapter 0: Prolog','Raka, siswa SMA biasa, tiba-tiba melihat "gerbang fitnah" muncul di sekitarnya — godaan yang menjelma seperti level dalam game. Ia harus memilih: menyerah pada nafsu atau mulai berlatih.', array['Godaan sering datang dalam bentuk yang terlihat menyenangkan.','Mengenali kelemahan diri adalah langkah awal perbaikan.','Setiap orang bisa memilih untuk berubah.'], 'Godaan apa yang paling sering dihadapi remaja zaman sekarang, dan bagaimana menghadapinya?'),
 (1,'Chapter 1: Riyadhah Pertama','Raka memulai latihan jiwa pertamanya: menjaga pandangan dan mengatur waktu layar. Ternyata level pertama tidak semudah yang ia kira.', array['Perubahan dimulai dari langkah kecil yang konsisten.','Menjaga pandangan adalah latihan menjaga hati.','Teman yang baik membantu kita bertahan.'], 'Kebiasaan kecil apa yang ingin kamu latih selama seminggu ke depan?'),
 (2,'Chapter 2: Yang Tertinggal di Dalam','Setelah berhasil di level pertama, Raka menyadari musuh terbesarnya bukan di luar, melainkan rasa bangga diri yang tumbuh di dalam hatinya.', array['Waspada terhadap rasa bangga diri setelah berhasil.','Keberhasilan adalah karunia Allah, bukan semata usaha kita.','Muhasabah membantu kita jujur pada diri sendiri.'], 'Bagaimana cara kita tetap rendah hati ketika berhasil?')
) as v(n,t,syn,ib,dq) where s.slug = 'nafs-leveling';

insert into public.episode_pages(episode_id, position, image_url)
select e.id, p, '/api/public/sample-page/' || e.id || '/' || p
from public.episodes e, generate_series(1,3) p;

insert into public.quiz_questions(episode_id, position, question, options, correct_index)
select e.id, 1, 'Apa judul episode yang baru saja kamu baca?', array[e.title, 'Kisah Lain', 'Belum Ada Judul'], 0 from public.episodes e;
insert into public.quiz_questions(episode_id, position, question, options, correct_index)
select e.id, 2, 'Episode ini termasuk dalam seri apa?', array['Komik Sains', s.title, 'Dongeng Hewan'], 1 from public.episodes e join public.series s on s.id = e.series_id;
insert into public.quiz_questions(episode_id, position, question, options, correct_index)
select e.id, 3, 'Pelajaran apa yang sesuai dengan kisah ini?', array['Tidak ada pelajarannya', 'Boleh berbuat sesukanya', coalesce(e.ibrah[1], 'Meneladani kebaikan dalam kisah')], 2 from public.episodes e;

insert into public.plans(name, duration_days, price_idr) values
('Langganan Bulanan', 30, 29000), ('Langganan 3 Bulan', 90, 79000), ('Langganan Tahunan', 365, 249000);
