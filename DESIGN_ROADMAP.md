# Vendora — Design system and product roadmap audit

Updated: 2026-09-30

## 1. Current system inventory

### Public routes

- `/` — product landing
- `/login` — authentication
- `/signup` — account creation
- `/forgot-password` — password recovery request
- `/reset-password` — password reset
- `/onboarding` — protected company/store setup
- `/loja/:slug` — public storefront, search, categories, product detail, cart and checkout are currently implemented as one surface
- `/loja/:slug/pedido/:id` — order tracking/status
- `*` — not found

### Authenticated routes

- `/dashboard` — overview
- `/admin/produtos` — product catalog and editor
- `/admin/inventario` — inventory view and movements
- `/admin/pedidos` — orders table, filters, bulk actions, export and drawer/timeline
- `/admin/clientes` — customer list and detail
- `/admin/agentes` — marketing-agent command surface and action log
- `/admin/aprovacoes` — agent content approval surface
- `/admin/analytics` — sales analytics
- `/admin/canais` — channel connection state and honest unsupported states
- `/admin/config` — current combined company/settings surface

### Reusable infrastructure

- `AdminLayout` — authenticated shell, desktop sidebar, mobile bottom navigation, notifications and command palette
- `AuthShell` — authentication composition
- Radix/shadcn primitives — dialogs, drawers, sheets, tables, forms, tabs, badges, alerts, skeletons, pagination, command menu and controls
- `ProtectedRoute`, `AuthProvider`, `CompanyProvider`
- Supabase client and generated database types

## 2. Backend facts used as product constraints

Existing tables and functions include:

- `companies`, `company_members`, `profiles`
- `products`, `orders`, `order_items`
- `customers`, `order_events`, `inventory_movements`
- `agents`, `agent_permissions`, `agent_runs`, `agent_actions`
- `social_connections`, `notifications`, `audit_logs`
- `business_settings`, `content_history`
- `place_order`, `get_order_status`, `restock_cancelled_order`
- `marketing-agent` edge function

Constraints:

- Product images are external HTTPS URLs; no public storage bucket.
- Orders must be created with `place_order` so stock is checked/decremented atomically.
- Agent actions are logged and must remain auditable.
- Social connections must not be shown as OAuth-connected unless a real row/state exists.
- There is no clear backend support yet for billing, scheduled content/calendar records, payments as a separate entity, or a general automation builder.

## 3. Roadmap coverage matrix

Legend: **Done** = implemented and validated; **Partial** = surface exists but needs a dedicated pass; **Gap** = do not fake it; prepare honestly or add backend only if separately authorized.

| Roadmap area | Status | Current reality / next action |
|---|---|---|
| Initial repository/system analysis | Done | Inventory and schema constraints are documented here. |
| Proprietary visual identity | Partial | Cinder & Signal tokens exist; needs a final consistency sweep and removal of remaining legacy utility usage. |
| Global design tokens | Partial | `src/index.css` and button foundation updated; many primitives still expose legacy variants. |
| Public landing | Done | Product-led landing with product UI, channels, catalog, approval center, WhatsApp commerce, analytics and animated catalog-sync motion composition. |
| Login/signup/recovery/reset | Done | Shared AuthShell and aligned form surfaces, focus states and responsive layout. |
| Onboarding | Done | Three-step operational setup using real company/product fields. |
| Public store | Done/validated | Store has header, search, categories, product detail sheet, cart, checkout, success, stock limits, empty state and tracking link. |
| Order tracking | Partial | Route and RPC-backed status surface exist; needs consistent timeline/status language pass. |
| Dashboard | Partial | Uses real orders/products data and answers core sales questions; activity/agent data coverage needs explicit audit. |
| Orders | Partial | Search, filters, bulk actions, export, drawer and order/payment/fulfillment split exist; needs final table/mobile review. |
| Products | Partial | Catalog CRUD, search, filters, pricing, stock, status, duplicate/edit/actions exist; destructive-history behavior needs verification. |
| Inventory | Partial | Dedicated page and movements exist; reserved/available semantics need validation against actual data. |
| Customers | Partial | List/detail surface exists; interactions and notes need backend-backed clarification. |
| Agents | Partial | Marketing agent and logged actions exist; no evidence of full configurable multi-agent backend. Do not invent it. |
| Approval center | Partial | Existing approval/action data exists; review/edit/publish coverage needs validation against supported statuses. |
| Content calendar | Honest prepared state | `/admin/conteudo` exposes the roadmap surface without claiming scheduling; no calendar table exists in backend. |
| Channels | Done/Partial | `/admin/canais` reads `social_connections`, supports disconnect, and clearly marks unsupported integrations. Needs settings subviews only when backend supports them. |
| Settings | Partial | Company settings remains the next modularization target; team, channel, audit and unsupported automation/payment surfaces now have separate routes. |
| Team/permissions | Done/partial | `/admin/equipa` reads company_members and displays real roles; editing still requires a deliberate permissions workflow. |
| Audit/security | Done/partial | `/admin/auditoria` reads audit_logs with real actor/action/target data. |
| Payments | Gap | `payment_status` exists on orders, but no payments entity/gateway surface is present. Keep it as order status only. |
| Automations | Gap | No general automation builder/table found. Do not add fake automation rules. |
| Responsive design | Partial | Mobile navigation, ecommerce surfaces and compact auth/onboarding layouts exist; remaining admin tables require device-by-device QA. |
| Loading/error/empty states | Partial | Most data pages have loading and toast/error handling; standardized states are not yet centralized. |
| Accessibility | Partial | Labels/focus states exist in many flows; audit keyboard, aria and contrast page by page. |
| Performance | Partial | Build succeeds; JS bundle is large (~1.25 MB) and route-level code splitting is not implemented. |
| SEO | Partial | Base title, description, favicon, OG and Twitter metadata exist; no route-level metadata or structured data yet. |
| Brand asset system | Partial/intentional | No random stock imagery; public landing uses product UI and an accessible CSS motion composition. Four generated product visuals are now embedded in bordered editorial frames: storefront, Instagram publishing, WhatsApp commerce, and operations/audit. Native generated video remains unavailable on the current plan, so the catalog motion block stays as a CSS product demonstration. |

## 4. Execution order

1. **Freeze data contracts** — no visual surface may imply unsupported backend behavior.
2. **Finish design-system primitives** — shared page header, section header, status badge, empty state, loading state and data table conventions.
3. **Finish public system** — auth pages, onboarding, store, product/cart/checkout/status states.
4. **Finish core commerce operations** — dashboard, orders, products, inventory, customers.
5. **Finish intelligence surfaces** — agents, approvals and activity using existing logs only.
6. **Finish supported administration** — channels, company, team/roles, security and audit.
7. **Mark unsupported areas explicitly** — calendar, billing, API, general automations, external OAuth where backend is absent.
8. **Responsive/accessibility/performance pass** — mobile tables/cards, focus order, reduced motion, route splitting.
9. **Final consistency pass** — colors, typography, radius, borders, icons, loading, empty, errors, drawers and modals.

## 5. Non-negotiable quality checks

- No glassmorphism, gradients, neon, blobs, AI-brain/robot imagery or generic stock visuals.
- No permanent fake data in authenticated product surfaces.
- Marketing/demo data only inside marketing compositions.
- No OAuth connected state without a real connection record.
- No destructive product deletion where history semantics prohibit it.
- No critical agent action without explicit approval.
- Orders remain atomic through `place_order`.
- Empty, loading, error and retry states must exist for every data-heavy page.
- Mobile is designed as a separate layout, not a desktop shrink.
