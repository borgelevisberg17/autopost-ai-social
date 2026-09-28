CREATE TYPE public.company_role AS ENUM ('owner','admin','staff');

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'AOA',
  description text,
  whatsapp text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.company_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
GRANT SELECT ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;

CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company AND user_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_company_admin(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company AND user_id = _user AND role IN ('owner','admin'))
$$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view companies" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins update company" ON public.companies FOR UPDATE TO authenticated USING (public.is_company_admin(id, auth.uid()));
CREATE POLICY "Admins delete company" ON public.companies FOR DELETE TO authenticated USING (public.is_company_admin(id, auth.uid()));

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view membership" ON public.company_members FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.add_company_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_company_created AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.add_company_owner();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text,
  category text,
  price numeric(14,2) NOT NULL DEFAULT 0,
  promo_price numeric(14,2),
  stock integer NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_non_negative CHECK (stock >= 0),
  CONSTRAINT price_non_negative CHECK (price >= 0)
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active products" ON public.products FOR SELECT TO anon, authenticated USING (active OR public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members update products" ON public.products FOR UPDATE TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (public.is_company_admin(company_id, auth.uid()));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX products_company_idx ON public.products(company_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  notes text,
  channel text NOT NULL DEFAULT 'website',
  status text NOT NULL DEFAULT 'pending',
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view orders" ON public.orders FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(14,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_company_member(o.company_id, auth.uid())));

CREATE TABLE public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent text NOT NULL,
  action text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  platform text,
  content text,
  status text NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_actions TO authenticated;
GRANT ALL ON public.agent_actions TO service_role;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view agent actions" ON public.agent_actions FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE INDEX agent_actions_company_idx ON public.agent_actions(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.place_order(_company_slug text, _customer_name text, _customer_phone text, _customer_email text, _notes text, _items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company uuid; _order uuid; _item jsonb; _p public.products; _qty int; _unit numeric; _total numeric := 0;
BEGIN
  IF coalesce(trim(_customer_name),'') = '' OR length(_customer_name) > 120 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Carrinho inválido'; END IF;
  SELECT id INTO _company FROM public.companies WHERE slug = _company_slug;
  IF _company IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  INSERT INTO public.orders (company_id, customer_name, customer_phone, customer_email, notes)
  VALUES (_company, left(_customer_name,120), left(_customer_phone,40), left(_customer_email,160), left(_notes,1000)) RETURNING id INTO _order;
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 999 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT * INTO _p FROM public.products WHERE id = (_item->>'product_id')::uuid AND company_id = _company AND active FOR UPDATE;
    IF _p.id IS NULL THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
    IF _p.stock < _qty THEN RAISE EXCEPTION 'Stock insuficiente para %', _p.name; END IF;
    _unit := coalesce(_p.promo_price, _p.price);
    UPDATE public.products SET stock = stock - _qty WHERE id = _p.id;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (_order, _p.id, _p.name, _unit, _qty);
    _total := _total + _unit * _qty;
  END LOOP;
  UPDATE public.orders SET total = _total WHERE id = _order;
  RETURN _order;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,text,jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_order_status(_order uuid)
RETURNS TABLE (status text, total numeric, created_at timestamptz, customer_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status, total, created_at, customer_name FROM public.orders WHERE id = _order
$$;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.restock_cancelled_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p SET stock = p.stock + i.quantity FROM public.order_items i WHERE i.order_id = NEW.id AND i.product_id = p.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_order_cancelled AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.restock_cancelled_order();