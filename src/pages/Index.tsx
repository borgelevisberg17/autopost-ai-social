// src/pages/Landing.tsx

import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Instagram,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const channels = [
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: MessageCircle },
  { name: "WhatsApp", icon: MessageCircle },
  { name: "Loja online", icon: Store },
];

const features = [
  {
    number: "01",
    title: "Produtos no centro da operação",
    description:
      "Mantenha catálogo, preços, promoções e stock organizados num único lugar.",
    icon: Package,
  },
  {
    number: "02",
    title: "Pedidos sem perder o contexto",
    description:
      "Acompanhe cada pedido desde a entrada até à conclusão, independentemente do canal.",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "Uma operação conectada",
    description:
      "Ligue canais de venda, clientes e processos para trabalhar com menos tarefas repetitivas.",
    icon: BarChart3,
  },
];

const benefits = [
  "Catálogo centralizado",
  "Gestão de stock",
  "Pedidos e clientes",
  "Vários canais de venda",
  "Automação operacional",
  "Controlo de acesso",
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#111111]">
      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-5 pt-4 sm:px-8 lg:px-10">
          <nav className="flex h-[68px] items-center justify-between rounded-full border border-black/[0.08] bg-white/90 px-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-md sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-semibold tracking-[-0.04em]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111111] text-sm font-bold text-white">
                V
              </span>
              <span className="text-[19px]">Vendora</span>
            </Link>

            <div className="hidden items-center gap-8 text-[14px] text-[#666666] lg:flex">
              <a href="#produto" className="transition-colors hover:text-black">
                Produto
              </a>
              <a href="#solucoes" className="transition-colors hover:text-black">
                Soluções
              </a>
              <a href="#automacao" className="transition-colors hover:text-black">
                Automação
              </a>
              <a href="#precos" className="transition-colors hover:text-black">
                Preços
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden px-4 py-2.5 text-[14px] font-medium text-[#444444] transition-colors hover:text-black sm:block"
              >
                Entrar
              </Link>

              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Começar agora
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-8 lg:px-10 lg:pb-32 lg:pt-44">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="max-w-[650px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fafafa] px-3.5 py-2 text-[12px] font-medium text-[#555555]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
                  Operação comercial, simplificada
                </div>

                <h1 className="max-w-[680px] text-[clamp(3.2rem,7vw,6.8rem)] font-semibold leading-[0.91] tracking-[-0.075em]">
                  Venda em mais lugares.
                  <span className="block text-[#8a8a8a]">
                    Gerencie tudo em um só.
                  </span>
                </h1>

                <p className="mt-8 max-w-[560px] text-[17px] leading-7 text-[#666666] sm:text-[18px]">
                  Produtos, pedidos, stock e canais de venda reunidos numa
                  única operação. O Vendora ajuda o seu negócio a vender sem
                  espalhar a gestão por várias ferramentas.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="group inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[#111111] px-7 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Começar gratuitamente
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <a
                    href="#produto"
                    className="inline-flex h-13 items-center justify-center rounded-full border border-black/10 px-7 text-[14px] font-semibold text-[#222222] transition-colors hover:bg-[#f6f6f4]"
                  >
                    Explorar o produto
                  </a>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#888888]">
                  <span>Sem configuração complicada</span>
                  <span className="hidden h-1 w-1 rounded-full bg-[#b5b5b5] sm:block" />
                  <span>Comece em poucos minutos</span>
                </div>
              </div>

              {/* PRODUCT COMPOSITION */}
              <div className="relative min-h-[470px] lg:min-h-[590px]">
                <div className="absolute right-0 top-8 w-[94%] overflow-hidden rounded-[26px] border border-black/10 bg-[#f5f5f2] shadow-[0_30px_100px_rgba(0,0,0,0.13)] sm:w-[90%]">
                  <div className="flex h-11 items-center gap-1.5 border-b border-black/[0.07] bg-white px-5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#dddddd]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#dddddd]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#dddddd]" />

                    <div className="mx-auto hidden h-7 w-56 rounded-md bg-[#f7f7f7] sm:block" />
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-[52px_1fr] gap-5">
                      <div className="space-y-4 pt-2">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <div
                            key={item}
                            className={`mx-auto h-8 w-8 rounded-lg ${
                              item === 1 ? "bg-[#111111]" : "bg-white"
                            }`}
                          />
                        ))}
                      </div>

                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <div className="h-3 w-24 rounded bg-[#cfcfca]" />
                            <div className="mt-2 h-2.5 w-36 rounded bg-[#e0e0dc]" />
                          </div>

                          <div className="h-9 w-24 rounded-lg bg-white" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            ["Vendas", "Kz 1.248.500"],
                            ["Pedidos", "84"],
                            ["Stock", "92%"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl border border-black/[0.06] bg-white p-4"
                            >
                              <div className="text-[10px] text-[#999999]">
                                {label}
                              </div>
                              <div className="mt-2 text-sm font-semibold">
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-xl border border-black/[0.06] bg-white p-4">
                          <div className="mb-5 flex items-center justify-between">
                            <div className="text-xs font-semibold">
                              Vendas
                            </div>
                            <div className="text-[10px] text-[#999999]">
                              Últimos 30 dias
                            </div>
                          </div>

                          <div className="flex h-36 items-end gap-2">
                            {[28, 42, 35, 60, 48, 72, 55, 78, 68, 92, 76, 96].map(
                              (height, index) => (
                                <div
                                  key={index}
                                  className="flex-1 rounded-t-md bg-[#171717]"
                                  style={{ height: `${height}%` }}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating order */}
                <div className="absolute bottom-10 left-0 z-10 w-[230px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:w-[255px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-[#999999]">
                        Novo pedido
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        #8F31A2
                      </div>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f1ee]">
                      <Check size={14} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3">
                    <span className="text-[11px] text-[#777777]">
                      Instagram
                    </span>
                    <span className="text-sm font-semibold">
                      Kz 85.000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHANNEL STRIP */}
        <section className="border-y border-black/[0.07] bg-[#fafafa]">
          <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">
                Uma operação. Vários canais.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {channels.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 text-sm font-medium text-[#555555]"
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT */}
        <section id="produto" className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
              <div>
                <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">
                  O seu catálogo
                </div>

                <h2 className="text-[clamp(2.4rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.065em]">
                  Sua loja merece mais do que uma lista de produtos.
                </h2>
              </div>

              <p className="max-w-[530px] text-[17px] leading-7 text-[#666666] lg:ml-auto">
                Apresente os seus produtos com uma experiência de compra
                simples, rápida e alinhada à identidade do seu negócio.
              </p>
            </div>

            <div className="mt-16 overflow-hidden rounded-[28px] border border-black/10 bg-[#f5f5f2] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.08)] sm:p-5">
              <div className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-white">
                <div className="flex h-14 items-center justify-between border-b border-black/[0.06] px-5 sm:px-7">
                  <div className="font-semibold tracking-[-0.03em]">
                    Vendora Store
                  </div>

                  <div className="hidden items-center gap-5 text-xs text-[#777777] sm:flex">
                    <span>Produtos</span>
                    <span>Categorias</span>
                    <span>Sobre</span>
                  </div>
                </div>

                <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
                  {[
                    ["Smartphone Pro", "Kz 485.000"],
                    ["Headphones", "Kz 75.000"],
                    ["Smart Watch", "Kz 120.000"],
                  ].map(([name, price], index) => (
                    <div key={name} className="group">
                      <div className="relative aspect-[1.05] overflow-hidden rounded-2xl bg-[#f3f3f0]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className={`h-32 w-24 rounded-[22px] border-[5px] border-[#202020] ${
                              index === 1
                                ? "rotate-[-8deg]"
                                : index === 2
                                  ? "rotate-[7deg]"
                                  : ""
                            }`}
                          >
                            <div className="mx-auto mt-3 h-2 w-2 rounded-full bg-[#202020]" />
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold shadow-sm">
                          Em stock
                        </div>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold">{name}</h3>
                          <p className="mt-1 text-xs text-[#888888]">
                            Disponível para compra
                          </p>
                        </div>

                        <span className="text-sm font-semibold">
                          {price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OPERATION */}
        <section
          id="solucoes"
          className="bg-[#f5f5f2] px-5 py-28 sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-[780px]">
              <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">
                Operação
              </div>

              <h2 className="text-[clamp(2.5rem,5.5vw,5.4rem)] font-semibold leading-[0.93] tracking-[-0.07em]">
                Do pedido ao pagamento,
                <span className="text-[#969690]"> sem perder o contexto.</span>
              </h2>
            </div>

            <div className="mt-20 grid gap-5 md:grid-cols-3">
              {features.map(({ number, title, description, icon: Icon }) => (
                <article
                  key={number}
                  className="group min-h-[330px] rounded-[24px] border border-black/[0.08] bg-white p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.14em] text-[#999999]">
                      {number}
                    </span>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f0] transition-colors group-hover:bg-[#111111] group-hover:text-white">
                      <Icon size={17} strokeWidth={1.7} />
                    </div>
                  </div>

                  <div className="mt-20">
                    <h3 className="max-w-[280px] text-xl font-semibold tracking-[-0.04em]">
                      {title}
                    </h3>

                    <p className="mt-4 max-w-[300px] text-sm leading-6 text-[#777777]">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AUTOMATION */}
        <section
          id="automacao"
          className="overflow-hidden bg-[#111111] px-5 py-28 text-white sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
              <div>
                <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  <Zap size={13} />
                  Automação
                </div>

                <h2 className="text-[clamp(2.6rem,5.5vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                  Automatize o trabalho que não precisa de você.
                </h2>

                <p className="mt-8 max-w-[520px] text-[17px] leading-7 text-white/55">
                  O Vendora pode ajudar a preparar conteúdos, acompanhar
                  produtos e executar tarefas operacionais enquanto você
                  mantém o controlo da sua operação.
                </p>

                <Link
                  to="/signup"
                  className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  Começar agora
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="relative">
                <div className="rounded-[28px] border border-white/10 bg-[#1b1b1b] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-6">
                  <div className="rounded-[20px] border border-white/[0.07] bg-[#111111]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold">
                          Marketing Agent
                        </div>
                        <div className="mt-1 text-[11px] text-white/35">
                          Automação de conteúdo
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Ativo
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                          Produto
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          Smartphone Pro
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {["Instagram", "Facebook", "WhatsApp"].map(
                          (platform) => (
                            <div
                              key={platform}
                              className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                            >
                              <div className="text-[10px] text-white/35">
                                {platform}
                              </div>
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium">
                                <Check size={12} />
                                Preparado
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Sparkles size={13} />
                          Conteúdo preparado
                        </div>
                        <div className="mt-3 h-2 w-[88%] rounded bg-white/10" />
                        <div className="mt-2 h-2 w-[65%] rounded bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-7 -left-5 hidden rounded-2xl border border-white/10 bg-[#1b1b1b] p-4 shadow-2xl sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111111]">
                      <Check size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">
                        Ação preparada
                      </div>
                      <div className="mt-1 text-[10px] text-white/35">
                        Aguardando revisão
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">
                  Uma operação conectada
                </div>

                <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.07em]">
                  Menos ferramentas.
                  <span className="block text-[#969696]">
                    Mais controlo.
                  </span>
                </h2>
              </div>

              <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={`flex items-center gap-4 border-b border-black/[0.08] py-5 ${
                      index === 0 ? "border-t sm:border-t" : ""
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f1ee]">
                      <Check size={13} />
                    </div>
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="precos"
          className="border-y border-black/[0.07] bg-[#fafafa] px-5 py-28 sm:px-8 lg:px-10 lg:py-32"
        >
          <div className="mx-auto max-w-[1000px] text-center">
            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#999999]">
              Comece simples
            </div>

            <h2 className="text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.07em]">
              Sua operação pode começar hoje.
            </h2>

            <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-7 text-[#777777]">
              Crie a sua conta, organize os seus produtos e comece a construir
              uma operação comercial mais simples.
            </p>

            <Link
              to="/signup"
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#111111] px-7 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Criar conta gratuitamente
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-white px-5 py-28 sm:px-8 lg:px-10 lg:py-40">
          <div className="mx-auto max-w-[1400px]">
            <div className="relative overflow-hidden rounded-[32px] bg-[#111111] px-7 py-16 text-white sm:px-12 lg:px-20 lg:py-24">
              <div className="relative z-10 max-w-[760px]">
                <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Vendora
                </div>

                <h2 className="text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.075em]">
                  Venda.
                  <br />
                  Gerencie.
                  <br />
                  Cresça.
                </h2>

                <p className="mt-8 max-w-[500px] text-[17px] leading-7 text-white/55">
                  Tudo o que a sua operação precisa para vender em vários
                  lugares sem perder o controlo.
                </p>

                <Link
                  to="/signup"
                  className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#111111]"
                >
                  Começar gratuitamente
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
              <div className="absolute -right-8 -top-8 h-[300px] w-[300px] rounded-full border border-white/[0.06]" />
              <div className="absolute bottom-[-120px] right-[18%] h-[260px] w-[260px] rounded-full border border-white/[0.05]" />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black/[0.07] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Link
                to="/"
                className="flex items-center gap-2.5 font-semibold tracking-[-0.04em]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111111] text-sm font-bold text-white">
                  V
                </span>
                Vendora
              </Link>

              <p className="mt-5 max-w-[300px] text-sm leading-6 text-[#777777]">
                Uma operação comercial para vender, gerir e automatizar num
                único lugar.
              </p>
            </div>

            <FooterColumn
              title="Produto"
              links={[
                ["Produto", "#produto"],
                ["Soluções", "#solucoes"],
                ["Automação", "#automacao"],
                ["Preços", "#precos"],
              ]}
            />

            <FooterColumn
              title="Conta"
              links={[
                ["Entrar", "/login"],
                ["Criar conta", "/signup"],
              ]}
            />

            <FooterColumn
              title="Legal"
              links={[
                ["Privacidade", "#"],
                ["Termos", "#"],
                ["Segurança", "#"],
              ]}
            />
          </div>

          <div className="mt-16 flex flex-col gap-3 border-t border-black/[0.07] pt-6 text-xs text-[#999999] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Vendora</span>
            <span>Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#444444]">
        {title}
      </h3>

      <div className="mt-5 flex flex-col gap-3">
        {links.map(([label, href]) => {
          const external = href.startsWith("#");

          if (external) {
            return (
              <a
                key={label}
                href={href}
                className="w-fit text-sm text-[#777777] transition-colors hover:text-black"
              >
                {label}
              </a>
            );
          }

          return (
            <Link
              key={label}
              to={href}
              className="w-fit text-sm text-[#777777] transition-colors hover:text-black"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
