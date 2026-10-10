CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  sku text,
  price numeric CHECK (price IS NULL OR price >= 0),
  promo_price numeric CHECK (promo_price IS NULL OR promo_price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id);
CREATE INDEX product_variants_company_idx ON public.product_variants(company_id);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
CREATE POLICY "Public sees active variants" ON public.product_variants FOR SELECT TO anon
  USING (active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active));
CREATE POLICY "Members see variants" ON public.product_variants FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR (active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active)));
CREATE POLICY "Members add variants" ON public.product_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.company_id = product_variants.company_id));
CREATE POLICY "Members edit variants" ON public.product_variants FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid())) WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Admins delete variants" ON public.product_variants FOR DELETE TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()));
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.order_items ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN variant_name text;
ALTER TABLE public.inventory_movements ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','basic','pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','cancelled')),
  provider text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.company_subscriptions TO authenticated;
CREATE POLICY "Members see subscription" ON public.company_subscriptions FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.company_subscriptions (company_id) SELECT id FROM public.companies ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.add_company_owner()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner');
  INSERT INTO public.company_subscriptions (company_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.place_order(_company_slug text, _customer_name text, _customer_phone text, _customer_email text, _notes text, _items jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _company uuid; _order uuid; _item jsonb; _p public.products; _v public.product_variants;
  _qty int; _unit numeric; _total numeric := 0; _existing_customer_id uuid;
BEGIN
  IF coalesce(trim(_customer_name),'') = '' OR length(_customer_name) > 120 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Carrinho inválido'; END IF;
  SELECT id INTO _company FROM public.companies WHERE slug = _company_slug;
  IF _company IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;

  INSERT INTO public.orders (company_id, customer_name, customer_phone, customer_email, notes, status, payment_status, fulfillment_status)
  VALUES (_company, left(_customer_name,120), left(_customer_phone,40), left(_customer_email,160), left(_notes,1000), 'pending','pending','unfulfilled')
  RETURNING id INTO _order;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 999 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT * INTO _p FROM public.products WHERE id = (_item->>'product_id')::uuid AND company_id = _company AND active FOR UPDATE;
    IF _p.id IS NULL THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
    _v := NULL;
    IF nullif(_item->>'variant_id','') IS NOT NULL THEN
      SELECT * INTO _v FROM public.product_variants WHERE id = (_item->>'variant_id')::uuid AND product_id = _p.id AND active FOR UPDATE;
      IF _v.id IS NULL THEN RAISE EXCEPTION 'Variante indisponível'; END IF;
      IF _v.stock < _qty THEN RAISE EXCEPTION 'Stock insuficiente para % (%)', _p.name, _v.name; END IF;
      _unit := coalesce(_v.promo_price, _v.price, _p.promo_price, _p.price);
      UPDATE public.product_variants SET stock = stock - _qty WHERE id = _v.id;
    ELSE
      IF _p.stock < _qty THEN RAISE EXCEPTION 'Stock insuficiente para %', _p.name; END IF;
      _unit := coalesce(_p.promo_price, _p.price);
      UPDATE public.products SET stock = stock - _qty WHERE id = _p.id;
    END IF;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, variant_id, variant_name)
    VALUES (_order, _p.id, _p.name, _unit, _qty, _v.id, _v.name);
    INSERT INTO public.inventory_movements (company_id, product_id, variant_id, type, quantity, reason)
    VALUES (_company, _p.id, _v.id, 'out', _qty, 'Pedido #' || upper(left(_order::text, 8)));
    _total := _total + (_unit * _qty);
  END LOOP;

  UPDATE public.orders SET total = _total WHERE id = _order;
  INSERT INTO public.order_events (company_id, order_id, type, actor_type, description, metadata)
  VALUES (_company, _order, 'order.created', 'customer', 'Pedido #' || upper(left(_order::text, 8)) || ' criado com sucesso no website.',
    jsonb_build_object('total', _total, 'items_count', jsonb_array_length(_items)));

  SELECT id INTO _existing_customer_id FROM public.customers WHERE company_id = _company AND (
    (email IS NOT NULL AND lower(email) = lower(trim(_customer_email))) OR
    (phone IS NOT NULL AND phone = trim(_customer_phone)) OR (lower(name) = lower(trim(_customer_name)))) LIMIT 1;
  IF _existing_customer_id IS NOT NULL THEN
    UPDATE public.customers SET total_spent = total_spent + _total, orders_count = orders_count + 1, last_order_at = now(), updated_at = now() WHERE id = _existing_customer_id;
  ELSE
    INSERT INTO public.customers (company_id, name, email, phone, channel, total_spent, orders_count, last_order_at)
    VALUES (_company, left(trim(_customer_name),120), nullif(trim(_customer_email),''), nullif(trim(_customer_phone),''), 'website', _total, 1, now());
  END IF;
  INSERT INTO public.notifications (company_id, type, title, message, link)
  VALUES (_company, 'new_order', 'Novo pedido recebido', _customer_name || ' efetuou o pedido #' || upper(left(_order::text, 8)) || ' no valor de ' || _total::text, '/admin/pedidos');
  RETURN _order;
END; $function$;

CREATE OR REPLACE FUNCTION public.restock_cancelled_order()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p SET stock = p.stock + i.quantity FROM public.order_items i WHERE i.order_id = NEW.id AND i.product_id = p.id AND i.variant_id IS NULL;
    UPDATE public.product_variants v SET stock = v.stock + i.quantity FROM public.order_items i WHERE i.order_id = NEW.id AND i.variant_id = v.id;
  END IF;
  RETURN NEW;
END; $$;