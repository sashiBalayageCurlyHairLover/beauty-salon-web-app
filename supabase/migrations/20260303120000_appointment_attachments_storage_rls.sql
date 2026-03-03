insert into storage.buckets (id, name, public)
values ('appointment-attachments', 'appointment-attachments', false)
on conflict (id) do nothing;

create or replace function public.can_access_appointment(target_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.id = target_appointment_id
      and (a.client_id = auth.uid() or public.is_admin())
  );
$$;

grant execute on function public.can_access_appointment(uuid) to authenticated;

create or replace function public.storage_appointment_id_from_name(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  appointment_segment text;
begin
  appointment_segment := split_part(object_name, '/', 1);

  if appointment_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return appointment_segment::uuid;
  end if;

  return null;
end;
$$;

grant execute on function public.storage_appointment_id_from_name(text) to authenticated;

create table if not exists public.appointment_attachments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_ext text,
  mime_type text,
  file_size bigint not null check (file_size >= 0),
  bucket_name text not null default 'appointment-attachments',
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointment_attachments_appointment_id
  on public.appointment_attachments(appointment_id);

create index if not exists idx_appointment_attachments_uploaded_by
  on public.appointment_attachments(uploaded_by);

alter table public.appointment_attachments enable row level security;

drop policy if exists "appointment_attachments_select_access" on public.appointment_attachments;
create policy "appointment_attachments_select_access"
on public.appointment_attachments
for select
to authenticated
using (public.can_access_appointment(appointment_id));

drop policy if exists "appointment_attachments_insert_access" on public.appointment_attachments;
create policy "appointment_attachments_insert_access"
on public.appointment_attachments
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and bucket_name = 'appointment-attachments'
  and public.can_access_appointment(appointment_id)
);

drop policy if exists "appointment_attachments_delete_access" on public.appointment_attachments;
create policy "appointment_attachments_delete_access"
on public.appointment_attachments
for delete
to authenticated
using (public.can_access_appointment(appointment_id));

drop policy if exists "appointment_attachments_update_access" on public.appointment_attachments;
create policy "appointment_attachments_update_access"
on public.appointment_attachments
for update
to authenticated
using (public.can_access_appointment(appointment_id))
with check (
  public.can_access_appointment(appointment_id)
  and bucket_name = 'appointment-attachments'
);

drop policy if exists "storage_appointment_attachments_select" on storage.objects;
create policy "storage_appointment_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'appointment-attachments'
  and public.can_access_appointment(public.storage_appointment_id_from_name(name))
);

drop policy if exists "storage_appointment_attachments_insert" on storage.objects;
create policy "storage_appointment_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'appointment-attachments'
  and owner = auth.uid()
  and public.can_access_appointment(public.storage_appointment_id_from_name(name))
);

drop policy if exists "storage_appointment_attachments_delete" on storage.objects;
create policy "storage_appointment_attachments_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'appointment-attachments'
  and public.can_access_appointment(public.storage_appointment_id_from_name(name))
);

drop policy if exists "storage_appointment_attachments_update" on storage.objects;
create policy "storage_appointment_attachments_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'appointment-attachments'
  and public.can_access_appointment(public.storage_appointment_id_from_name(name))
)
with check (
  bucket_id = 'appointment-attachments'
  and public.can_access_appointment(public.storage_appointment_id_from_name(name))
);
