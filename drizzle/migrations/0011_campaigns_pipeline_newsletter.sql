CREATE TABLE public.campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 name text NOT NULL,
 goal text,
 product_ids uuid[] NOT NULL DEFAULT '{}',
 auto_products boolean NOT NULL DEFAULT true,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed')),
 starts_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.campaign_steps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
 position integer NOT NULL DEFAULT 0,
 channel text NOT NULL CHECK (channel IN ('facebook','instagram','whatsapp','email')),
 delay_minutes integer NOT NULL DEFAULT 0 CHECK (delay_minutes BETWEEN 0 AND 43200),
 start_hour integer NOT NULL DEFAULT 8 CHECK (start_hour BETWEEN 0 AND 23),
 end_hour integer NOT NULL DEFAULT 21 CHECK (end_hour BETWEEN 1 AND 24),
 requires_approval boolean NOT NULL DEFAULT false,
 approved boolean NOT NULL DEFAULT false,
 content text,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_approval','awaiting_connection','sending','sent','failed','skipped')),
 due_at timestamptz,
 processed_at timestamptz,
 result jsonb,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.campaign_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 step_id uuid NOT NULL REFERENCES public.campaign_steps(id) ON DELETE CASCADE,
 recipient text NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 external_id text,
 error text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(step_id, recipient));
CREATE TABLE public.newsletter_subscribers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 email text NOT NULL,
 name text,
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed')),
 unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
 consent_at timestamptz NOT NULL DEFAULT now(),
 unsubscribed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(company_id, email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns, public.campaign_steps TO authenticated;
GRANT SELECT ON public.campaign_deliveries TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.campaigns, public.campaign_steps, public.campaign_deliveries, public.newsletter_subscribers TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.is_company_member(company_id, auth.uid())) WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "members manage steps" ON public.campaign_steps FOR ALL TO authenticated USING (public.is_company_member(company_id, auth.uid())) WITH CHECK (public.is_company_member(company_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id=campaign_id AND c.company_id=campaign_steps.company_id));
CREATE POLICY "members read deliveries" ON public.campaign_deliveries FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "members manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.is_company_member(company_id, auth.uid())) WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX campaign_steps_due ON public.campaign_steps(status, due_at);

CREATE OR REPLACE FUNCTION public.newsletter_subscribe(_slug text, _email text, _name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; e text := lower(trim(_email));
BEGIN
 IF e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(e)>200 THEN RAISE EXCEPTION 'Email inválido'; END IF;
 SELECT id INTO c FROM public.companies WHERE slug=_slug AND platform_status='active';
 IF c IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
 INSERT INTO public.newsletter_subscribers(company_id,email,name) VALUES(c,e,left(nullif(trim(_name),''),120))
 ON CONFLICT(company_id,email) DO UPDATE SET status='active', unsubscribed_at=NULL, consent_at=now();
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.newsletter_unsubscribe(_token uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH u AS (UPDATE public.newsletter_subscribers SET status='unsubscribed', unsubscribed_at=now() WHERE unsubscribe_token=_token RETURNING 1) SELECT EXISTS(SELECT 1 FROM u) $$;
GRANT EXECUTE ON FUNCTION public.newsletter_subscribe(text,text,text), public.newsletter_unsubscribe(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.conversation_to_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.customer_id IS NULL THEN
  SELECT id INTO NEW.customer_id FROM public.customers WHERE company_id=NEW.company_id AND phone=NEW.customer_phone LIMIT 1;
  IF NEW.customer_id IS NULL THEN
   INSERT INTO public.customers(company_id,name,phone,channel) VALUES(NEW.company_id, coalesce(nullif(NEW.customer_name,''),'+'||NEW.customer_phone), NEW.customer_phone,'whatsapp') RETURNING id INTO NEW.customer_id;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER conversations_customer BEFORE INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.conversation_to_customer();
INSERT INTO public.customers(company_id,name,phone,channel)
 SELECT DISTINCT ON (c.company_id,c.customer_phone) c.company_id, coalesce(nullif(c.customer_name,''),'+'||c.customer_phone), c.customer_phone,'whatsapp'
 FROM public.conversations c WHERE NOT EXISTS (SELECT 1 FROM public.customers x WHERE x.company_id=c.company_id AND x.phone=c.customer_phone);
UPDATE public.conversations c SET customer_id=x.id FROM public.customers x WHERE c.customer_id IS NULL AND x.company_id=c.company_id AND x.phone=c.customer_phone;