create table if not exists public.support_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'open',
  has_unread_admin boolean not null default false,
  has_unread_user boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.support_chats to authenticated;
grant all on public.support_chats to service_role;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.support_chats(id) on delete cascade,
  sender_id uuid,
  sender_role text not null check (sender_role in ('user','admin','bot')),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
grant select, insert on public.support_messages to authenticated;
grant all on public.support_messages to service_role;

create index if not exists support_messages_chat_idx on public.support_messages(chat_id, created_at);

alter table public.support_chats enable row level security;
alter table public.support_messages enable row level security;

create policy "user reads own chat" on public.support_chats
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "user creates own chat" on public.support_chats
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user/admin updates chat" on public.support_chats
  for update to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin deletes chat" on public.support_chats
  for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "read own/admin messages" on public.support_messages
  for select to authenticated using (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.support_chats c where c.id = chat_id and c.user_id = auth.uid())
  );
create policy "insert own/admin messages" on public.support_messages
  for insert to authenticated with check (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.support_chats c where c.id = chat_id and c.user_id = auth.uid())
  );

create or replace function public.support_messages_before_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.sender_role <> 'bot' then
    if public.has_role(auth.uid(),'admin') then
      new.sender_role := 'admin';
    else
      new.sender_role := 'user';
    end if;
    new.sender_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists trg_support_messages_before_insert on public.support_messages;
create trigger trg_support_messages_before_insert
  before insert on public.support_messages
  for each row execute function public.support_messages_before_insert();

create or replace function public.support_messages_after_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.support_chats
     set last_message_at = now(),
         has_unread_admin = case when new.sender_role = 'user' then true else has_unread_admin end,
         has_unread_user  = case when new.sender_role in ('admin','bot') then true else has_unread_user end
   where id = new.chat_id;
  return new;
end $$;

drop trigger if exists trg_support_messages_after_insert on public.support_messages;
create trigger trg_support_messages_after_insert
  after insert on public.support_messages
  for each row execute function public.support_messages_after_insert();

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  service_type text,
  review_date timestamptz NOT NULL DEFAULT now(),
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reviews_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(btrim(NEW.first_name)) = 0 THEN
    RAISE EXCEPTION 'Imię nie może być puste';
  END IF;
  IF length(btrim(NEW.last_name)) = 0 THEN
    RAISE EXCEPTION 'Nazwisko nie może być puste';
  END IF;
  IF length(btrim(NEW.content)) = 0 THEN
    RAISE EXCEPTION 'Treść opinii nie może być pusta';
  END IF;
  IF length(NEW.first_name) > 80 OR length(NEW.last_name) > 80 THEN
    RAISE EXCEPTION 'Imię/nazwisko zbyt długie';
  END IF;
  IF length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Treść opinii zbyt długa';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_validate_trigger ON public.reviews;
CREATE TRIGGER reviews_validate_trigger
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_validate();

CREATE OR REPLACE FUNCTION public.reviews_guard_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_visible IS DISTINCT FROM OLD.is_visible THEN
    RAISE EXCEPTION 'Klient nie może zmieniać widoczności opinii';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Klient nie może zmieniać właściciela opinii';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_guard_client_trigger ON public.reviews;
CREATE TRIGGER reviews_guard_client_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_guard_client();

CREATE POLICY "Public reads visible reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_visible = true OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins delete all reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.reviews REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_reviews_visible_date ON public.reviews(is_visible, review_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

CREATE TABLE IF NOT EXISTS public.popular_services (
  service_name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.popular_services TO anon;
GRANT SELECT, INSERT, DELETE ON public.popular_services TO authenticated;
GRANT ALL ON public.popular_services TO service_role;

ALTER TABLE public.popular_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "popular_services_select_all" ON public.popular_services
  FOR SELECT USING (true);

CREATE POLICY "popular_services_admin_insert" ON public.popular_services
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "popular_services_admin_delete" ON public.popular_services
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_slot TEXT,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'panel';

CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(is_priority, created_at DESC) WHERE deleted_at IS NULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chats; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.popular_services; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;