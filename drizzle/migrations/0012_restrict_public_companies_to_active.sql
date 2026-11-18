DROP POLICY IF EXISTS "Public can view companies" ON public.companies;
CREATE POLICY "Public can view active storefronts" ON public.companies FOR SELECT TO anon USING (platform_status = 'active');