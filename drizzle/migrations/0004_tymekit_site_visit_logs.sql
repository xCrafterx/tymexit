CREATE TABLE IF NOT EXISTS public.site_visit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  user_agent text,
  browser text,
  device text,
  country text,
  region text,
  city text,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_visit_logs_ip ON public.site_visit_logs (ip);
CREATE INDEX IF NOT EXISTS idx_site_visit_logs_created_at ON public.site_visit_logs (created_at DESC);

GRANT SELECT ON public.site_visit_logs TO authenticated;
GRANT ALL ON public.site_visit_logs TO service_role;

ALTER TABLE public.site_visit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read visit logs"
ON public.site_visit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ignored_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ignored_ips TO authenticated;
GRANT ALL ON public.ignored_ips TO service_role;

ALTER TABLE public.ignored_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ignored ips"
ON public.ignored_ips FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));