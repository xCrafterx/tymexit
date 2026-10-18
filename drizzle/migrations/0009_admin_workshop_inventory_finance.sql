CREATE TABLE public.workshop_parts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
 quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
 unit_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_parts TO authenticated;
GRANT ALL ON public.workshop_parts TO service_role;
ALTER TABLE public.workshop_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY workshop_parts_admin ON public.workshop_parts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.ticket_finances (
 ticket_id uuid PRIMARY KEY REFERENCES public.tickets(id) ON DELETE CASCADE,
 customer_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (customer_price >= 0),
 parts_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
 other_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (other_cost >= 0),
 paid boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_finances TO authenticated;
GRANT ALL ON public.ticket_finances TO service_role;
ALTER TABLE public.ticket_finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_finances_admin ON public.ticket_finances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.adjust_workshop_stock(_part_id uuid, _delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE new_quantity integer;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
 IF _delta IS NULL OR _delta NOT IN (-1,1) THEN RAISE EXCEPTION 'Dozwolona zmiana to +1 lub -1'; END IF;
 UPDATE public.workshop_parts SET quantity = quantity + _delta WHERE id = _part_id AND quantity + _delta >= 0 RETURNING quantity INTO new_quantity;
 IF new_quantity IS NULL THEN RAISE EXCEPTION 'Brak części lub stan wynosi zero'; END IF;
 RETURN new_quantity;
END;
$$;
REVOKE ALL ON FUNCTION public.adjust_workshop_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_workshop_stock(uuid, integer) TO authenticated;