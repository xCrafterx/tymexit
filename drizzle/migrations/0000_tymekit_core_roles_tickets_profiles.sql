create type public.app_role as enum ('admin', 'client');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  service_type text not null,
  status text not null default 'oczekuje'
    check (status in ('oczekuje','zaakceptowane','odrzucone','w trakcie','zakończone')),
  admin_note text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.tickets to authenticated;
grant all on public.tickets to service_role;

create index tickets_user_id_idx on public.tickets(user_id);
create index tickets_status_idx on public.tickets(status);

alter table public.tickets enable row level security;

create policy "Users view own tickets"
on public.tickets for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins view all tickets"
on public.tickets for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users create own tickets"
on public.tickets for insert
to authenticated
with check (auth.uid() = user_id and status = 'oczekuje');

create policy "Users update own pending tickets"
on public.tickets for update
to authenticated
using (auth.uid() = user_id and status = 'oczekuje')
with check (auth.uid() = user_id and status = 'oczekuje');

create policy "Admins update all tickets"
on public.tickets for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete tickets"
on public.tickets for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client',
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins view all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins update all profiles"
  on public.profiles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'client';
begin
  if new.email = 'tymek2008@protonmail.com' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, v_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict do nothing;

  if v_role = 'admin' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email, role)
select u.id, u.email,
  case when u.email = 'tymek2008@protonmail.com' then 'admin' else 'client' end
from auth.users u
on conflict (id) do nothing;

create or replace function public.tickets_guard_client_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'Klient nie może zmieniać statusu zgłoszenia';
  end if;

  if new.admin_note is distinct from old.admin_note then
    raise exception 'Klient nie może zmieniać notatki administratora';
  end if;

  return new;
end;
$$;

drop trigger if exists tickets_guard_client_fields_trg on public.tickets;
create trigger tickets_guard_client_fields_trg
  before update on public.tickets
  for each row execute function public.tickets_guard_client_fields();

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.tickets_guard_client_fields() from public, anon, authenticated;