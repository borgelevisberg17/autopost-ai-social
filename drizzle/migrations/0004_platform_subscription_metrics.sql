CREATE OR REPLACE FUNCTION public.get_platform_subscription_metrics()
RETURNS TABLE (
  month_start date,
  subscriptions_added bigint,
  active_subscriptions bigint,
  paid_subscriptions bigint,
  total_companies bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', current_date)::date - interval '11 months',
      date_trunc('month', current_date)::date,
      interval '1 month'
    )::date AS month_start
  ), created AS (
    SELECT e.company_id, min(e.recorded_at) AS first_seen
    FROM public.company_subscription_events e
    GROUP BY e.company_id
  ), monthly_state AS (
    SELECT m.month_start, e.company_id, e.plan, e.status
    FROM months m
    JOIN LATERAL (
      SELECT DISTINCT ON (company_id) company_id, plan, status, recorded_at
      FROM public.company_subscription_events
      WHERE recorded_at < (m.month_start + interval '1 month')
      ORDER BY company_id, recorded_at DESC, id DESC
    ) e ON true
  )
  SELECT
    m.month_start,
    (SELECT count(*) FROM public.company_subscription_events e
      WHERE e.event_type = 'created'
        AND e.recorded_at >= m.month_start
        AND e.recorded_at < m.month_start + interval '1 month')::bigint,
    (SELECT count(*) FROM monthly_state s
      WHERE s.month_start = m.month_start AND s.status IN ('active','trialing'))::bigint,
    (SELECT count(*) FROM monthly_state s
      WHERE s.month_start = m.month_start AND s.status IN ('active','trialing') AND s.plan IN ('basic','pro'))::bigint,
    (SELECT count(*) FROM created c
      WHERE c.first_seen < m.month_start + interval '1 month')::bigint
  FROM months m
  ORDER BY m.month_start;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_platform_subscription_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_subscription_metrics() TO authenticated;