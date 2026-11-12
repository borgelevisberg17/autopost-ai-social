CREATE TYPE public.app_role AS ENUM ('platform_admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own platform role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_platform_admin(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user AND role = 'platform_admin'
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_platform_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_platform_admin(uuid) TO authenticated;

CREATE TABLE public.company_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan text NOT NULL,
  status text NOT NULL,
  provider text,
  current_period_end timestamptz,
  event_type text NOT NULL CHECK (event_type IN ('created','plan_changed','cancelled','reactivated','status_changed')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_subscription_events_company_time_idx
  ON public.company_subscription_events(company_id, recorded_at DESC);
CREATE INDEX company_subscription_events_time_type_idx
  ON public.company_subscription_events(recorded_at, event_type);
GRANT SELECT ON public.company_subscription_events TO authenticated;
GRANT ALL ON public.company_subscription_events TO service_role;
ALTER TABLE public.company_subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view their subscription history" ON public.company_subscription_events
  FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));

INSERT INTO public.company_subscription_events (company_id, plan, status, provider, current_period_end, event_type, recorded_at)
SELECT company_id, plan, status, provider, current_period_end, 'created', created_at
FROM public.company_subscriptions;

CREATE OR REPLACE FUNCTION public.record_company_subscription_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event_name := 'created';
  ELSIF NEW.plan IS DISTINCT FROM OLD.plan THEN
    event_name := 'plan_changed';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN
    event_name := 'cancelled';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND OLD.status = 'cancelled' THEN
    event_name := 'reactivated';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    event_name := 'status_changed';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.company_subscription_events (company_id, plan, status, provider, current_period_end, event_type)
  VALUES (NEW.company_id, NEW.plan, NEW.status, NEW.provider, NEW.current_period_end, event_name);
  RETURN NEW;
END;
$$;
CREATE TRIGGER record_company_subscription_changes
  AFTER INSERT OR UPDATE OF plan, status, provider, current_period_end ON public.company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.record_company_subscription_event();