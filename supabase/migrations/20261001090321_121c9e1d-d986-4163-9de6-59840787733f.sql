ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS business_settings_company_uidx ON public.business_settings(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS content_history_company_idx ON public.content_history(company_id, created_at DESC);

CREATE POLICY "Members view company content" ON public.content_history
  FOR SELECT TO authenticated USING (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Members view company settings" ON public.business_settings
  FOR SELECT TO authenticated USING (company_id IS NOT NULL AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Admins update company settings" ON public.business_settings
  FOR UPDATE TO authenticated USING (company_id IS NOT NULL AND public.is_company_admin(company_id, auth.uid()));

CREATE POLICY "Members update agent runs" ON public.agent_runs
  FOR UPDATE TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE INDEX IF NOT EXISTS idx_agent_runs_company ON public.agent_runs(company_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_company ON public.agent_actions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_created ON public.orders(company_id, created_at DESC);