# Youth Service Philippines

Official Technical Documentation

## 1. Purpose

Youth Service Philippines is a web application for presenting organization programs, volunteer opportunities, and local chapters while supporting internal administration through role-based access.

The application is designed for:

- public visitors who browse content and submit applications
- administrators who manage site content and review applications
- chapter heads who manage their assigned chapter details

## 2. Technology Stack

- Frontend: React 19 + Vite 7
- Styling: Tailwind CSS
- Database and authentication: Supabase
- Hosting: Vercel

## 3. Functional Scope

### Public-facing features

- Browse programs
- Browse volunteer opportunities
- Browse chapters
- Submit membership applications
- Submit chapter applications

### Admin features

- Sign in with Supabase Auth
- Manage programs
- Manage opportunities
- Manage chapters
- Review membership applications
- Review chapter applications
- Manage chapter head profile assignments

### Chapter head features

- Sign in with Supabase Auth
- View assigned chapter
- Update assigned chapter name, location, and description

## 4. Role Model

The application uses a simple role structure stored in `public.profiles`.

### Roles

- `admin`
- `chapter_head`

### Access model

- Public users can read public content.
- Public users can submit membership and chapter applications.
- Admins can manage all content and review applications.
- Chapter heads can update only the chapter assigned to their profile.

## 5. Application Architecture

### Frontend

The main UI logic is implemented in:

- [`src/App.jsx`](/c:/Users/ellie/Downloads/wiwin/src/App.jsx)
- [`src/AdminMembershipSection.jsx`](/c:/Users/ellie/Downloads/wiwin/src/AdminMembershipSection.jsx)

The frontend:

- loads public content from Supabase
- loads role-specific data after authentication
- falls back to local browser demo mode if Supabase environment variables are missing

### Supabase client

Supabase setup is implemented in:

- [`src/lib/supabase.js`](/c:/Users/ellie/Downloads/wiwin/src/lib/supabase.js)

This file initializes the client using:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 6. Database Design

The schema is defined in:

- [`supabase/schema.sql`](/c:/Users/ellie/Downloads/wiwin/supabase/schema.sql)

### Tables

- `programs`
- `opportunities`
- `chapters`
- `profiles`
- `member_applications`
- `chapter_applications`

### Important table responsibilities

#### `programs`

Stores public program content including:

- title
- description
- image reference

#### `opportunities`

Stores volunteer opportunity records including:

- event name
- event date
- location
- description

#### `chapters`

Stores chapter information including:

- chapter name
- location
- description

#### `profiles`

Maps authenticated Supabase users to application roles.

Fields include:

- `id` linked to `auth.users.id`
- `email`
- `full_name`
- `role`
- `chapter_id`

#### `member_applications`

Stores membership submissions from public visitors.

#### `chapter_applications`

Stores requests to open new chapters.

## 7. Security Model

Row Level Security is enabled for all application tables.

### Policy summary

- Public content is readable by `anon` and `authenticated`.
- Application submission is allowed to public users.
- Admin-only write operations are enforced through role-aware SQL helper functions.
- Chapter-head write access is restricted to the assigned chapter.

### Important note

The browser application does not create Supabase Auth users directly. This is intentional. Auth user creation must be done through the Supabase Dashboard or a secure server-side admin process.

## 8. Admin User and Chapter Head Management

### Admin setup

1. Create the Auth user in Supabase Authentication.
2. Insert a matching row into `public.profiles` with role `admin`.

### Chapter head setup

1. Create the Auth user in Supabase Authentication.
2. Ensure the target chapter exists in `public.chapters`.
3. Insert a matching `public.profiles` row with role `chapter_head` and the target `chapter_id`.

### Admin panel user management

The admin dashboard can manage `chapter_head` profile rows for existing Auth users.

It can:

- create chapter head profile entries
- assign chapters
- update email, name, and chapter assignment
- remove profile entries

It cannot:

- create Supabase Auth users
- reset passwords
- send invitations

## 9. Seed Data

Optional starter data is provided in:

- [`supabase/seed.sql`](/c:/Users/ellie/Downloads/wiwin/supabase/seed.sql)

Before running it:

- replace placeholder Auth UUIDs with real user ids from Supabase Authentication

## 10. Environment Variables

Required frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Reference file:

- [`.env.example`](/c:/Users/ellie/Downloads/wiwin/.env.example)

## 11. Local Development

### Requirements

- Node.js `20.19.0` or newer
- npm `10` or newer

### Commands

```bash
npm install
npm run dev
```

## 12. Build and Quality Checks

```bash
npm run lint
npm run build
```

The production build output is generated in `dist/`.

## 13. Deployment

Deployment target: Vercel

Configuration file:

- [`vercel.json`](/c:/Users/ellie/Downloads/wiwin/vercel.json)

### Deployment requirements

- connect the GitHub repository to Vercel
- configure `VITE_SUPABASE_URL`
- configure `VITE_SUPABASE_PUBLISHABLE_KEY`
- ensure the latest schema is applied in Supabase

### Vercel environments

Set the environment variables in:

- Production
- Preview
- Development

## 14. Operational Notes

- Public data depends on successful Supabase reads.
- Authenticated dashboards depend on both Supabase Auth and `public.profiles`.
- If a signed-in user has no matching `profiles` row, the dashboard will show a profile setup warning.
- The app currently stores uploaded program images as data URLs. For larger-scale production use, migrate media handling to Supabase Storage.

## 15. Recommended Next Improvements

- Move images to Supabase Storage
- Add server-side or edge-function based Auth user creation for admins
- Add audit logging for profile and content changes
- Add table pagination or search for larger admin datasets
- Add automated tests for admin and chapter-head flows
