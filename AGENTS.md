# Architecture rules

- Subscription entitlements are resolved server-side, with expiring grants falling back to the base plan; AI quota reservations and product limits use company-level locks to prevent concurrent bypasses.
- Platform administration uses authenticated security-definer RPCs with platform-admin checks and immutable audit entries; removing a company is reversible archival to preserve orders and financial history.
- Integration credentials are encrypted with AES-GCM, bound to company/provider scope, and accessible only to server functions; storefront checkout never falls back to platform merchant credentials.
- Plan-dependent routes and navigation use the same feature map; server entitlements remain authoritative for operations and quota.

- Multi-tenant: every business table has `company_id`; access via `is_company_member`/`is_company_admin` security-definer functions — keeps tenants isolated without recursive RLS.
- Orders are only created through the `place_order` RPC — it checks and decrements stock atomically so all channels share one stock.
- AI agents run in edge functions, read data through the caller's session, check rules before generating, and log every action to `agent_actions` — agents must be auditable and never invent data.
- Product images are external https links — public storage buckets are blocked on this project.
- Meta WhatsApp app credentials are shared only in server-side secrets; phone numbers and conversations remain company-scoped, while cross-company metrics require a protected platform-admin role.
