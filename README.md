# Beauty Salon Web App

Multi-page Beauty Salon web app built with Vite + vanilla JavaScript + Supabase Auth/DB.

## Features Implemented

- Supabase email/password authentication (`register`, `login`, `logout`)
- Auth-aware navigation and homepage actions
- Protected profile page for authenticated users
- User-specific appointments module:
	- Appointments list page (with count)
	- Separate create page
	- Separate edit page
	- Details page per appointment
	- Delete action from list page
- Success toast notifications after create/edit
- Custom 404 page for unknown routes
- Supabase migration and local migration SQL tracking
- Seed scripts for users, appointments, and reference data

## Current Routes

- `/` → Home
- `/login/` → Login
- `/register/` → Register
- `/profile/` → Profile (auth required)
- `/appointments/` → My appointments list (auth required)
- `/appointments/create/` → Create appointment (auth required)
- `/appointments/edit/?id=<appointment_id>` → Edit appointment (auth required)
- `/appointment/?id=<appointment_id>` → Appointment details (auth required)
- Unknown routes → custom `404` page

## Tech Stack

- Vite (MPA)
- Vanilla JavaScript (ES modules)
- Bootstrap 5 + Bootstrap Icons
- Supabase (`@supabase/supabase-js`)

## Environment Variables

Create a `.env` file in project root (template available in `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

```bash
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview production build
npm run seed:sample  # create sample auth users + one appointment each
npm run seed:reference # seed categories/services/staff and link appointments
```

## Seed Script Environment Variables

For `seed:sample`:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

For `seed:reference` (either option):

- Option A:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- Option B:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_ADMIN_EMAIL=...
SUPABASE_ADMIN_PASSWORD=...
```

## Database

Schema and RLS are applied for:

- `profiles`
- `user_roles`
- `categories`
- `services`
- `staff`
- `appointments`
- `gallery`

Key policy behavior:

- Public read for catalog/gallery tables
- Users can access only their own appointments/profile
- Admin role has elevated write access via RLS policies

Local SQL migration files are under:

- `supabase/migrations/`

## Notes

- Vite is configured as MPA in `vite.config.js`.
- Unknown dev routes are redirected to `404.html` by a Vite middleware plugin.
- Header/footer are shared components rendered on all pages.
