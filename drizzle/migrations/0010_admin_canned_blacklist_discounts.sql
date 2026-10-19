CREATE TABLE public.canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canned_responses TO authenticated;
GRANT ALL ON public.canned_responses TO service_role;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canned_responses_admin" ON public.canned_responses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.contact_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('phone', 'email')),
  value text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_blacklist TO authenticated;
GRANT ALL ON public.contact_blacklist TO service_role;
ALTER TABLE public.contact_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_blacklist_admin" ON public.contact_blacklist FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.is_blacklisted_contact(_kind text, _value text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_blacklist
    WHERE kind = _kind AND lower(trim(value)) = lower(trim(_value))
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_blacklisted_contact(text, text) TO anon, authenticated;

CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent integer NOT NULL CHECK (percent >= 1 AND percent <= 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discount_codes_admin" ON public.discount_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.validate_discount_code(_code text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT percent FROM public.discount_codes
  WHERE active AND upper(trim(code)) = upper(trim(_code))
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text) TO anon, authenticated;

ALTER TABLE public.tickets ADD COLUMN discount_code text;
ALTER TABLE public.tickets ADD COLUMN discount_percent integer NOT NULL DEFAULT 0;