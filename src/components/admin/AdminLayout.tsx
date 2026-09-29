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
  ExternalLink,
} from "lucide-react";

import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Loja",
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Visão geral",
      },
      {
        to: "/admin/produtos",
        icon: Package,
        label: "Produtos",
      },
      {
        to: "/admin/pedidos",
        icon: ShoppingBag,
        label: "Pedidos",
      },
    ],
  },
  {
    label: "Automação",
    items: [
      {
        to: "/admin/agentes",
        icon: Bot,
        label: "Agentes",
      },
    ],
  },
  {
    label: "Definições",
    items: [
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
    label: "Início",
  },
  {
    to: "/admin/produtos",
    icon: Package,
    label: "Produtos",
  },
  {
    to: "/admin/pedidos",
    icon: ShoppingBag,
    label: "Pedidos",
  },
  {
    to: "/admin/agentes",
    icon: Bot,
    label: "Agentes",
  },
  {
    to: "/admin/config",
    icon: Settings,
    label: "Config.",
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
    <div className="min-h-screen bg-white text-neutral-950">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        {/* BRAND */}
        <div className="px-6 pb-7 pt-7">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
          >
            <div className="grid h-8 w-8 place-items-center bg-black text-white">
              <Store className="h-[15px] w-[15px]" strokeWidth={1.8} />
            </div>

            <span className="text-[17px] font-semibold tracking-[-0.04em]">
              Vendora
            </span>
          </Link>
        </div>

        {/* STORE */}
        <div className="px-4">
          <div className="border-b border-neutral-200 pb-5">
            <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              Sua loja
            </p>

            {companies.length > 1 ? (
              <select
                value={company.id}
                onChange={(e) => select(e.target.value)}
                aria-label="Selecionar loja"
                className="h-10 w-full rounded-sm border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-10 items-center rounded-sm border border-neutral-200 px-3">
                <span className="truncate text-sm font-medium">
                  {company.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-7">
            {navSections.map((section) => (
              <section key={section.label}>
                <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                  {section.label}
                </p>

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                          cn(
                            "flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isActive
                              ? "bg-neutral-100 font-semibold text-neutral-950"
                              : "font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950",
                          )
                        }
                      >
                        <Icon
                          className="h-[17px] w-[17px] shrink-0"
                          strokeWidth={1.8}
                        />

                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* BOTTOM */}
        <div className="border-t border-neutral-200 px-4 py-4">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ExternalLink
              className="h-[17px] w-[17px]"
              strokeWidth={1.8}
            />
            <span>Ver loja</span>
          </a>

          <button
            type="button"
            onClick={signOut}
            className="mt-0.5 flex min-h-10 w-full items-center gap-3 rounded-sm px-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <LogOut
              className="h-[17px] w-[17px]"
              strokeWidth={1.8}
            />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 pb-[76px] lg:ml-[240px] lg:pb-0">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold tracking-[-0.035em]">
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

        {/* PAGE */}
        <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {children}
        </div>
      </main>

      {/* MOBILE HEADER / NAV */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white lg:hidden">
        <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5">
          {mobileNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors",
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
                        isActive && "bg-neutral-100",
                      )}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={isActive ? 2 : 1.7}
                      />
                    </span>

                    <span className="truncate">{item.label}</span>
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
