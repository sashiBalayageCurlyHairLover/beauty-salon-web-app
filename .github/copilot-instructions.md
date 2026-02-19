# Beauty Salon Web App — Copilot Instructions

## Project Description

A full-featured **Beauty Salon** web application that allows clients to browse services, book appointments, view the gallery, and manage their profiles. Administrators can manage services, appointments, staff, and content through a dedicated admin panel.

---

## Architecture & Technology Stack

### Frontend
- **Languages**: HTML5, CSS3, vanilla JavaScript (ES Modules, no TypeScript)
- **UI Framework**: Bootstrap 5 for layout and components
- **Icons**: Bootstrap Icons or Font Awesome
- **Build Tool**: Vite (with npm)
- **Structure**: Multi-page application (MPA) — each page is a separate `.html` file

### Backend
- **Platform**: Supabase (BaaS)
  - **Database**: PostgreSQL via Supabase DB
  - **Authentication**: Supabase Auth (JWT-based, email/password)
  - **Storage**: Supabase Storage (for images, gallery photos, profile pictures)
  - **Edge Functions**: Optional — use for server-side logic (e.g. email notifications)

### Deployment
- **Platform**: Netlify (static site hosting with environment variables)
- **CI/CD**: Push to `main` branch triggers auto-deploy

### Repository
- **GitHub** repo with commit history for each feature

---

## Project Structure

```
beauty-salon/
├── .github/
│   └── copilot-instructions.md   ← This file
├── public/                        ← Static assets (images, fonts, favicons)
├── src/
│   ├── pages/                     ← HTML page files (one per route)
│   │   ├── index.html             ← Home / Landing page
│   │   ├── services.html          ← Services listing
│   │   ├── booking.html           ← Appointment booking
│   │   ├── gallery.html           ← Photo gallery
│   │   ├── about.html             ← About the salon
│   │   ├── contact.html           ← Contact page
│   │   ├── login.html             ← Login page
│   │   ├── register.html          ← Registration page
│   │   ├── profile.html           ← User profile & appointments
│   │   └── admin/
│   │       ├── index.html         ← Admin dashboard
│   │       ├── services.html      ← Manage services
│   │       ├── appointments.html  ← Manage appointments
│   │       ├── staff.html         ← Manage staff
│   │       └── gallery.html       ← Manage gallery
│   ├── components/                ← Reusable HTML/JS UI components
│   │   ├── navbar.js              ← Top navigation bar
│   │   ├── footer.js              ← Footer
│   │   └── toast.js               ← Notification toasts
│   ├── services/                  ← Business logic / API layer
│   │   ├── supabase.js            ← Supabase client initialization
│   │   ├── auth.service.js        ← Auth: login, register, logout, session
│   │   ├── booking.service.js     ← Appointment CRUD
│   │   ├── services.service.js    ← Salon services CRUD
│   │   ├── gallery.service.js     ← Gallery photo management
│   │   ├── staff.service.js       ← Staff management
│   │   └── storage.service.js     ← File upload / download (Supabase Storage)
│   ├── utils/                     ← Utility helpers
│   │   ├── auth.guard.js          ← Redirect unauthenticated/unauthorized users
│   │   ├── date.utils.js          ← Date formatting helpers
│   │   └── validators.js          ← Form validation helpers
│   └── styles/
│       ├── main.css               ← Global styles and CSS variables
│       ├── theme.css              ← Color palette, typography, design tokens
│       └── components.css         ← Custom component styles
├── supabase/
│   └── migrations/                ← SQL migration files (versioned)
├── .env.example                   ← Environment variable template
├── vite.config.js                 ← Vite configuration (MPA setup)
├── package.json
└── README.md
```

---

## UI Guidelines

### Design Principles
- **Elegant & Luxurious**: The salon aesthetic should feel premium — warm tones, refined typography, tasteful animations
- **Mobile-first**: All pages must be fully responsive using Bootstrap grid and utility classes
- **Accessible**: Use semantic HTML, ARIA labels, and sufficient color contrast
- **Consistent**: Reuse the same navbar, footer, and color palette across all pages

### Colors (CSS Variables in `theme.css`)
```css
:root {
  --color-primary: #c9a96e;     /* Gold accent */
  --color-secondary: #2d2d2d;   /* Near-black for text */
  --color-bg: #faf7f4;          /* Warm off-white background */
  --color-surface: #ffffff;
  --color-muted: #6b6b6b;
  --color-danger: #c0392b;
}
```

### Typography
- Display headings: `'Playfair Display', serif` (Google Fonts)
- Body text: `'Lato', sans-serif` (Google Fonts)

### Components & Icons
- Use **Bootstrap 5** components: cards, modals, forms, buttons, badges, navbar, offcanvas
- Use **Bootstrap Icons** (`bi-*`) or Font Awesome for all icons
- Show loading spinners during async operations
- Show toast notifications for success/error feedback

---

## Pages & Navigation Guidelines

### Public Pages (no login required)
| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, highlights, CTA to book |
| Services | `services.html` | Browse service categories and prices |
| Gallery | `gallery.html` | Photo gallery from the salon |
| About | `about.html` | Salon story, team, values |
| Contact | `contact.html` | Contact form, map, address |
| Login | `login.html` | Email/password login |
| Register | `register.html` | New user registration |

### Authenticated User Pages
| Page | File | Description |
|------|------|-------------|
| Booking | `booking.html` | Book an appointment (requires login) |
| Profile | `profile.html` | View/edit profile, manage appointments |

### Admin Pages (`/admin/`)
| Page | File | Description |
|------|------|-------------|
| Dashboard | `admin/index.html` | Stats overview |
| Services | `admin/services.html` | Add/edit/delete salon services |
| Appointments | `admin/appointments.html` | View and manage all bookings |
| Staff | `admin/staff.html` | Manage staff members |
| Gallery | `admin/gallery.html` | Upload/delete gallery photos |

### Navigation Rules
- The navbar should show **Login / Register** for unauthenticated users
- The navbar should show **Profile / Logout** for logged-in users
- The navbar should show an extra **Admin** link for admin users
- Use `auth.guard.js` to protect pages: redirect to login if unauthenticated, redirect to home if unauthorized role

---

## Backend & Database Guidelines

### Supabase Client
- Initialize once in `src/services/supabase.js`
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`
- Never commit real credentials — use `.env.example` with placeholder values

### Database Schema (Main Tables)

```sql
-- Users extended profile (linked to auth.users)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
)

-- Role-based access control
user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  role text CHECK (role IN ('admin', 'client')) DEFAULT 'client'
)

-- Salon service categories
categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text
)

-- Salon services
services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  description text,
  duration_minutes int,
  price numeric(10,2),
  image_url text,
  is_active boolean DEFAULT true
)

-- Staff members
staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text,         -- e.g. "Hairstylist", "Nail Artist"
  bio text,
  avatar_url text,
  is_active boolean DEFAULT true
)

-- Appointments / Bookings
appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id),
  service_id uuid REFERENCES services(id),
  staff_id uuid REFERENCES staff(id),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text CHECK (status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
)

-- Gallery photos
gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
)
```

### Migrations
- All schema changes must be done via migration files in `supabase/migrations/`
- Name files: `YYYYMMDDHHMMSS_description.sql`
- Run with: `supabase db push` or via Supabase dashboard SQL editor
- Never manually alter production DB without a corresponding migration file

### Row-Level Security (RLS)
- **Enable RLS on all tables**
- Public read access for: `services`, `categories`, `staff`, `gallery`
- Authenticated read/write for own data: `profiles`, `appointments`
- Admin-only write access for: `services`, `categories`, `staff`, `gallery`, all `appointments`
- Use `auth.uid()` in RLS policies for user-specific access
- Check admin role via `user_roles` table in RLS policies

---

## Authentication & Authorization Guidelines

### Auth Flow
- Use **Supabase Auth** with email/password strategy
- On register: create user via `supabase.auth.signUp()`, then insert row into `profiles` and `user_roles`
- On login: use `supabase.auth.signInWithPassword()`
- On logout: use `supabase.auth.signOut()`
- Store session in browser via Supabase's built-in session management (localStorage)

### Role Checking
- After login, query `user_roles` table for the current user's role
- Store role in memory/sessionStorage for UI rendering decisions
- Always re-verify role server-side via RLS (never trust client-only checks for data access)

### Route Protection (`auth.guard.js`)
```js
// Example usage at top of protected pages:
import { requireAuth, requireAdmin } from '../utils/auth.guard.js';

await requireAuth();      // Redirect to /login if not authenticated
await requireAdmin();     // Redirect to / if not admin
```

### Sample Credentials (for testing)
```
Admin:  admin@salon.demo / Admin123!
Client: client@salon.demo / Client123!
```

---

## Storage Guidelines

- Use **Supabase Storage** buckets:
  - `avatars` — user profile pictures (private, user-scoped)
  - `gallery` — salon gallery photos (public)
  - `services` — service/category images (public)
  - `staff` — staff member photos (public)
- Upload via `storage.service.js` helper
- Always generate a public URL after upload using `supabase.storage.from(bucket).getPublicUrl(path)`
- Enforce file type validation (images only: `.jpg`, `.png`, `.webp`) before uploading
- Enforce file size limit (max 5MB) client-side

---

## Code Style & Best Practices

- Use **ES Modules** (`import`/`export`) throughout
- Keep each file focused on a single responsibility (service, component, util, or page)
- Use `async/await` for all Supabase calls; always handle errors with `try/catch`
- Never hardcode credentials or secrets — use `.env` variables via Vite's `import.meta.env`
- Add JSDoc comments to all exported functions
- Validate all user inputs before sending to Supabase
- Show loading state (spinner) during async operations; disable submit buttons to prevent double-submit
- Display user-friendly error messages via toast notifications
- Use consistent naming: `camelCase` for JS, `kebab-case` for CSS classes and file names

---

## Vite Configuration

Configure Vite for MPA (multi-page app) in `vite.config.js`:

```js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
        services: resolve(__dirname, 'src/pages/services.html'),
        booking: resolve(__dirname, 'src/pages/booking.html'),
        gallery: resolve(__dirname, 'src/pages/gallery.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
        contact: resolve(__dirname, 'src/pages/contact.html'),
        login: resolve(__dirname, 'src/pages/login.html'),
        register: resolve(__dirname, 'src/pages/register.html'),
        profile: resolve(__dirname, 'src/pages/profile.html'),
        adminIndex: resolve(__dirname, 'src/pages/admin/index.html'),
        adminServices: resolve(__dirname, 'src/pages/admin/services.html'),
        adminAppointments: resolve(__dirname, 'src/pages/admin/appointments.html'),
        adminStaff: resolve(__dirname, 'src/pages/admin/staff.html'),
        adminGallery: resolve(__dirname, 'src/pages/admin/gallery.html'),
      }
    }
  }
});
```

---

## Netlify Deployment

- Set environment variables in Netlify dashboard under **Site Settings → Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Add `netlify.toml` for build config:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```
- Add `_redirects` file in `public/` to handle client-side routing if needed:
```
/* /index.html 200
```