# Youth Service Philippines

Youth Service Philippines is a React + Vite single-page application prepared for Supabase-backed data and Vercel deployment.

Formal project documentation is available in [`docs/OFFICIAL_DOCUMENTATION.md`](./docs/OFFICIAL_DOCUMENTATION.md).

## Stack

- React 19
- Vite 7
- Supabase for database and admin authentication
- Vercel for frontend hosting

## Requirements

- Node.js `20.19.0` or newer
- npm `10` or newer

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

If these values are missing, the app falls back to local demo storage in the browser so the UI can still run.

## Supabase setup

1. Create a Supabase project.
2. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
3. In Supabase Auth, create at least one email/password user for admin access.
4. Copy your project URL and publishable key into `.env.local`.
5. Optionally run [`supabase/seed.sql`](./supabase/seed.sql) after replacing the placeholder Auth UUIDs.

The schema includes:

- `programs`
- `opportunities`
- `chapters`
- `profiles`
- `member_applications`
- `chapter_applications`

Policy model:

- Public users can read programs, opportunities, and chapters.
- Public users can submit membership and chapter applications.
- `admin` users can manage content and review applications.
- `chapter_head` users can update only their assigned chapter.

Admin dashboard note:

- The app can manage `chapter_head` profile rows from the admin panel.
- It does not create Supabase Auth users in the browser.
- Create the Auth user first in Supabase Dashboard, then paste that user UUID into the admin panel.

## Simple roles

The app uses a small role model:

- `admin`
- `chapter_head`

Each signed-in Supabase user must have a matching row in `public.profiles`.

Example flow:

1. Create the user in `Authentication -> Users`.
2. Copy that user UUID.
3. Insert a matching row into `public.profiles`.

Example SQL for an admin user:

```sql
insert into public.profiles (id, email, full_name, role)
values (
  'AUTH_USER_UUID_HERE',
  'admin@ysp.ph',
  'Main Admin',
  'admin'
);
```

Example SQL for a chapter head:

```sql
insert into public.chapters (name, location, description)
values (
  'YSP Manila Chapter',
  'Manila, Philippines',
  'Pilot chapter for testing.'
)
returning id;
```

Then use the returned chapter id:

```sql
insert into public.profiles (id, email, full_name, role, chapter_id)
values (
  'AUTH_USER_UUID_HERE',
  'chapterhead@ysp.ph',
  'Sample Chapter Head',
  'chapter_head',
  'CHAPTER_UUID_HERE'
);
```

If you want a ready-made starter dataset, use [`supabase/seed.sql`](./supabase/seed.sql). Replace these placeholders first:

- `00000000-0000-0000-0000-000000000001` with your admin Auth user id
- `00000000-0000-0000-0000-000000000002` with your chapter head Auth user id

## Local development

```bash
npm install
npm run dev
```

## Production checks

```bash
npm run lint
npm run build
```

The production build is emitted to `dist/`.

## Vercel deployment

This repo includes [`vercel.json`](./vercel.json) configured for:

- Vite framework deployment
- static output from `dist`
- SPA rewrites to `index.html`
- basic security headers

In Vercel, add the same environment variables from `.env.local` to:

- Production
- Preview
- Development

Then deploy with either approach:

1. Import the repo into Vercel and keep the detected defaults.
2. Or use the CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

## Notes

- Program images are currently stored as data URLs in the database. This works for small uploads, but Supabase Storage is the better next step for real media handling.
- Without Supabase env vars, the app intentionally stays usable in local demo mode.
