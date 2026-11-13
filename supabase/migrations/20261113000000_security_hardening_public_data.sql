-- Security hardening: expose only storefront-safe company fields to anonymous visitors.
-- Authenticated members retain their existing table access, constrained by membership RLS.

DO $$
DECLARE
  all_columns text;
  public_columns text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO all_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'companies';

  IF all_columns IS NOT NULL THEN
    EXECUTE format(
      'REVOKE SELECT (%s) ON TABLE public.companies FROM anon, PUBLIC',
      all_columns
    );
  END IF;

  REVOKE SELECT ON TABLE public.companies FROM anon, PUBLIC;

  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO public_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'companies'
    AND column_name = ANY (ARRAY[
      'name',
      'slug',
      'currency',
      'description',
      'whatsapp',
      'payment_iban',
      'payment_iban_holder',
      'payment_express_number'
    ]);

  IF public_columns IS NOT NULL THEN
    EXECUTE format(
      'GRANT SELECT (%s) ON TABLE public.companies TO anon',
      public_columns
    );
  END IF;
END $$;

-- Keep public storefront discovery while ensuring authenticated company data
-- is visible only to actual members.
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;
CREATE POLICY "Public can view companies"
  ON public.companies
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Members view own companies" ON public.companies;
CREATE POLICY "Members view own companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_company_member(id, auth.uid()));

-- The public tracking endpoint must not disclose a customer's name.
-- The UUID remains the lookup key for compatibility with the current storefront.
CREATE OR REPLACE FUNCTION public.get_order_status(_order uuid)
RETURNS TABLE (
  status text,
  total numeric,
  created_at timestamptz,
  customer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.status, o.total, o.created_at, NULL::text AS customer_name
  FROM public.orders AS o
  WHERE o.id = _order
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_status(uuid) IS
  'Public order tracking. Deliberately omits customer-identifying information.';
