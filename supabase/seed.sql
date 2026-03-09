-- Replace the placeholder UUID values below with real Auth user IDs from
-- Supabase Dashboard -> Authentication -> Users before running this script.

-- 1. Create a sample chapter and capture the ID.
with inserted_chapter as (
  insert into public.chapters (name, location, description)
  values (
    'YSP Manila Chapter',
    'Manila, Philippines',
    'Pilot chapter for testing the chapter head dashboard.'
  )
  returning id
)
insert into public.profiles (id, email, full_name, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'admin@ysp.ph',
  'Main Admin',
  'admin'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role;

with target_chapter as (
  select id
  from public.chapters
  where name = 'YSP Manila Chapter'
  order by created_at desc
  limit 1
)
insert into public.profiles (id, email, full_name, role, chapter_id)
select
  '00000000-0000-0000-0000-000000000002',
  'chapterhead@ysp.ph',
  'Sample Chapter Head',
  'chapter_head',
  target_chapter.id
from target_chapter
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  chapter_id = excluded.chapter_id;

insert into public.member_applications (name, email, status)
values (
  'Juan Dela Cruz',
  'juan@example.com',
  'pending'
);

insert into public.chapter_applications (
  name,
  location,
  description,
  applicant_name,
  applicant_email,
  status
)
values (
  'YSP Cebu Chapter',
  'Cebu City, Philippines',
  'Volunteer-led chapter focused on youth outreach.',
  'Maria Santos',
  'maria@example.com',
  'pending'
);
