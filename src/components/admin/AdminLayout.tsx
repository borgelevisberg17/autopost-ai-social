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
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const companyId = company?.id;
    if (!companyId) return;

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("company_id", companyId)
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
      curr.map((n) => (n.id === id ? { ...n, read: true } : n)),
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] border-r border-[#e4e0d7] bg-[#faf9f4] text-[#202522] lg:flex lg:flex-col">
        {/* BRAND */}
        <div className="px-6 pb-5 pt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-4"
          >
            <img
              src="/vendora-mark.png"
              alt=""
              aria-hidden="true"
              className="h-9 w-9"
            />

            <span className="font-serif text-[23px] font-medium tracking-[-0.045em] text-[#202522]">
              Vendora
            </span>
          </Link>
        </div>

        {/* STORE SWITCHER */}
        <div className="px-4">
          <div className="border-b border-[#e5e1d8] pb-4">
            <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#858c83]">
              Sua loja
            </p>

            {companies.length > 1 ? (
              <select
                value={company.id}
                onChange={(e) => select(e.target.value)}
                aria-label="Selecionar loja"
                className="h-10 w-full rounded-[4px] border border-[#e3dfd6] bg-[#fffdf9] px-3 text-xs font-medium text-[#202522] outline-none transition focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/20"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-10 items-center rounded-[4px] border border-[#e3dfd6] bg-[#fffdf9] px-3">
                <span className="truncate text-xs font-semibold">
                  {company.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-5">
            {navSections.map((section) => (
              <section key={section.label}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#858c83]">
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
                            "flex min-h-10 items-center gap-3 rounded-[4px] border-l-2 px-3 text-[13px] transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2",
                            isActive
                              ? "border-[#2c6457] bg-[#e7eadf] font-semibold text-[#202522]"
                              : "border-transparent font-medium text-[#666e66] hover:bg-[#f0efe9] hover:text-[#202522]",
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />

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
        <div className="border-t border-[#e5e1d8] px-4 py-3">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-[4px] px-3 text-[13px] font-medium text-[#666e66] transition-colors hover:bg-[#f0efe9] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
            <span>Ver loja pública</span>
          </a>

          <button
            type="button"
            onClick={signOut}
            className="mt-0.5 flex min-h-10 w-full items-center gap-3 rounded-[4px] px-3 text-[13px] font-medium text-[#777e76] transition-colors hover:bg-[#f0efe9] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 pb-[calc(76px+env(safe-area-inset-bottom))] lg:ml-[252px] lg:pb-0">
        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-[#e5e1d8] bg-[#f8f7f1]/95 backdrop-blur-sm">
          <div className="mx-auto flex min-h-[68px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:min-h-[76px] sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/vendora-mark.png"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0 lg:hidden"
              />
              <div className="min-w-0">
                <h1 className="truncate font-serif text-[21px] font-medium tracking-[-0.03em] text-[#202522] sm:text-[25px]">
                  {title}
                </h1>
                {companies.length > 1 ? (
                  <select
                    value={company.id}
                    onChange={(e) => select(e.target.value)}
                    aria-label="Selecionar loja"
                    className="mt-0.5 block w-full max-w-[190px] truncate bg-transparent text-[10px] font-medium text-[#687168] outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] lg:hidden"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="truncate text-[10px] text-[#858c83] lg:hidden">
                    {company.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Pesquisar pedidos, produtos e clientes"
                className="group flex h-10 w-10 items-center justify-center gap-2 rounded-[4px] border border-[#e3dfd6] bg-[#fffdf9] px-3 text-left text-xs text-[#737a72] transition hover:border-[#b9c6b7] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:w-[min(32vw,290px)] sm:justify-start lg:w-[min(28vw,340px)]"
              >
                <Search className="h-4 w-4 shrink-0 text-[#687168]" />
                <span className="hidden min-w-0 flex-1 truncate sm:block">
                  Pesquisar pedidos, produtos, clientes...
                </span>
                <kbd className="ml-auto hidden shrink-0 border border-[#e5e1d8] bg-[#f8f7f1] px-1.5 py-0.5 font-mono text-[10px] text-[#858c83] lg:block">
                  ⌘ K
                </kbd>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative grid h-10 w-10 place-items-center rounded-[4px] border border-[#e3dfd6] bg-[#fffdf9] text-[#525c54] transition hover:border-[#b9c6b7] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  aria-label="Notificações"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#bd592f] px-1 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="fixed left-3 right-3 top-[76px] z-50 overflow-hidden rounded-[4px] border border-[#ded9d0] bg-[#fffdf9] shadow-[0_16px_48px_rgba(32,37,34,0.16)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
                    <div className="flex items-center justify-between border-b border-[#e9e5dc] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#202522]">
                          Notificações
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-[#e9eee9] px-1.5 py-0.5 text-[10px] font-semibold text-[#2c6457]">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-medium text-[#687168] hover:text-[#202522]"
                          >
                            Marcar lidas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          aria-label="Fechar notificações"
                          className="grid h-7 w-7 place-items-center text-[#858c83] hover:bg-[#f1eee7] hover:text-[#202522]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[min(65vh,420px)] divide-y divide-[#eeeae2] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#858c83]">
                          Sem notificações de momento.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markAsRead(n.id, n.link)}
                            className={cn(
                              "w-full cursor-pointer p-4 text-left transition hover:bg-[#f5f4ee]",
                              !n.read && "bg-[#f1f3ed]",
                            )}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="text-xs font-semibold text-[#202522]">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e36c3f]" />
                              )}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#687168]">
                              {n.message}
                            </span>
                            <span className="mt-2 block font-mono text-[10px] text-[#92978e]">
                              {new Intl.DateTimeFormat("pt-PT", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(n.created_at))}
                            </span>
                          </button>
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
        <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-8">
          {children}
        </div>
      </main>

      {/* MOBILE HEADER / NAV */}
      <nav className="fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)] z-50 border-t border-[#e4e0d7] bg-[#fbfaf6]/95 shadow-[0_-8px_26px_rgba(32,37,34,0.08)] backdrop-blur-sm lg:hidden">
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
                    isActive ? "text-[#2c6457]" : "text-[#858c83]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-7 w-10 place-items-center rounded-[7px] transition-colors",
                        isActive && "bg-[#e7eadf]",
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
