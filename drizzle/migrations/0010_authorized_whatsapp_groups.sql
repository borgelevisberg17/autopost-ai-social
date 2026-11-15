CREATE TABLE public.whatsapp_group_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
 provider text NOT NULL DEFAULT 'zapi' CHECK(provider='zapi'), instance_id text NOT NULL UNIQUE,
 webhook_hash text NOT NULL, status text NOT NULL DEFAULT 'pending', last_event_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,provider)
);
GRANT SELECT ON public.whatsapp_group_connections TO authenticated;
GRANT ALL ON public.whatsapp_group_connections TO service_role;
ALTER TABLE public.whatsapp_group_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_connection_read ON public.whatsapp_group_connections FOR SELECT TO authenticated USING(public.is_company_admin(company_id,auth.uid()));
CREATE TABLE public.whatsapp_groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
 provider text NOT NULL CHECK(provider IN ('meta','zapi')), account_ref text NOT NULL, external_id text NOT NULL,
 name text NOT NULL, available boolean NOT NULL DEFAULT true, authorized boolean NOT NULL DEFAULT false,
 sales_enabled boolean NOT NULL DEFAULT false, marketing_enabled boolean NOT NULL DEFAULT false,
 call_word text NOT NULL DEFAULT '@vendora', timezone text NOT NULL DEFAULT 'Africa/Luanda',
 start_hour integer NOT NULL DEFAULT 9 CHECK(start_hour BETWEEN 0 AND 23),
 end_hour integer NOT NULL DEFAULT 18 CHECK(end_hour BETWEEN 1 AND 24),
 weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], interval_minutes integer NOT NULL DEFAULT 240 CHECK(interval_minutes BETWEEN 60 AND 10080),
 next_marketing_at timestamptz NOT NULL DEFAULT now(), last_inbound_at timestamptz, last_marketing_at timestamptz,
 last_error text, verified_at timestamptz NOT NULL DEFAULT now(), authorized_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,account_ref,external_id), UNIQUE(id,company_id),
 CHECK(end_hour > start_hour), CHECK(length(call_word) BETWEEN 2 AND 80),
 CHECK(cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[0,1,2,3,4,5,6])
);
GRANT SELECT ON public.whatsapp_groups TO authenticated;
GRANT ALL ON public.whatsapp_groups TO service_role;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_read ON public.whatsapp_groups FOR SELECT TO authenticated USING(public.is_company_member(company_id,auth.uid()));
CREATE TABLE public.whatsapp_group_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, group_id uuid NOT NULL,
 direction text NOT NULL CHECK(direction IN ('in','out')), kind text NOT NULL CHECK(kind IN ('sales','marketing')),
 external_id text, dedupe_key text NOT NULL UNIQUE, sender text, body text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','sending','sent','delivered','read','failed','unknown','ignored')),
 product_id uuid REFERENCES public.products(id), error text, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(group_id,company_id) REFERENCES public.whatsapp_groups(id,company_id)
);
GRANT SELECT ON public.whatsapp_group_messages TO authenticated;
GRANT ALL ON public.whatsapp_group_messages TO service_role;
ALTER TABLE public.whatsapp_group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_message_read ON public.whatsapp_group_messages FOR SELECT TO authenticated USING(public.is_company_member(company_id,auth.uid()));
CREATE INDEX group_messages_history ON public.whatsapp_group_messages(group_id,created_at DESC);
CREATE INDEX groups_marketing_due ON public.whatsapp_groups(next_marketing_at) WHERE authorized AND available AND marketing_enabled;
CREATE OR REPLACE FUNCTION public.claim_group_marketing(_group uuid, _key text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g public.whatsapp_groups; m uuid;
BEGIN
 SELECT * INTO g FROM public.whatsapp_groups WHERE id=_group FOR UPDATE;
 IF g.id IS NULL OR NOT g.authorized OR NOT g.available OR NOT g.marketing_enabled OR g.next_marketing_at>now() THEN RETURN NULL; END IF;
 INSERT INTO public.whatsapp_group_messages(company_id,group_id,direction,kind,dedupe_key) VALUES(g.company_id,g.id,'out','marketing',_key) ON CONFLICT(dedupe_key) DO NOTHING RETURNING id INTO m;
 IF m IS NOT NULL THEN UPDATE public.whatsapp_groups SET next_marketing_at=now()+make_interval(mins=>g.interval_minutes) WHERE id=g.id; END IF;
 RETURN m;
END $$;
REVOKE ALL ON FUNCTION public.claim_group_marketing(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_group_marketing(uuid,text) TO service_role;