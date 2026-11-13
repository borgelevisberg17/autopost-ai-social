CREATE TABLE public.subscription_plans (id text PRIMARY KEY, name text NOT NULL, monthly_price numeric, currency text NOT NULL DEFAULT 'USD', product_limit integer NOT NULL DEFAULT 100, monthly_ai_limit integer NOT NULL DEFAULT 10, features text[] NOT NULL DEFAULT ARRAY['marketing','analytics'], enabled boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT valid_plan_amounts CHECK ((monthly_price IS NULL OR monthly_price >= 0) AND product_limit >= 0 AND monthly_ai_limit >= 0));
GRANT SELECT ON public.subscription_plans TO anon, authenticated; GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read plan catalogue" ON public.subscription_plans FOR SELECT USING (true);
CREATE TABLE public.platform_coupons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, plan_id text REFERENCES public.subscription_plans(id) NOT NULL, percent_off integer NOT NULL, max_uses integer NOT NULL, uses integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL, enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), CHECK (percent_off BETWEEN 1 AND 100 AND max_uses > 0 AND uses >= 0));
GRANT SELECT ON public.platform_coupons TO authenticated; GRANT ALL ON public.platform_coupons TO service_role;
ALTER TABLE public.platform_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform reads coupons" ON public.platform_coupons FOR SELECT TO authenticated USING(public.has_platform_admin(auth.uid()));
CREATE TABLE public.coupon_redemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), coupon_id uuid NOT NULL REFERENCES public.platform_coupons(id), redeemed_by uuid NOT NULL, redeemed_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,coupon_id));
GRANT SELECT ON public.coupon_redemptions TO authenticated; GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company reads redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING(public.is_company_member(company_id,auth.uid()) OR public.has_platform_admin(auth.uid()));
CREATE TABLE public.platform_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL, company_id uuid REFERENCES public.companies(id), action text NOT NULL, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.platform_audit TO authenticated; GRANT ALL ON public.platform_audit TO service_role;
ALTER TABLE public.platform_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform reads audit" ON public.platform_audit FOR SELECT TO authenticated USING(public.has_platform_admin(auth.uid()));
CREATE TABLE public.company_ai_usage (company_id uuid NOT NULL REFERENCES public.companies(id), month_start date NOT NULL, used integer NOT NULL DEFAULT 0, PRIMARY KEY(company_id,month_start));
GRANT SELECT ON public.company_ai_usage TO authenticated; GRANT ALL ON public.company_ai_usage TO service_role;
ALTER TABLE public.company_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company reads usage" ON public.company_ai_usage FOR SELECT TO authenticated USING(public.is_company_member(company_id,auth.uid()) OR public.has_platform_admin(auth.uid()));
ALTER TABLE public.companies ADD COLUMN platform_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.company_subscriptions ADD COLUMN granted_plan text REFERENCES public.subscription_plans(id), ADD COLUMN grant_expires_at timestamptz;
ALTER TABLE public.company_subscriptions ADD COLUMN coupon_id uuid REFERENCES public.platform_coupons(id);
CREATE OR REPLACE FUNCTION public.company_entitlement(_company uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.company_subscriptions; p public.subscription_plans; state text; n integer;
BEGIN
IF current_user <> 'service_role' AND coalesce(auth.role(),'') <> 'service_role' AND NOT public.is_company_member(_company,auth.uid()) AND NOT public.has_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
SELECT * INTO s FROM public.company_subscriptions WHERE company_id=_company;
SELECT platform_status INTO state FROM public.companies WHERE id=_company;
SELECT * INTO p FROM public.subscription_plans WHERE id=CASE WHEN s.granted_plan IS NOT NULL AND s.grant_expires_at>now() THEN s.granted_plan WHEN s.status IN ('active','trialing') AND (s.current_period_end IS NULL OR s.current_period_end>now()) THEN s.plan ELSE 'free' END;
SELECT used INTO n FROM public.company_ai_usage WHERE company_id=_company AND month_start=date_trunc('month',now())::date;
RETURN jsonb_build_object('plan',p.id,'name',p.name,'status',s.status,'company_status',state,'price',p.monthly_price,'currency',p.currency,'features',CASE WHEN state='active' AND p.enabled THEN p.features ELSE ARRAY[]::text[] END,'product_limit',p.product_limit,'monthly_ai_limit',p.monthly_ai_limit,'ai_used',coalesce(n,0),'grant_expires_at',s.grant_expires_at,'base_plan',s.plan,'coupon_id',s.coupon_id);
END $$;
REVOKE ALL ON FUNCTION public.company_entitlement(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.company_entitlement(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.consume_company_ai(_company uuid,_feature text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e jsonb; n integer;
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended(_company::text,0));
e:=public.company_entitlement(_company);
IF NOT coalesce((e->'features') ? _feature,false) THEN RAISE EXCEPTION 'O plano desta empresa não permite este recurso'; END IF;
INSERT INTO public.company_ai_usage(company_id,month_start,used) VALUES(_company,date_trunc('month',now())::date,1) ON CONFLICT(company_id,month_start) DO UPDATE SET used=company_ai_usage.used+1 WHERE company_ai_usage.used<(e->>'monthly_ai_limit')::integer RETURNING used INTO n;
IF n IS NULL OR n>(e->>'monthly_ai_limit')::integer THEN RAISE EXCEPTION 'Limite mensal de IA atingido'; END IF;
RETURN e || jsonb_build_object('ai_used',n);
END $$;
REVOKE ALL ON FUNCTION public.consume_company_ai(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.consume_company_ai(uuid,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.enforce_product_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e jsonb; total integer;
BEGIN
IF TG_OP='UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN RAISE EXCEPTION 'Não pode transferir produtos entre empresas'; END IF;
IF TG_OP='UPDATE' THEN RETURN NEW; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(NEW.company_id::text,0));
e:=public.company_entitlement(NEW.company_id);
IF e->>'company_status'<>'active' THEN RAISE EXCEPTION 'Empresa suspensa ou removida'; END IF;
SELECT count(*) INTO total FROM public.products WHERE company_id=NEW.company_id;
IF total >= (e->>'product_limit')::integer THEN RAISE EXCEPTION 'Limite de produtos do plano atingido'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER enforce_product_subscription BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.enforce_product_subscription();
CREATE OR REPLACE FUNCTION public.platform_overview() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF NOT public.has_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
RETURN jsonb_build_object('companies',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'currency',c.currency,'status',c.platform_status,'created_at',c.created_at,'owner', (SELECT email FROM public.profiles WHERE user_id=c.created_by LIMIT 1),'members',(SELECT count(*) FROM public.company_members WHERE company_id=c.id),'products',(SELECT count(*) FROM public.products WHERE company_id=c.id),'orders',(SELECT count(*) FROM public.orders WHERE company_id=c.id),'paid_total',(SELECT coalesce(sum(total),0) FROM public.orders WHERE company_id=c.id AND payment_status='paid' AND status<>'cancelled'),'entitlement',public.company_entitlement(c.id)) ORDER BY c.created_at DESC) FROM public.companies c),'[]'::jsonb),'coupons',coalesce((SELECT jsonb_agg(x ORDER BY x.created_at DESC) FROM public.platform_coupons x),'[]'::jsonb),'audit',coalesce((SELECT jsonb_agg(x) FROM (SELECT * FROM public.platform_audit ORDER BY created_at DESC LIMIT 50)x),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.platform_overview() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.platform_overview() TO authenticated;
CREATE OR REPLACE FUNCTION public.platform_manage(_action text,_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; expiry timestamptz;
BEGIN
IF NOT public.has_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
c:=nullif(_data->>'company_id','')::uuid;
IF _action='plan' THEN
UPDATE public.subscription_plans SET name=left(_data->>'name',80),monthly_price=(_data->>'price')::numeric,currency=upper(_data->>'currency'),product_limit=(_data->>'product_limit')::integer,monthly_ai_limit=(_data->>'monthly_ai_limit')::integer,features=ARRAY(SELECT jsonb_array_elements_text(_data->'features')),enabled=(_data->>'enabled')::boolean,updated_at=now() WHERE id=_data->>'id';
ELSIF _action='coupon' THEN
expiry:=(_data->>'expires_at')::timestamptz; IF expiry<=now() THEN RAISE EXCEPTION 'Validade deve ser futura'; END IF;
INSERT INTO public.platform_coupons(code,plan_id,percent_off,max_uses,expires_at) VALUES(upper(trim(_data->>'code')),_data->>'plan_id',(_data->>'percent_off')::integer,(_data->>'max_uses')::integer,expiry);
ELSIF _action='disable_coupon' THEN UPDATE public.platform_coupons SET enabled=false WHERE id=(_data->>'id')::uuid;
ELSIF _action='grant' THEN
expiry:=(_data->>'expires_at')::timestamptz; IF expiry<=now() THEN RAISE EXCEPTION 'Validade deve ser futura'; END IF;
UPDATE public.company_subscriptions SET granted_plan=_data->>'plan_id',grant_expires_at=expiry WHERE company_id=c;
ELSIF _action='revoke_grant' THEN UPDATE public.company_subscriptions SET granted_plan=NULL,grant_expires_at=NULL WHERE company_id=c;
ELSIF _action='company_status' THEN
IF _data->>'status' NOT IN ('active','suspended','removed') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
UPDATE public.companies SET platform_status=_data->>'status' WHERE id=c;
ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
IF NOT FOUND THEN RAISE EXCEPTION 'Registo não encontrado'; END IF;
INSERT INTO public.platform_audit(actor_id,company_id,action,details) VALUES(auth.uid(),c,_action,_data);
END $$;
REVOKE ALL ON FUNCTION public.platform_manage(text,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.platform_manage(text,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.redeem_company_coupon(_company uuid,_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.platform_coupons;
BEGIN
IF NOT public.is_company_admin(_company,auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
SELECT * INTO v FROM public.platform_coupons WHERE code=upper(trim(_code)) FOR UPDATE;
IF v.id IS NULL OR NOT v.enabled OR v.expires_at<=now() OR v.uses>=v.max_uses THEN RAISE EXCEPTION 'Cupão inválido, expirado ou esgotado'; END IF;
INSERT INTO public.coupon_redemptions(company_id,coupon_id,redeemed_by) VALUES(_company,v.id,auth.uid());
UPDATE public.platform_coupons SET uses=uses+1 WHERE id=v.id;
UPDATE public.company_subscriptions SET coupon_id=v.id WHERE company_id=_company;
RETURN jsonb_build_object('percent_off',v.percent_off,'plan_id',v.plan_id,'expires_at',v.expires_at);
END $$;
REVOKE ALL ON FUNCTION public.redeem_company_coupon(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.redeem_company_coupon(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.enforce_store_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF EXISTS(SELECT 1 FROM public.companies WHERE id=NEW.company_id AND platform_status<>'active') THEN RAISE EXCEPTION 'Loja indisponível'; END IF; RETURN NEW; END $$;
CREATE TRIGGER enforce_store_status BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_store_status();