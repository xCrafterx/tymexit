GRANT INSERT, DELETE ON public.ignored_ips TO authenticated;
GRANT DELETE ON public.site_visit_logs TO authenticated;

CREATE POLICY "Admins can add ignored ips"
ON public.ignored_ips FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ignored ips"
ON public.ignored_ips FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visit logs"
ON public.site_visit_logs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));