CREATE TABLE public.store_themes (
 company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
 draft jsonb NOT NULL DEFAULT '{}'::jsonb,
 published jsonb,
 published_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.store_theme_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 theme jsonb NOT NULL,
 published_by uuid,
 created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.store_themes TO authenticated;
GRANT SELECT ON public.store_theme_versions TO authenticated;
GRANT ALL ON public.store_themes, public.store_theme_versions TO service_role;
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_theme_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage theme" ON public.store_themes FOR ALL TO authenticated USING (public.is_company_admin(company_id, auth.uid())) WITH CHECK (public.is_company_admin(company_id, auth.uid()));
CREATE POLICY "admins read versions" ON public.store_theme_versions FOR SELECT TO authenticated USING (public.is_company_admin(company_id, auth.uid()));
CREATE TRIGGER store_themes_updated BEFORE UPDATE ON public.store_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX store_theme_versions_company ON public.store_theme_versions(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_store_theme(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT t.published FROM public.store_themes t JOIN public.companies c ON c.id=t.company_id
 WHERE c.slug=_slug AND c.platform_status='active' $$;
GRANT EXECUTE ON FUNCTION public.get_store_theme(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.publish_store_theme(_company uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d jsonb; e jsonb; f jsonb;
BEGIN
 IF NOT public.is_company_admin(_company, auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT draft INTO d FROM public.store_themes WHERE company_id=_company;
 IF d IS NULL THEN RAISE EXCEPTION 'Sem rascunho'; END IF;
 IF octet_length(d::text) > 200000 THEN RAISE EXCEPTION 'Tema demasiado grande'; END IF;
 e := public.company_entitlement(_company);
 f := coalesce(e->'features','[]'::jsonb);
 IF NOT (f ? 'analytics') THEN d := d - 'sections' - 'fonts' - 'customSections'; END IF;
 UPDATE public.store_themes SET published=d, published_at=now() WHERE company_id=_company;
 IF f ? 'sales' THEN
  INSERT INTO public.store_theme_versions(company_id, theme, published_by) VALUES(_company, d, auth.uid());
  DELETE FROM public.store_theme_versions WHERE company_id=_company AND id NOT IN (SELECT id FROM public.store_theme_versions WHERE company_id=_company ORDER BY created_at DESC LIMIT 10);
 END IF;
 RETURN d;
END $$;
GRANT EXECUTE ON FUNCTION public.publish_store_theme(uuid) TO authenticated;