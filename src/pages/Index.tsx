import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Facebook,
  Globe2,
  Instagram,
  MessageCircle,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const channels = [
  {
    name: "Website",
    description: "Sua loja pública",
    icon: Globe2,
    className: "bg-slate-100 text-slate-700",
  },
  {
    name: "Instagram",
    description: "Marketing e descoberta",
    icon: Instagram,
    className: "bg-pink-50 text-pink-600",
  },
  {
    name: "Facebook",
    description: "Alcance e vendas",
    icon: Facebook,
    className: "bg-blue-50 text-blue-600",
  },
  {
    name: "WhatsApp",
    description: "Conversas e pedidos",
    icon: MessageCircle,
    className: "bg-emerald-50 text-emerald-600",
  },
];

const securityItems = [
  {
    icon: ShieldCheck,
    title: "Autenticação segura",
    text: "Acesso protegido para sua equipa e sua operação.",
  },
  {
    icon: Users,
    title: "Acesso por função",
    text: "Cada pessoa vê e executa apenas o que precisa.",
  },
  {
    icon: RefreshCw,
    title: "Histórico de ações",
    text: "As operações importantes ficam rastreáveis.",
  },
  {
    icon: Zap,
    title: "Integrações protegidas",
    text: "Conexões externas tratadas como parte da infraestrutura.",
  },
];

const scaleSteps = [
  { value: "01", title: "Seu negócio", text: "Uma operação central" },
  { value: "02", title: "Sua loja", text: "Catálogo e pedidos" },
  { value: "03", title: "Seus canais", text: "Website, redes e WhatsApp" },
  { value: "04", title: "Sua equipa", text: "Pessoas e agentes" },
  { value: "05", title: "Sua operação", text: "Mais clientes, menos trabalho manual" },
];

function SectionLabel({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
        dark
          ? "border-white/15 bg-white/5 text-blue-200"
          : "border-blue-100 bg-blue-50 text-blue-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dark ? "bg-blue-300" : "bg-blue-600"
        }`}
      />
      {children}
    </div>
  );
}

function ProductMiniCard({
  name,
  price,
  stock,
  imageClass,
}: {
  name: string;
  price: string;
  stock: string;
  imageClass: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className={`relative h-36 ${imageClass}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-[28px] bg-white/70 shadow-sm backdrop-blur-sm" />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 text-sm font-semibold text-slate-950">{name}</div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-900">{price}</span>
          <span className="text-[11px] font-medium text-emerald-600">
            {stock}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

export default function Index() {
  const { user } = useAuth();

  const startPath = user ? "/dashboard" : "/signup";
  const signInPath = "/login";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#111827]">
      {/* NAVIGATION */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#155EEF] shadow-[0_6px_18px_rgba(21,94,239,0.22)]">
              <ShoppingBag className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-[19px] font-bold tracking-[-0.04em] text-slate-950">
              Vendora
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#platform"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Platform
            </a>
            <a
              href="#solutions"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Solutions
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Resources
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={signInPath}
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block"
            >
              Sign in
            </Link>
            <Link
              to={startPath}
              className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(21,94,239,0.18)] transition hover:bg-[#0F4FCC]"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-[72px]">
          <div className="absolute left-[-240px] top-[-220px] h-[560px] w-[560px] rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute bottom-[-300px] right-[-180px] h-[600px] w-[600px] rounded-full bg-cyan-100/30 blur-3xl" />

          <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-20 lg:px-8 lg:pb-24 lg:pt-28">
            <div className="mx-auto max-w-4xl text-center">
              <SectionLabel>Commerce infrastructure</SectionLabel>

              <h1 className="text-[48px] font-bold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-[64px] lg:text-[82px]">
                Your business,
                <br />
                <span className="text-[#155EEF]">always selling.</span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                One intelligent platform for your website, Instagram,
                Facebook and WhatsApp. Manage products, orders, customers and
                automation from one place.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to={startPath}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(21,94,239,0.2)] transition hover:bg-[#0F4FCC]"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#platform"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  See how it works
                </a>
              </div>
            </div>

            {/* HERO PRODUCT */}
            <div className="relative mx-auto mt-16 max-w-[1120px]">
              <div className="absolute -inset-5 rounded-[34px] bg-blue-100/50 blur-2xl" />

              <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.13)]">
                {/* Window top */}
                <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4 sm:px-5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  </div>

                  <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] text-slate-400 sm:flex">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live workspace
                  </div>

                  <div className="h-6 w-20 rounded-md bg-slate-50" />
                </div>

                <div className="flex min-h-[510px]">
                  {/* Sidebar */}
                  <aside className="hidden w-[190px] shrink-0 border-r border-slate-200 bg-[#FBFCFD] p-4 md:block">
                    <div className="mb-7 flex items-center gap-2 px-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#155EEF]">
                        <ShoppingBag className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Vendora
                      </span>
                    </div>

                    <div className="space-y-1">
                      {[
                        ["Overview", BarChart3, true],
                        ["Orders", Package, false],
                        ["Products", ShoppingBag, false],
                        ["Customers", Users, false],
                        ["Agents", Bot, false],
                      ].map(([label, Icon, active]) => {
                        const ItemIcon = Icon as React.ElementType;

                        return (
                          <div
                            key={String(label)}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                              active
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-500"
                            }`}
                          >
                            <ItemIcon className="h-3.5 w-3.5" />
                            {String(label)}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-4">
                      <div className="px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        Channels
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-slate-500">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                          Website
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-slate-500">
                          <div className="h-2 w-2 rounded-full bg-pink-500" />
                          Instagram
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-slate-500">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          WhatsApp
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Dashboard */}
                  <div className="min-w-0 flex-1 bg-[#F8FAFC] p-4 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          Overview
                        </div>
                        <div className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                          Your business
                        </div>
                      </div>

                      <div className="hidden items-center gap-2 sm:flex">
                        <div className="h-8 w-24 rounded-lg border border-slate-200 bg-white" />
                        <div className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white">
                          <Bell className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <StatCard
                        icon={CircleDollarSign}
                        label="Revenue"
                        value="—"
                        detail="Connected data"
                      />
                      <StatCard
                        icon={Package}
                        label="Orders"
                        value="—"
                        detail="All channels"
                      />
                      <StatCard
                        icon={ShoppingBag}
                        label="Products"
                        value="—"
                        detail="Your catalog"
                      />
                      <StatCard
                        icon={Bot}
                        label="AI agents"
                        value="Ready"
                        detail="Automation enabled"
                      />
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_0.8fr]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              Sales activity
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">
                              Revenue across connected channels
                            </div>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[9px] font-medium text-slate-500">
                            Last 30 days
                          </div>
                        </div>

                        <div className="relative h-[165px] overflow-hidden rounded-xl bg-slate-50/80">
                          <div className="absolute inset-x-4 bottom-5 top-5">
                            <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
                            <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-slate-200" />
                            <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-slate-200" />

                            <svg
                              viewBox="0 0 600 130"
                              preserveAspectRatio="none"
                              className="absolute inset-0 h-full w-full"
                            >
                              <path
                                d="M0 110 C50 104, 62 90, 110 96 C155 102, 172 58, 215 68 C260 79, 270 72, 315 74 C355 76, 370 32, 405 44 C445 58, 472 30, 505 36 C540 42, 555 18, 600 20"
                                fill="none"
                                stroke="#155EEF"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              Recent activity
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">
                              Your operation in motion
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex gap-2.5">
                            <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                              <Bot className="h-3 w-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold text-slate-800">
                                Marketing Agent
                              </div>
                              <div className="mt-0.5 text-[9px] text-slate-400">
                                Creating publication...
                              </div>
                            </div>
                            <span className="ml-auto text-[8px] text-slate-400">
                              now
                            </span>
                          </div>

                          <div className="flex gap-2.5">
                            <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                              <Package className="h-3 w-3" />
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-800">
                                New order
                              </div>
                              <div className="mt-0.5 text-[9px] text-slate-400">
                                WhatsApp
                              </div>
                            </div>
                            <span className="ml-auto text-[8px] text-slate-400">
                              2m
                            </span>
                          </div>

                          <div className="flex gap-2.5">
                            <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                              <ShoppingBag className="h-3 w-3" />
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-800">
                                Product updated
                              </div>
                              <div className="mt-0.5 text-[9px] text-slate-400">
                                Catalog synchronized
                              </div>
                            </div>
                            <span className="ml-auto text-[8px] text-slate-400">
                              8m
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* floating notification */}
                    <div className="absolute bottom-[-18px] right-5 hidden w-[220px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)] sm:block">
                      <div className="flex gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-900">
                            New order
                          </div>
                          <div className="mt-0.5 text-[9px] text-slate-500">
                            Order received through WhatsApp
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
              Built around your actual products, orders and business data.
            </div>
          </div>
        </section>

        {/* CHANNELS */}
        <section id="platform" className="border-b border-slate-200 bg-[#F7F8FA]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <SectionLabel>One platform</SectionLabel>
              <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                One business.
                <br />
                Every channel. One system.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-500">
                Your customers can discover, ask, buy and return through
                different channels. Your operation should not have to.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_280px_1fr] lg:items-center">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {channels.map((channel) => {
                  const Icon = channel.icon;

                  return (
                    <div
                      key={channel.name}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.025)]"
                    >
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${channel.className}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {channel.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {channel.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative hidden h-[220px] lg:block">
                <div className="absolute left-0 top-1/2 h-px w-1/2 bg-slate-300" />
                <div className="absolute right-0 top-1/2 h-px w-1/2 bg-slate-300" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />

                <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] border border-blue-200 bg-white shadow-[0_16px_45px_rgba(21,94,239,0.12)]">
                  <div className="text-center">
                    <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-[#155EEF]">
                      <ShoppingBag className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Vendora
                    </div>
                    <div className="mt-0.5 text-[9px] text-slate-400">
                      One system
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-semibold text-blue-300">
                  ONE PLATFORM
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["Products", ShoppingBag],
                    ["Orders", Package],
                    ["Customers", Users],
                  ].map(([label, Icon]) => {
                    const ItemIcon = Icon as React.ElementType;

                    return (
                      <div
                        key={String(label)}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <ItemIcon className="h-4 w-4 text-blue-300" />
                        <span className="text-sm font-medium">
                          {String(label)}
                        </span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/30" />
                      </div>
                    );
                  })}
                </div>

                <p className="mt-6 text-xs leading-5 text-slate-400">
                  One source of truth for the entire customer journey.
                </p>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm font-medium text-slate-500">
              <div className="h-px w-10 bg-slate-300" />
              Stop managing channels separately.
            </div>
          </div>
        </section>

        {/* CATALOG */}
        <section id="solutions" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <SectionLabel>Catalog</SectionLabel>

                <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Your catalog is the
                  <br />
                  <span className="text-[#155EEF]">source of truth.</span>
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
                  Products, prices, stock and promotions live in one place.
                  Update them once and keep your customer-facing operation
                  aligned.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Centralized products",
                    "Real stock states",
                    "Prices and promotions",
                    "Public storefront",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#155EEF]">
                  Change it once. Sell it everywhere.
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Store UI */}
              <div className="rounded-[28px] border border-slate-200 bg-[#F7F8FA] p-3 shadow-[0_30px_80px_rgba(15,23,42,0.09)] sm:p-5">
                <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                  <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#155EEF]">
                        <ShoppingBag className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Your Store
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100">
                        <UserRound className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-6 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">
                          Collection
                        </div>
                        <div className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                          Featured products
                        </div>
                      </div>
                      <div className="hidden text-xs text-slate-400 sm:block">
                        12 products
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <ProductMiniCard
                        name="Essential Set"
                        price="35.000 Kz"
                        stock="In stock"
                        imageClass="bg-[#E9EFF8]"
                      />
                      <ProductMiniCard
                        name="Daily Backpack"
                        price="48.000 Kz"
                        stock="In stock"
                        imageClass="bg-[#F0ECE7]"
                      />
                      <ProductMiniCard
                        name="Classic Sneaker"
                        price="62.000 Kz"
                        stock="Low stock"
                        imageClass="bg-[#E7F1EC]"
                      />
                      <ProductMiniCard
                        name="Everyday Watch"
                        price="75.000 Kz"
                        stock="In stock"
                        imageClass="bg-[#F1EBF2]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI WORKFORCE */}
        <section className="relative overflow-hidden bg-[#0B2B5A] text-white">
          <div className="absolute right-[-180px] top-[-180px] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <SectionLabel dark>AI workforce</SectionLabel>

                <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
                  Your AI team
                  <br />
                  never clocks out.
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-blue-100/65">
                  Automation should work inside your business, not sit beside
                  it. Agents use your products, rules and operational context
                  to execute repetitive work.
                </p>

                <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-blue-200">
                  Marketing. Sales. Analytics.
                  <ArrowRight className="h-4 w-4" />
                </div>

                <div className="mt-2 text-sm text-white/50">
                  Different responsibilities. One business brain.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Agent card */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/20 text-blue-200">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          Marketing Agent
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/40">
                          Content & campaigns
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-medium text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-3.5 w-3.5 text-pink-300" />
                      <span className="text-[10px] font-medium text-white/70">
                        Instagram
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[78%] rounded-full bg-blue-400" />
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-white/40">
                      <span>Creating publication</span>
                      <span>78%</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[10px] text-white/50">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Checks product data before acting
                  </div>
                </div>

                {/* Sales card */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:translate-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-200">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          Sales workflow
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/40">
                          Conversations & orders
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-white/40">
                      Connected
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="flex gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/20">
                        <UserRound className="h-3 w-3 text-emerald-300" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-white/10 px-3 py-2 text-[10px] leading-4 text-white/70">
                        Do you have size 42?
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/20">
                        <Bot className="h-3 w-3 text-blue-300" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-blue-500/20 px-3 py-2 text-[10px] leading-4 text-blue-100">
                        Yes. 3 units available.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[10px] text-white/50">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Answers from real product data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEARNING LOOP */}
        <section className="border-b border-slate-200 bg-[#F7F8FA]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>Continuous intelligence</SectionLabel>

              <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Your marketing gets smarter
                <br />
                with every interaction.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-500">
                Your operation creates information. That information can become
                better decisions, better campaigns and better conversations.
              </p>
            </div>

            <div className="relative mt-14">
              <div className="absolute left-[10%] right-[10%] top-10 hidden h-px bg-slate-300 lg:block" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["01", "Interactions", "Customers browse, ask and buy", MessageCircle],
                  ["02", "Analytics", "Patterns become visible", BarChart3],
                  ["03", "Patterns", "What works gets identified", Sparkles],
                  ["04", "Marketing", "Content adapts to context", Bot],
                  ["05", "More data", "The operation keeps learning", RefreshCw],
                ].map(([number, title, text, Icon]) => {
                  const StepIcon = Icon as React.ElementType;

                  return (
                    <div key={String(number)} className="relative">
                      <div className="relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
                        <StepIcon className="h-5 w-5 text-[#155EEF]" />
                      </div>

                      <div className="mt-5 text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">
                          {String(number)}
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {String(title)}
                        </div>
                        <p className="mx-auto mt-1 max-w-[160px] text-xs leading-5 text-slate-500">
                          {String(text)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* WHATSAPP */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="order-2 lg:order-1">
                <div className="mx-auto max-w-[480px] overflow-hidden rounded-[28px] border border-slate-200 bg-[#F4F7F8] shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                  <div className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Your business
                      </div>
                      <div className="text-[9px] text-emerald-500">
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-[#DFF7E9] px-4 py-3 text-xs leading-5 text-slate-700">
                        Olá. Vocês têm este modelo no tamanho 42?
                      </div>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-xs leading-5 text-slate-700 shadow-sm">
                        Sim. Temos o tamanho 42 disponível.
                        <div className="mt-2 border-t border-slate-100 pt-2 text-[10px] font-medium text-emerald-600">
                          3 unidades disponíveis
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            Classic Sneaker
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Size 42 · In stock
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-900">
                            62.000 Kz
                          </div>
                        </div>
                      </div>

                      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] py-2.5 text-xs font-semibold text-white">
                        Reserve product
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <SectionLabel>WhatsApp commerce</SectionLabel>

                <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Turn conversations
                  <br />
                  into sales.
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
                  Customers do not always want to open a store. Sometimes they
                  just want an answer. Connect conversations to the same
                  product and stock data that powers your operation.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Customer asks about a product",
                    "The system checks real inventory",
                    "The customer gets a contextual answer",
                    "The order can continue from the conversation",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="pt-1 text-sm font-medium text-slate-700">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-9 border-l-2 border-blue-500 pl-4 text-sm font-semibold text-slate-900">
                  Real answers. Real products. Real stock.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYTICS */}
        <section className="border-b border-slate-200 bg-[#F7F8FA]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <SectionLabel>Analytics</SectionLabel>

                <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Know what your
                  <br />
                  customers want.
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
                  Bring your sales and channel activity into one operational
                  view so your next decision starts with information instead
                  of guesswork.
                </p>

                <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#155EEF]">
                  See the whole business
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_25px_70px_rgba(15,23,42,0.07)] sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Business analytics
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      Connected commerce activity
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] text-slate-500">
                    This period
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Sales", "—"],
                    ["Engagement", "—"],
                    ["Top product", "—"],
                    ["Best channel", "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <div className="text-[9px] uppercase tracking-wide text-slate-400">
                        {label}
                      </div>
                      <div className="mt-2 text-sm font-bold text-slate-900">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_0.6fr]">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-800">
                        Sales overview
                      </div>
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="flex h-[150px] items-end gap-2">
                      {[35, 52, 42, 65, 48, 78, 60, 88, 70, 96, 75, 86].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex h-full flex-1 items-end"
                          >
                            <div
                              className={`w-full rounded-t-md ${
                                index === 9
                                  ? "bg-[#155EEF]"
                                  : "bg-blue-100"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-semibold text-slate-800">
                      Top products
                    </div>

                    <div className="mt-5 space-y-4">
                      {[
                        ["01", "Product A"],
                        ["02", "Product B"],
                        ["03", "Product C"],
                        ["04", "Product D"],
                      ].map(([number, name]) => (
                        <div
                          key={number}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[9px] text-slate-400">
                            {number}
                          </span>
                          <span className="truncate text-[10px] font-medium text-slate-700">
                            {name}
                          </span>
                          <div className="ml-auto h-1.5 w-8 rounded-full bg-blue-100">
                            <div className="h-full w-2/3 rounded-full bg-blue-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>Security</SectionLabel>

              <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Built for businesses
                <br />
                that take trust seriously.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-500">
                Your commerce system contains customers, products, financial
                information and operational decisions. Security belongs in the
                foundation.
              </p>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {securityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-slate-200 bg-[#F8FAFC] p-5"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <h3 className="mt-5 text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SCALE */}
        <section className="overflow-hidden bg-[#F7F8FA]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <SectionLabel>Built to grow</SectionLabel>

                <h2 className="text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Start small.
                  <br />
                  Build bigger.
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-slate-500">
                  Your business does not need to become complicated just
                  because it becomes successful. Keep the operation connected
                  as you add products, channels, people and volume.
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-7 right-7 top-7 hidden h-px bg-slate-300 lg:block" />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {scaleSteps.map((step) => (
                    <div
                      key={step.value}
                      className="relative rounded-[20px] border border-slate-200 bg-white p-4"
                    >
                      <div className="relative z-10 grid h-7 w-7 place-items-center rounded-full bg-[#155EEF] text-[9px] font-bold text-white">
                        {step.value}
                      </div>

                      <div className="mt-5 text-sm font-bold text-slate-900">
                        {step.title}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {step.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          className="border-t border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>Plans</SectionLabel>

              <h2 className="text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl">
                A platform that grows
                <br />
                with your operation.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-500">
                Start with what you need and expand as your business requires
                more automation and operational capacity.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-[860px] rounded-[28px] border border-slate-200 bg-[#F7F8FA] p-5 text-center sm:p-8">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <WalletCards className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Flexible plans
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Choose a plan based on your catalog, team and automation needs.
                Pricing can be configured when your commercial plans are
                finalized.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Catalog", "Orders", "Channels", "AI automation"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden bg-[#155EEF]">
          <div className="absolute left-[-180px] top-[-220px] h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-260px] right-[-180px] h-[520px] w-[520px] rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1000px] px-5 py-24 text-center lg:px-8 lg:py-32">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
              <ArrowRight className="h-5 w-5" />
            </div>

            <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.05em] text-white sm:text-6xl">
              Your next customer could already be talking to you.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100">
              Make sure your business is ready to answer, sell and keep the
              operation connected.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={startPath}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#155EEF] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-blue-50"
              >
                Start building your business
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#platform"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore the platform
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#155EEF]">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold tracking-[-0.03em] text-slate-950">
                  Vendora
                </span>
              </Link>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Commerce infrastructure for businesses that sell everywhere.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Platform
                </div>
                <div className="mt-4 space-y-3 text-xs text-slate-500">
                  <a href="#platform" className="block hover:text-slate-900">
                    Overview
                  </a>
                  <a href="#solutions" className="block hover:text-slate-900">
                    Catalog
                  </a>
                  <a href="#security" className="block hover:text-slate-900">
                    Security
                  </a>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Company
                </div>
                <div className="mt-4 space-y-3 text-xs text-slate-500">
                  <a href="#platform" className="block hover:text-slate-900">
                    Solutions
                  </a>
                  <a href="#pricing" className="block hover:text-slate-900">
                    Pricing
                  </a>
                  <Link to={signInPath} className="block hover:text-slate-900">
                    Sign in
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Get started
                </div>
                <div className="mt-4 space-y-3 text-xs text-slate-500">
                  <Link to={startPath} className="block hover:text-slate-900">
                    Create account
                  </Link>
                  <a href="#platform" className="block hover:text-slate-900">
                    See platform
                  </a>
                  <a href="#security" className="block hover:text-slate-900">
                    Security
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} Vendora. All rights reserved.
            </span>
            <span>Commerce, connected.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
