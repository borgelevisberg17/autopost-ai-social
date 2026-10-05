ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS payment_iban text,
  ADD COLUMN IF NOT EXISTS payment_iban_holder text,
  ADD COLUMN IF NOT EXISTS payment_express_number text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_proof_path text,
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

DROP FUNCTION IF EXISTS public.get_order_status(uuid);
CREATE FUNCTION public.get_order_status(_order uuid)
RETURNS TABLE(status text, total numeric, created_at timestamptz, customer_name text,
  payment_status text, payment_method text, payment_submitted_at timestamptz, paid_at timestamptz, items jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.status, o.total, o.created_at, o.customer_name, o.payment_status, o.payment_method,
    o.payment_submitted_at, o.paid_at,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('product_name', i.product_name, 'quantity', i.quantity, 'unit_price', i.unit_price) ORDER BY i.created_at)
      FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb)
  FROM public.orders o WHERE o.id = _order
$$;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon, authenticated;

-- Staff confirms or rejects a payment
CREATE OR REPLACE FUNCTION public.set_payment_status(_order uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c uuid;
BEGIN
  IF _status NOT IN ('paid','failed','pending') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  SELECT company_id INTO c FROM public.orders WHERE id = _order;
  IF c IS NULL OR NOT public.is_company_member(c, auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE public.orders SET payment_status = _status,
    paid_at = CASE WHEN _status = 'paid' THEN now() ELSE NULL END,
    status = CASE WHEN _status = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END
  WHERE id = _order;
  INSERT INTO public.order_events(company_id, order_id, type, actor_type, actor_id, description)
  VALUES (c, _order, 'payment_' || _status, 'staff', auth.uid()::text,
    CASE _status WHEN 'paid' THEN 'Pagamento confirmado' WHEN 'failed' THEN 'Comprovativo rejeitado' ELSE 'Pagamento reaberto' END);
END $$;
REVOKE EXECUTE ON FUNCTION public.set_payment_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_payment_status(uuid, text) TO authenticated;