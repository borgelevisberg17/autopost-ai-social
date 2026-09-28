# Architecture rules

- Multi-tenant: every business table has `company_id`; access via `is_company_member`/`is_company_admin` security-definer functions — keeps tenants isolated without recursive RLS.
- Orders are only created through the `place_order` RPC — it checks and decrements stock atomically so all channels share one stock.
- AI agents run in edge functions, read data through the caller's session, check rules before generating, and log every action to `agent_actions` — agents must be auditable and never invent data.
- Product images are external https links — public storage buckets are blocked on this project.
