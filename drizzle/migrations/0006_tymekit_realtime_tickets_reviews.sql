do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='tickets') then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reviews') then
    alter publication supabase_realtime add table public.reviews;
  end if;
end $$;

alter table public.tickets replica identity full;
alter table public.reviews replica identity full;