DROP POLICY IF EXISTS "Public view active products" ON public.products;
CREATE POLICY "Public view active products" ON public.products FOR SELECT TO anon USING (active);
CREATE POLICY "Members view products" ON public.products FOR SELECT TO authenticated USING (active OR public.is_company_member(company_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user = auth.uid() AND EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company AND user_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_company_admin(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user = auth.uid() AND EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company AND user_id = _user AND role IN ('owner','admin'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated;