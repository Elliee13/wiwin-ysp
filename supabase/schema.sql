create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_date date not null,
  location text not null default '',
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin', 'chapter_head')),
  chapter_id uuid references public.chapters (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.member_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chapter_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  description text not null default '',
  applicant_name text not null,
  applicant_email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_programs_updated_at on public.programs;
create trigger set_programs_updated_at
before update on public.programs
for each row
execute function public.set_updated_at();

drop trigger if exists set_opportunities_updated_at on public.opportunities;
create trigger set_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_updated_at();

drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at
before update on public.chapters
for each row
execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_member_applications_updated_at on public.member_applications;
create trigger set_member_applications_updated_at
before update on public.member_applications
for each row
execute function public.set_updated_at();

drop trigger if exists set_chapter_applications_updated_at on public.chapter_applications;
create trigger set_chapter_applications_updated_at
before update on public.chapter_applications
for each row
execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.opportunities enable row level security;
alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.member_applications enable row level security;
alter table public.chapter_applications enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_chapter_id()
returns uuid
language sql
stable
as $$
  select chapter_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_chapter_head()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'chapter_head', false)
$$;

drop policy if exists "public can read programs" on public.programs;
create policy "public can read programs"
on public.programs
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage programs" on public.programs;
drop policy if exists "admins can manage programs" on public.programs;
create policy "admins can manage programs"
on public.programs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read opportunities" on public.opportunities;
create policy "public can read opportunities"
on public.opportunities
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage opportunities" on public.opportunities;
drop policy if exists "admins can manage opportunities" on public.opportunities;
create policy "admins can manage opportunities"
on public.opportunities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read chapters" on public.chapters;
create policy "public can read chapters"
on public.chapters
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated can manage chapters" on public.chapters;
drop policy if exists "admins can manage chapters" on public.chapters;
create policy "admins can manage chapters"
on public.chapters
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chapter heads can update assigned chapter" on public.chapters;
create policy "chapter heads can update assigned chapter"
on public.chapters
for update
to authenticated
using (
  public.is_chapter_head()
  and id = public.current_user_chapter_id()
)
with check (
  public.is_chapter_head()
  and id = public.current_user_chapter_id()
);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage profiles" on public.profiles;
create policy "admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can submit member applications" on public.member_applications;
create policy "public can submit member applications"
on public.member_applications
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "authenticated can review member applications" on public.member_applications;
drop policy if exists "admins can review member applications" on public.member_applications;
create policy "admins can review member applications"
on public.member_applications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can submit chapter applications" on public.chapter_applications;
create policy "public can submit chapter applications"
on public.chapter_applications
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "authenticated can review chapter applications" on public.chapter_applications;
drop policy if exists "admins can review chapter applications" on public.chapter_applications;
create policy "admins can review chapter applications"
on public.chapter_applications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
