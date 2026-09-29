import { ReactNode } from "react";
import { Link, NavLink, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Bot,
  Settings,
  Store,
  LogOut,
  Loader2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Operação",
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Visão geral",
      },
      {
        to: "/admin/pedidos",
        icon: ShoppingBag,
        label: "Pedidos",
      },
      {
        to: "/admin/produtos",
        icon: Package,
        label: "Produtos",
      },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      {
        to: "/admin/agentes",
        icon: Bot,
        label: "Agentes",
      },
      {
        to: "/admin/config",
        icon: Settings,
        label: "Configurações",
      },
    ],
  },
];

const mobileNav = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Painel",
  },
  {
    to: "/admin/pedidos",
    icon: ShoppingBag,
    label: "Pedidos",
  },
  {
    to: "/admin/produtos",
    icon: Package,
    label: "Produtos",
  },
  {
    to: "/admin/config",
    icon: Settings,
    label: "Config",
  },
];

export function AdminLayout({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { company, companies, loading, select } = useCompany();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        {/* BRAND */}
        <div className="border-b border-neutral-200 px-5 py-5">
          <Link
            to="/dashboard"
            className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black text-white">
              <Store className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-tight">
                Vendora
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Administração
              </p>
            </div>
          </Link>
        </div>

        {/* COMPANY */}
        <div className="px-4 pt-5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            Minha loja
          </p>

          {companies.length > 1 ? (
            <div className="relative mt-2">
              <select
                value={company.id}
                onChange={(e) => select(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 pr-9 text-sm font-semibold text-neutral-900 outline-none transition hover:border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100"
                aria-label="Selecionar loja"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          ) : (
            <div className="mt-2 flex min-h-10 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3">
              <span className="truncate text-sm font-semibold text-neutral-900">
                {company.name}
              </span>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-7">
          <div className="space-y-7">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  {section.label}
                </p>

                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                          cn(
                            "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isActive
                              ? "bg-black text-white"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* FOOTER NAV */}
        <div className="border-t border-neutral-200 p-4">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ver loja</span>
          </a>

          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 pb-20 lg:ml-[248px] lg:pb-8">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {title}
              </h1>
            </div>

            {actions && (
              <div className="flex shrink-0 items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white lg:hidden">
        <div className="mx-auto flex h-[68px] max-w-lg items-stretch justify-around px-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset",
                    isActive
                      ? "text-neutral-950"
                      : "text-neutral-400",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-7 w-10 place-items-center rounded-full transition-colors",
                        isActive
                          ? "bg-neutral-100 text-neutral-950"
                          : "text-neutral-400",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
