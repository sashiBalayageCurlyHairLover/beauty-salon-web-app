create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_app_users_from_auth_users()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.app_users (id, email, created_at, updated_at)
    values (new.id, new.email, coalesce(new.created_at, now()), now())
    on conflict (id) do update
      set email = excluded.email,
          updated_at = now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    update public.app_users
    set email = new.email,
        updated_at = now()
    where id = new.id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.app_users where id = old.id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_app_users_from_auth_users on auth.users;
create trigger trg_sync_app_users_from_auth_users
after insert or update of email or delete
on auth.users
for each row
execute function public.sync_app_users_from_auth_users();

insert into public.app_users (id, email, created_at, updated_at)
select u.id, u.email, coalesce(u.created_at, now()), now()
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

alter table public.app_users enable row level security;

drop policy if exists "app_users_select_own" on public.app_users;
create policy "app_users_select_own"
on public.app_users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "app_users_admin_all" on public.app_users;
create policy "app_users_admin_all"
on public.app_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_admin() then
    raise exception 'Admin role is required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admin cannot delete own account';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
