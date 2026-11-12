CREATE OR REPLACE FUNCTION public.get_company_monthly_sales(_company uuid)
RETURNS TABLE (
  month_start date,
  revenue numeric,
  orders_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_company_member(_company, auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', current_date)::date - interval '11 months',
      date_trunc('month', current_date)::date,
      interval '1 month'
    )::date AS month_start
  )
  SELECT
    m.month_start,
    COALESCE(sum(o.total) FILTER (WHERE o.id IS NOT NULL), 0)::numeric AS revenue,
    count(o.id)::bigint AS orders_count
  FROM months m
  LEFT JOIN public.orders o
    ON o.company_id = _company
    AND o.status <> 'cancelled'
    AND o.created_at >= m.month_start
    AND o.created_at < m.month_start + interval '1 month'
  GROUP BY m.month_start
  ORDER BY m.month_start;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_company_monthly_sales(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_company_monthly_sales(uuid) TO authenticated;