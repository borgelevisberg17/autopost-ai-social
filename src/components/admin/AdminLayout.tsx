import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  Activity,
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
  FileClock,
  ListChecks,
  Megaphone,
  CreditCard,
  Search,
  Settings,
  Share2,
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
      {
        to: "/admin/pagamentos",
        icon: CreditCard,
        label: "Pagamentos",
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
      {
        to: "/admin/conteudo",
        icon: Megaphone,
        label: "Conteúdo",
      },
      {
        to: "/admin/automacoes",
        icon: ListChecks,
        label: "Automações",
      },
      {
        to: "/admin/atividade",
        icon: Activity,
        label: "Atividade",
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
    label: "Canais",
    items: [
      {
        to: "/admin/canais",
        icon: Share2,
        label: "Canais",
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
      {
        to: "/admin/equipa",
        icon: Users,
        label: "Equipa",
      },
      {
        to: "/admin/auditoria",
        icon: FileClock,
        label: "Audit log",
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
    to: "/admin/canais",
    icon: Share2,
    label: "Canais",
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
      <div className="grid min-h-screen place-items-center bg-[#fffdf9]">
        <Loader2 className="h-5 w-5 animate-spin text-[#747b73]" />
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f6f3ed] text-[#202522]">
      {/* COMMAND PALETTE */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-white/10 bg-[#202522] text-[#f6f3ed] lg:flex lg:flex-col">
        {/* BRAND */}
        <div className="px-6 pb-5 pt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-4"
          >
            <div className="grid h-8 w-8 place-items-center bg-[#e36c3f] text-white">
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
            className="flex h-9 w-full items-center justify-between rounded-sm border border-[#d9d5cc] bg-[#fffdf9] px-3 text-xs font-medium text-[#747b73] transition hover:bg-[#fffdf9]/10 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-[#a7aaa2]" />
              <span>Pesquisar...</span>
            </span>
            <kbd className="rounded border border-[#ded9d0] bg-[#fffdf9] px-1.5 py-0.5 font-mono text-[10px] text-[#a7aaa2]">
              ⌘K
            </kbd>
          </button>

          <div className="border-b border-[#ded9d0] pb-4">
            <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#a7aaa2]">
              Sua loja
            </p>

            {companies.length > 1 ? (
              <select
                value={company.id}
                onChange={(e) => select(e.target.value)}
                aria-label="Selecionar loja"
                className="h-9 w-full rounded-sm border border-[#ded9d0] bg-[#fffdf9] px-2.5 text-xs font-medium text-[#202522] outline-none transition focus:border-[#2c6457] focus:ring-1 focus:ring-[#2c6457]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-9 items-center rounded-sm border border-[#ded9d0] px-3">
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
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7aaa2]">
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
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2",
                            isActive
                              ? "bg-white/10 font-semibold text-[#fffdf9]"
                              : "font-medium text-[#747b73] hover:bg-[#f1eee7] hover:text-[#202522]",
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
        <div className="border-t border-[#ded9d0] px-4 py-3">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-9 items-center gap-3 rounded-sm px-3 text-xs font-medium text-[#747b73] transition-colors hover:bg-[#f1eee7] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
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
            className="mt-0.5 flex min-h-9 w-full items-center gap-3 rounded-sm px-3 text-xs font-medium text-[#a7aaa2] transition-colors hover:bg-[#f1eee7] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
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
        <header className="sticky top-0 z-30 border-b border-[#ded9d0] bg-[#fffdf9]">
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="truncate text-[19px] font-semibold tracking-[-0.035em]">
                {title}
              </h1>

              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded border border-[#d9d5cc] bg-[#fffdf9] px-2.5 py-1 text-xs text-[#747b73] hover:bg-[#fffdf9]/10 hover:text-white"
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
                  className="relative grid h-9 w-9 place-items-center rounded-sm border border-[#ded9d0] bg-[#fffdf9] text-neutral-600 transition hover:bg-[#f1eee7] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e36c3f] text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DROPDOWN */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-lg border border-[#ded9d0] bg-[#fffdf9] shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#ded9d0] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-950">Notificações</span>
                        {unreadCount > 0 && (
                          <span className="rounded bg-[#ebe7df] px-1.5 py-0.5 text-[10px] font-semibold text-neutral-800">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-medium text-[#747b73] hover:text-[#202522]"
                          >
                            Marcar lidas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[#a7aaa2] hover:text-[#202522]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#a7aaa2]">
                          Sem notificações de momento.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id, n.link)}
                            className={cn(
                              "cursor-pointer p-3.5 transition hover:bg-[#f1eee7]",
                              !n.read && "bg-[#f1eee7]/80"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-neutral-950">{n.title}</p>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e36c3f]" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{n.message}</p>
                            <p className="mt-1.5 text-[10px] text-[#a7aaa2]">
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
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ded9d0] bg-[#fffdf9] lg:hidden">
        <div className="mx-auto grid h-[68px] max-w-lg grid-cols-6">
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
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-inset",
                    isActive
                      ? "text-neutral-950"
                      : "text-[#a7aaa2]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                      "grid h-7 w-10 place-items-center rounded-[7px] transition-colors",
                        isActive && "bg-[#ebe7df]",
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
