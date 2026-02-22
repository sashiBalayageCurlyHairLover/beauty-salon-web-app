create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client'))
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes int,
  price numeric(10,2),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_client_id on public.appointments(client_id);
create index if not exists idx_appointments_date_time on public.appointments(appointment_date, appointment_time);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.gallery enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "user_roles_admin_all"
on public.user_roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "categories_public_read"
on public.categories
for select
to anon, authenticated
using (true);

create policy "categories_admin_write"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "services_public_read"
on public.services
for select
to anon, authenticated
using (true);

create policy "services_admin_write"
on public.services
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "staff_public_read"
on public.staff
for select
to anon, authenticated
using (true);

create policy "staff_admin_write"
on public.staff
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "gallery_public_read"
on public.gallery
for select
to anon, authenticated
using (true);

create policy "gallery_admin_write"
on public.gallery
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "appointments_select_own"
on public.appointments
for select
to authenticated
using (client_id = auth.uid());

create policy "appointments_insert_own"
on public.appointments
for insert
to authenticated
with check (client_id = auth.uid());

create policy "appointments_update_own"
on public.appointments
for update
to authenticated
using (client_id = auth.uid())
with check (client_id = auth.uid());

create policy "appointments_delete_own"
on public.appointments
for delete
to authenticated
using (client_id = auth.uid());

create policy "appointments_admin_all"
on public.appointments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
