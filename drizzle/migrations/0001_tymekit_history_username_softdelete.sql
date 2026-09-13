alter table public.tickets
  add column if not exists client_name text,
  add column if not exists client_phone text,
  add column if not exists admin_reply text;

create table if not exists public.ticket_status_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  old_status text,
  new_status text not null,
  old_admin_reply text,
  new_admin_reply text,
  changed_by uuid,
  created_at timestamptz not null default now()
);

grant select on public.ticket_status_history to authenticated;
grant all on public.ticket_status_history to service_role;

create index if not exists idx_ticket_status_history_ticket on public.ticket_status_history(ticket_id);

alter table public.ticket_status_history enable row level security;

drop policy if exists "Users view own ticket history" on public.ticket_status_history;
create policy "Users view own ticket history"
on public.ticket_status_history
for select
to authenticated
using (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_status_history.ticket_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "Admins view all ticket history" on public.ticket_status_history;
create policy "Admins view all ticket history"
on public.ticket_status_history
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create or replace function public.log_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status is distinct from old.status)
     or (coalesce(new.admin_reply,'') is distinct from coalesce(old.admin_reply,'')) then
    insert into public.ticket_status_history
      (ticket_id, old_status, new_status, old_admin_reply, new_admin_reply, changed_by)
    values
      (new.id, old.status, new.status, old.admin_reply, new.admin_reply, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_ticket_status on public.tickets;
create trigger trg_log_ticket_status
after update on public.tickets
for each row execute function public.log_ticket_status_change();

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.validate_profile_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.username is not null then
    if length(new.username) < 3 or length(new.username) > 32 then
      raise exception 'Login musi mieć od 3 do 32 znaków';
    end if;
    if new.username !~ '^[a-zA-Z0-9_.-]+$' then
      raise exception 'Login może zawierać litery, cyfry oraz . _ -';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile_username_trg on public.profiles;
create trigger validate_profile_username_trg
before insert or update of username on public.profiles
for each row execute function public.validate_profile_username();

create or replace function public.get_email_by_username(_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(username) = lower(_username)
  limit 1;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

alter table public.tickets add column if not exists deleted_at timestamptz;
create index if not exists tickets_deleted_at_idx on public.tickets (deleted_at);

alter table public.tickets drop constraint if exists tickets_status_check;
alter table public.tickets add constraint tickets_status_check
  check (status = any (array['oczekuje','zaakceptowane','odrzucone','w trakcie','zakończone','nieaktywne']));

create or replace function public.tickets_guard_client_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  if coalesce(new.admin_reply,'') is distinct from coalesce(old.admin_reply,'') then
    raise exception 'Klient nie może zmieniać odpowiedzi administratora';
  end if;
  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Klient nie może usuwać zgłoszeń';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_tickets_guard_client on public.tickets;
create trigger trg_tickets_guard_client
before update on public.tickets
for each row execute function public.tickets_guard_client_fields();

drop policy if exists "Users view own tickets" on public.tickets;
create policy "Users view own tickets"
  on public.tickets for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

revoke execute on function public.log_ticket_status_change() from anon, authenticated, public;
revoke execute on function public.tickets_guard_client_fields() from anon, authenticated, public;