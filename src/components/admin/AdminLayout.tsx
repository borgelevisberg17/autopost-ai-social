import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  MessageCircle,
  Bell,
  BarChart3,
  Bot,
  Box,
  Check,
  CheckSquare,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  FileClock,
  ListChecks,
  Megaphone,
  CreditCard,
  MoreHorizontal,
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
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/hooks/useEntitlement";
import { routeAllowed } from "@/lib/planAccess";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    label: "Comércio",
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
        badgeKey: "orders",
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
    label: "Comunicação & Vendas",
    items: [
      {
        to: "/admin/conversas",
        icon: MessageCircle,
        label: "Conversas WhatsApp",
        isWhatsApp: true,
      },
      {
        to: "/admin/canais",
        icon: Share2,
        label: "Canais de Venda",
      },
    ],
  },
  {
    label: "Automação & IA",
    items: [
      {
        to: "/admin/agentes",
        icon: Bot,
        label: "Agentes IA",
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
        to: "/admin/aprovacoes",
        icon: CheckSquare,
        label: "Aprovações",
      },
      {
        to: "/admin/atividade",
        icon: Activity,
        label: "Atividade",
      },
    ],
  },
  {
    label: "Gestão & Definições",
    items: [
      {
        to: "/admin/analytics",
        icon: BarChart3,
        label: "Analytics",
      },
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
        label: "Auditoria",
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
    to: "/admin/pedidos",
    icon: ShoppingBag,
    label: "Pedidos",
  },
  {
    to: "/admin/conversas",
    icon: MessageCircle,
    label: "Conversas",
  },
  {
    to: "/admin/produtos",
    icon: Package,
    label: "Produtos",
  },
  {
    to: "/admin/clientes",
    icon: Users,
    label: "Clientes",
  },
];

const mobilePrimaryRoutes = new Set(mobileNav.map((item) => item.to));

export function AdminLayout({
  title,
  actions,
  children,
  fullBleed,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const {
    company,
    companies,
    loading,
    error: companyError,
    reload,
    select,
  } = useCompany();
  const { signOut, user } = useAuth();
  const { data: entitlement } = useEntitlement();
  const allowedSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        routeAllowed(item.to, entitlement ?? null),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [openConvoCount, setOpenConvoCount] = useState<number>(0);

  useEffect(() => {
    setPlatformAdmin(false);
    if (user) {
      void supabase
        .rpc("has_platform_admin", { _user: user.id })
        .then(({ data }) => setPlatformAdmin(data === true));
    }
  }, [user]);

  const navigate = useNavigate();
  const location = useLocation();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreDialogRef = useRef<HTMLElement>(null);

  // Quick stats query for sidebar indicators
  useEffect(() => {
    if (!company?.id) return;

    void supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .eq("status", "pending")
      .then(({ count }) => {
        if (typeof count === "number") setPendingOrdersCount(count);
      });

    void supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .neq("status", "closed")
      .then(({ count }) => {
        if (typeof count === "number") setOpenConvoCount(count);
      });
  }, [company?.id]);

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
  const moreActive = !mobilePrimaryRoutes.has(location.pathname);

  useEffect(() => {
    if (!moreOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() =>
      moreDialogRef.current?.focus(),
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeOnEscape);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [moreOpen]);

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
      <div className="grid min-h-screen place-items-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-500">A carregar Vendora...</p>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8fafc] px-5 text-slate-900">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">
            Não foi possível carregar a sua loja
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ocorreu um erro ao carregar as informações do seu negócio.
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 h-10 w-full rounded-lg bg-slate-900 px-5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!company) {
    return <Navigate to="/onboarding" replace />;
  }

  const isFullBleed = fullBleed ?? title?.toLowerCase().includes("conversas");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* COMMAND PALETTE */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* MODERN EXECUTIVE SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-slate-200/80 bg-white text-slate-900 lg:flex lg:flex-col shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        {/* BRAND LOCKUP */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-slate-100">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <img
              src="/vendora-mark.png"
              alt="Vendora"
              className="h-7 w-7 rounded-lg shadow-xs"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-bold tracking-tight text-slate-900">
                Vendora
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 border border-emerald-200/60">
                OS
              </span>
            </div>
          </Link>
        </div>

        {/* WORKSPACE / STORE SELECTOR CHIP */}
        <div className="px-3 py-3 border-b border-slate-100">
          {companies.length > 1 ? (
            <Popover open={storeSwitcherOpen} onOpenChange={setStoreSwitcherOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-left transition hover:border-slate-300 hover:bg-white hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-2xs">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {company.name}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Loja ativa
                    </p>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[236px] p-1.5 shadow-xl rounded-xl border-slate-200" align="start">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Suas lojas ({companies.length})
                </p>
                <div className="mt-1 space-y-0.5">
                  {companies.map((c) => {
                    const isCurrent = c.id === company.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          select(c.id);
                          setStoreSwitcherOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition",
                          isCurrent
                            ? "bg-slate-100 font-bold text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-800">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate flex-1 text-left">{c.name}</span>
                        {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-left">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-2xs">
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">
                  {company.name}
                </p>
                <p className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Loja online
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {allowedSections.map((section) => (
            <section key={section.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isWhatsApp = "isWhatsApp" in item && item.isWhatsApp;
                  const isOrders = item.to === "/admin/pedidos";

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        cn(
                          "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                          isActive
                            ? "bg-slate-900 text-white font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-white"
                                : isWhatsApp
                                ? "text-emerald-600 group-hover:text-emerald-700"
                                : "text-slate-400 group-hover:text-slate-600",
                            )}
                            strokeWidth={isActive ? 2 : 1.75}
                          />

                          <span className="truncate">{item.label}</span>

                          {/* Dynamic Badge Indicators */}
                          {isWhatsApp && (
                            <span
                              className={cn(
                                "ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                                isActive
                                  ? "bg-emerald-500 text-white"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full animate-pulse",
                                  isActive ? "bg-white" : "bg-emerald-500",
                                )}
                              />
                              {openConvoCount > 0 ? openConvoCount : "Live"}
                            </span>
                          )}

                          {isOrders && pendingOrdersCount > 0 && (
                            <span
                              className={cn(
                                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                isActive
                                  ? "bg-amber-400 text-slate-900"
                                  : "bg-amber-100 text-amber-800",
                              )}
                            >
                              {pendingOrdersCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="border-t border-slate-100 p-3 space-y-1.5">
          <a
            href={`/loja/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center justify-between rounded-lg px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4 text-slate-400" />
              <span>Ver loja pública</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                {user?.email?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.email?.split("@")[0] ?? "Utilizador"}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              title="Terminar sessão"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <main
        className={cn(
          "min-w-0 lg:ml-[260px]",
          isFullBleed
            ? "flex h-screen flex-col overflow-hidden pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0"
            : "min-h-screen pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        {/* SLEEK COMMAND HEADER */}
        <header
          aria-label={`${title} — navegação do painel`}
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 select-none"
        >
          {/* LEFT: BREADCRUMBS & CONTEXT */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="lg:hidden shrink-0">
              <img
                src="/vendora-mark.png"
                alt=""
                className="h-7 w-7 rounded-lg"
              />
            </Link>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-medium text-slate-400">
                Painel
              </span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-slate-300" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                {title}
              </span>
            </nav>
          </div>

          {/* RIGHT: SEARCH, STATUS, NOTIFICATIONS, ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* SEARCH COMMAND PALETTE TRIGGER */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Pesquisar pedidos, produtos e clientes"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 text-left text-xs text-slate-500 shadow-2xs transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:w-[220px] md:w-[280px]"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="hidden flex-1 truncate sm:block">
                Pesquisar (⌘K)...
              </span>
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-400 sm:block">
                ⌘K
              </kbd>
            </button>

            {/* LIVE STORE STATUS PILL */}
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Loja Online
            </span>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Notificações
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Marcar lidas
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Fechar notificações"
                        className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Sem notificações de momento.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markAsRead(n.id, n.link)}
                          className={cn(
                            "w-full cursor-pointer p-3.5 text-left transition hover:bg-slate-50",
                            !n.read && "bg-emerald-50/40",
                          )}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            )}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs text-slate-600">
                            {n.message}
                          </span>
                          <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
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

            {platformAdmin && (
              <Button asChild variant="outline" size="sm" className="h-9 rounded-lg border-slate-200 text-xs font-semibold">
                <Link to="/plataforma">Plataforma</Link>
              </Button>
            )}
          </div>
        </header>

        {/* WORKSPACE PAGE CONTAINER */}
        <div
          className={cn(
            isFullBleed
              ? "flex-1 w-full overflow-hidden p-0 m-0"
              : "admin-workspace mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8",
          )}
        >
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        aria-label="Navegação principal no telemóvel"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-14 max-w-lg grid-cols-6">
          {mobileNav.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    isActive ? "text-emerald-700 font-bold" : "text-slate-500",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-6 w-10 place-items-center rounded-lg transition-colors",
                        isActive && "bg-emerald-50",
                      )}
                    >
                      <Icon
                        className="h-4 w-4"
                        strokeWidth={isActive ? 2.2 : 1.75}
                      />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            type="button"
            ref={moreTriggerRef}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-label="Mais áreas do painel"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              moreActive || moreOpen ? "text-emerald-700 font-bold" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "grid h-6 w-10 place-items-center rounded-lg transition-colors",
                (moreActive || moreOpen) && "bg-emerald-50",
              )}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* MOBILE MORE MODAL */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu de áreas"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <section
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            ref={moreDialogRef}
            aria-labelledby="mobile-more-title"
            onKeyDown={(event) => {
              if (event.key !== "Tab" || !moreDialogRef.current) return;
              const focusable = Array.from(
                moreDialogRef.current.querySelectorAll<HTMLElement>(
                  "a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])",
                ),
              );
              if (focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
            className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Vendora Commerce OS
                </p>
                <h2
                  id="mobile-more-title"
                  className="text-base font-bold text-slate-900"
                >
                  Todas as áreas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Fechar menu de áreas"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(82dvh-80px)] space-y-4 overflow-y-auto px-5 py-4">
              {allowedSections.map((section) => {
                const items = section.items.filter(
                  (item) => !mobilePrimaryRoutes.has(item.to),
                );
                if (items.length === 0) return null;
                return (
                  <section key={section.label}>
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {section.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMoreOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-xs font-semibold transition",
                                isActive
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                              )
                            }
                          >
                            <Icon
                              className="h-4 w-4 shrink-0 text-emerald-600"
                              strokeWidth={1.8}
                            />
                            <span className="min-w-0 truncate">
                              {item.label}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
