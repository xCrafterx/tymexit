ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_level TEXT NOT NULL DEFAULT 'Nowy klient',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_client_level_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_client_level_chk
  CHECK (client_level IN ('Nowy klient','Zaufany klient','VIP','Problemowy'));

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('oczekuje','zaakceptowane','w diagnozie','w naprawie','oczekuje na części','gotowe do odbioru','zakończone','odrzucone','nieaktywne'));

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ticket_attachments TO authenticated;
GRANT ALL ON public.ticket_attachments TO service_role;
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON public.ticket_attachments(ticket_id);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own attachments" ON public.ticket_attachments;
CREATE POLICY "Users view own attachments" ON public.ticket_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all attachments" ON public.ticket_attachments;
CREATE POLICY "Admins view all attachments" ON public.ticket_attachments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own attachments" ON public.ticket_attachments;
CREATE POLICY "Users insert own attachments" ON public.ticket_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins insert any attachments" ON public.ticket_attachments;
CREATE POLICY "Admins insert any attachments" ON public.ticket_attachments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete attachments" ON public.ticket_attachments;
CREATE POLICY "Admins delete attachments" ON public.ticket_attachments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.enforce_attachment_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c INT;
BEGIN
  SELECT count(*) INTO c FROM public.ticket_attachments WHERE ticket_id = NEW.ticket_id;
  IF c >= 5 THEN
    RAISE EXCEPTION 'Limit 5 plików na zgłoszenie został osiągnięty';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_attachment_limit ON public.ticket_attachments;
CREATE TRIGGER trg_enforce_attachment_limit BEFORE INSERT ON public.ticket_attachments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_attachment_limit();

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client','admin')),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id, created_at);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own ticket messages" ON public.ticket_messages;
CREATE POLICY "Users view own ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins view all ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert messages in own tickets" ON public.ticket_messages;
CREATE POLICY "Users insert messages in own tickets" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins insert messages" ON public.ticket_messages;
CREATE POLICY "Admins insert messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_message_sender_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.has_role(NEW.sender_id, 'admin') THEN
    NEW.sender_role := 'admin';
  ELSE
    NEW.sender_role := 'client';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_set_message_sender_role ON public.ticket_messages;
CREATE TRIGGER trg_set_message_sender_role BEFORE INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_message_sender_role();

CREATE OR REPLACE FUNCTION public.update_reputation_on_close()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_score INT; blk BOOLEAN;
BEGIN
  IF NEW.status = 'zakończone' AND (OLD.status IS DISTINCT FROM 'zakończone') THEN
    UPDATE public.profiles
       SET reputation_score = reputation_score + 10
     WHERE id = NEW.user_id
     RETURNING reputation_score, is_blacklisted INTO new_score, blk;

    IF blk THEN
      UPDATE public.profiles SET client_level = 'Problemowy' WHERE id = NEW.user_id;
    ELSIF new_score >= 50 THEN
      UPDATE public.profiles SET client_level = 'VIP' WHERE id = NEW.user_id;
    ELSIF new_score >= 10 THEN
      UPDATE public.profiles SET client_level = 'Zaufany klient' WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_update_reputation_on_close ON public.tickets;
CREATE TRIGGER trg_update_reputation_on_close AFTER UPDATE OF status ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_reputation_on_close();

CREATE OR REPLACE FUNCTION public.profiles_guard_client_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score
     OR NEW.client_level IS DISTINCT FROM OLD.client_level
     OR coalesce(NEW.notes,'') IS DISTINCT FROM coalesce(OLD.notes,'')
     OR NEW.is_blacklisted IS DISTINCT FROM OLD.is_blacklisted
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Klient nie może zmieniać pól reputacji/roli';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_profiles_guard_client_fields ON public.profiles;
CREATE TRIGGER trg_profiles_guard_client_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_client_fields();

DROP POLICY IF EXISTS "Users read own ticket files" ON storage.objects;
CREATE POLICY "Users read own ticket files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ticket-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins read all ticket files" ON storage.objects;
CREATE POLICY "Admins read all ticket files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Users upload own ticket files" ON storage.objects;
CREATE POLICY "Users upload own ticket files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins manage ticket files" ON storage.objects;
CREATE POLICY "Admins manage ticket files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'ticket-attachments' AND public.has_role(auth.uid(),'admin'));

ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;