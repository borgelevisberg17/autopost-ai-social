import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  Bell,
  BarChart3,
  Bot,
  Box,
  Check,
  CheckSquare,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";

import { CommandPalette } from "@/components/admin/CommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
};

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
        to: "/admin/inventario",
        icon: Box,
        label: "Inventário",
      },
      {
        to: "/admin/pedidos",
        icon: ShoppingBag,
        label: "Pedidos",
      },
      {
        to: "/admin/clientes",
        icon: Users,
        label: "Clientes",
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
      {
        to: "/admin/aprovacoes",
        icon: CheckSquare,
        label: "Aprovações",
      },
    ],
  },
  {
    label: "Análise",
    items: [
      {
        to: "/admin/analytics",
        icon: BarChart3,
        label: "Analytics",
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
    to: "/admin/clientes",
    icon: Users,
    label: "Clientes",
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
  const navigate = useNavigate();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!company) return;

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setNotifications((data as Notification[]) ?? []);
    }

    loadNotifications();
  }, [company?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    if (!company) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("company_id", company.id)
      .eq("read", false);

    setNotifications((curr) => curr.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (id: string, link?: string | null) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (link) {
      navigate(link);
      setNotificationsOpen(false);
    }
  };

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
      {/* COMMAND PALETTE */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-neutral-200 bg-white lg:flex lg:flex-col">
        {/* BRAND */}
        <div className="px-6 pb-5 pt-6">
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

        {/* STORE & COMMAND PALETTE BUTTON */}
        <div className="px-4 space-y-2">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex h-9 w-full items-center justify-between rounded-sm border border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-black"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <span>Pesquisar...</span>
            </span>
            <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
              ⌘K
            </kbd>
          </button>

          <div className="border-b border-neutral-200 pb-4">
            <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              Sua loja
            </p>

            {companies.length > 1 ? (
              <select
                value={company.id}
                onChange={(e) => select(e.target.value)}
                aria-label="Selecionar loja"
                className="h-9 w-full rounded-sm border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-9 items-center rounded-sm border border-neutral-200 px-3">
                <span className="truncate text-xs font-semibold">
                  {company.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {navSections.map((section) => (
              <section key={section.label}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
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
                            "flex min-h-9 items-center gap-3 rounded-sm px-3 text-xs transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isActive
                              ? "bg-neutral-100 font-semibold text-neutral-950"
                              : "font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950",
                          )
                        }
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
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
        <div className="border-t border-neutral-200 px-4 py-3">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-9 items-center gap-3 rounded-sm px-3 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ExternalLink
              className="h-4 w-4"
              strokeWidth={1.8}
            />
            <span>Ver loja pública</span>
          </a>

          <button
            type="button"
            onClick={signOut}
            className="mt-0.5 flex min-h-9 w-full items-center gap-3 rounded-sm px-3 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <LogOut
              className="h-4 w-4"
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
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="truncate text-[19px] font-semibold tracking-[-0.035em]">
                {title}
              </h1>

              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-black"
              >
                <Search className="h-3.5 w-3.5" />
                <span>⌘K</span>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* NOTIFICATION BELL */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative grid h-9 w-9 place-items-center rounded-sm border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DROPDOWN */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-lg border border-neutral-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-950">Notificações</span>
                        {unreadCount > 0 && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-800">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-950"
                          >
                            Marcar lidas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-neutral-400 hover:text-neutral-950"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-400">
                          Sem notificações de momento.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id, n.link)}
                            className={cn(
                              "cursor-pointer p-3.5 transition hover:bg-neutral-50",
                              !n.read && "bg-neutral-50/80"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-neutral-950">{n.title}</p>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{n.message}</p>
                            <p className="mt-1.5 text-[10px] text-neutral-400">
                              {new Intl.DateTimeFormat("pt-PT", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(n.created_at))}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {actions}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-7 lg:px-10 lg:py-8">
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
