REVOKE SELECT ON public.companies FROM anon, PUBLIC;
DO $$ DECLARE all_columns text; BEGIN SELECT string_agg(format('%I',column_name),', ') INTO all_columns FROM information_schema.columns WHERE table_schema='public' AND table_name='companies'; EXECUTE format('REVOKE SELECT (%s) ON public.companies FROM anon, PUBLIC',all_columns); END $$;
GRANT SELECT (id,name,slug,currency,description,whatsapp,payment_iban,payment_iban_holder,payment_express_number) ON public.companies TO anon;
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;
CREATE POLICY "Public can view companies" ON public.companies FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Members view own companies" ON public.companies;
CREATE POLICY "Members view own companies" ON public.companies FOR SELECT TO authenticated USING (public.is_company_member(id,auth.uid()));
CREATE OR REPLACE FUNCTION public.get_order_status(_order uuid)
RETURNS TABLE(status text,total numeric,created_at timestamptz,customer_name text,payment_status text,payment_method text,payment_submitted_at timestamptz,paid_at timestamptz,items jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT o.status,o.total,o.created_at,NULL::text,o.payment_status,o.payment_method,o.payment_submitted_at,o.paid_at,
COALESCE((SELECT jsonb_agg(jsonb_build_object('product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price) ORDER BY i.created_at) FROM public.order_items i WHERE i.order_id=o.id),'[]'::jsonb)
FROM public.orders o WHERE o.id=_order
$$;
REVOKE EXECUTE ON FUNCTION public.get_order_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon,authenticated;
COMMENT ON FUNCTION public.get_order_status(uuid) IS 'Public tracking omits customer identity while preserving payment status and order items.';