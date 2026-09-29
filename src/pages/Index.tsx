import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Facebook,
  Instagram,
  MessageCircle,
  Package,
  Play,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const channels = [
  {
    name: "Instagram",
    icon: Instagram,
    tone: "bg-[#fce7f3] text-[#be185d]",
  },
  {
    name: "Facebook",
    icon: Facebook,
    tone: "bg-[#e8f0ff] text-[#1877f2]",
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    tone: "bg-[#e5f8ed] text-[#16803c]",
  },
  {
    name: "Loja online",
    icon: Store,
    tone: "bg-[#fff0e8] text-[#e85d2a]",
  },
];

const workflow = [
  {
    number: "01",
    title: "Catálogo",
    text: "Produtos, preços, promoções e stock num único lugar.",
    icon: Package,
  },
  {
    number: "02",
    title: "Venda",
    text: "Receba pedidos vindos da loja e dos seus canais.",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "Operação",
    text: "Acompanhe pedidos, clientes, stock e processos.",
    icon: BarChart3,
  },
];

const automationItems = [
  "Consulta produtos antes de agir",
  "Respeita preço e stock disponíveis",
  "Prepara conteúdos para cada canal",
  "Mantém cada ação registada",
];

export default function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfbf8] text-[#171717]">
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="flex h-[68px] items-center justify-between rounded-[22px] border border-[#171717]/[0.08] bg-[#fcfbf8]/95 px-4 shadow-[0_8px_35px_rgba(20,20,20,0.06)] backdrop-blur-xl sm:px-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#f26b38] text-sm font-black text-white shadow-[0_6px_18px_rgba(242,107,56,0.24)]">
                V
              </span>

              <span className="text-[19px] font-bold tracking-[-0.045em]">
                Vendora
              </span>
            </Link>

            <div className="hidden items-center gap-8 text-[13px] font-medium text-[#696969] lg:flex">
              <a
                href="#produto"
                className="transition-colors hover:text-[#171717]"
              >
                Produto
              </a>
              <a
                href="#operacao"
                className="transition-colors hover:text-[#171717]"
              >
                Operação
              </a>
              <a
                href="#automacao"
                className="transition-colors hover:text-[#171717]"
              >
                Automação
              </a>
              <a
                href="#comece"
                className="transition-colors hover:text-[#171717]"
              >
                Começar
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#555] transition hover:bg-black/[0.04] hover:text-[#171717] sm:block"
              >
                Entrar
              </Link>

              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#f26b38]"
              >
                Começar
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden px-5 pb-20 pt-36 sm:px-8 lg:px-10 lg:pb-28 lg:pt-44">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#ffd9c8] opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-[35%] h-[420px] w-[420px] rounded-full bg-[#e7f4ed] opacity-70 blur-3xl" />

          <div className="relative mx-auto max-w-[1440px]">
            <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div className="max-w-[650px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f26b38]/20 bg-[#fff0e8] px-3.5 py-2 text-[12px] font-semibold text-[#c94f20]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f26b38]" />
                  Comércio conectado
                </div>

                <h1 className="text-[clamp(3.2rem,6.8vw,6.7rem)] font-semibold leading-[0.91] tracking-[-0.078em]">
                  O lugar onde
                  <span className="block text-[#f26b38]">
                    o seu negócio vende.
                  </span>
                </h1>

                <p className="mt-8 max-w-[570px] text-[17px] leading-7 text-[#666] sm:text-[18px]">
                  Loja online, catálogo, pedidos, stock e canais sociais
                  conectados numa única operação. O Vendora transforma vários
                  pontos de venda numa experiência contínua.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-[#f26b38] px-7 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(242,107,56,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e85d2a]"
                  >
                    Criar a minha loja
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <a
                    href="#produto"
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-[#171717]/10 bg-white px-7 text-[14px] font-semibold text-[#252525] transition hover:border-[#171717]/20 hover:bg-[#f6f4ef]"
                  >
                    <Play size={14} fill="currentColor" />
                    Ver como funciona
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#8a8a8a]">
                  <span className="flex items-center gap-1.5">
                    <Check size={13} className="text-[#2d8a55]" />
                    Loja própria
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Check size={13} className="text-[#2d8a55]" />
                    Stock centralizado
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Check size={13} className="text-[#2d8a55]" />
                    Vários canais
                  </span>
                </div>
              </div>

              {/* HERO PRODUCT UI */}
              <div className="relative min-h-[500px] lg:min-h-[620px]">
                <div className="absolute right-0 top-0 w-full max-w-[700px] lg:w-[94%]">
                  <div className="overflow-hidden rounded-[28px] border border-[#171717]/10 bg-white shadow-[0_35px_100px_rgba(30,30,30,0.13)]">
                    {/* browser */}
                    <div className="flex h-12 items-center gap-1.5 border-b border-black/[0.06] px-5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#dedbd5]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#dedbd5]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#dedbd5]" />

                      <div className="mx-auto hidden h-7 w-64 rounded-lg bg-[#f6f5f2] sm:block" />
                    </div>

                    <div className="grid min-h-[440px] grid-cols-[72px_1fr]">
                      {/* sidebar */}
                      <aside className="border-r border-black/[0.06] bg-[#faf9f6] p-3">
                        <div className="mx-auto mb-7 grid h-9 w-9 place-items-center rounded-xl bg-[#f26b38] text-xs font-bold text-white">
                          V
                        </div>

                        <div className="space-y-3">
                          {[
                            Store,
                            Package,
                            ShoppingBag,
                            BarChart3,
                          ].map((Icon, index) => (
                            <div
                              key={index}
                              className={`mx-auto grid h-9 w-9 place-items-center rounded-xl ${
                                index === 0
                                  ? "bg-[#171717] text-white"
                                  : "text-[#a2a09b]"
                              }`}
                            >
                              <Icon size={16} />
                            </div>
                          ))}
                        </div>
                      </aside>

                      <div className="bg-[#f7f6f2] p-5 sm:p-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999]">
                              Visão geral
                            </p>
                            <h3 className="mt-1 text-xl font-bold tracking-[-0.04em]">
                              A sua operação
                            </h3>
                          </div>

                          <div className="hidden rounded-xl border border-black/[0.07] bg-white px-3 py-2 text-[10px] font-medium text-[#777] sm:block">
                            Últimos 30 dias
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <Metric
                            label="Pedidos"
                            value="—"
                            accent="orange"
                          />
                          <Metric
                            label="Vendas"
                            value="—"
                            accent="green"
                          />
                          <Metric
                            label="Produtos"
                            value="—"
                            accent="purple"
                            className="hidden sm:block"
                          />
                        </div>

                        <div className="mt-3 rounded-2xl border border-black/[0.06] bg-white p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-semibold">
                                Atividade de vendas
                              </p>
                              <p className="mt-1 text-[10px] text-[#999]">
                                Acompanhe a evolução da sua operação
                              </p>
                            </div>

                            <div className="h-8 w-8 rounded-lg bg-[#fff0e8]" />
                          </div>

                          <div className="mt-8 flex h-28 items-end gap-2">
                            {[35, 48, 42, 65, 52, 78, 63, 87, 72, 94, 76, 100].map(
                              (height, index) => (
                                <div
                                  key={index}
                                  className={`flex-1 rounded-t-[5px] ${
                                    index === 11
                                      ? "bg-[#f26b38]"
                                      : "bg-[#f0ddd4]"
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                              ),
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold">
                                Produtos
                              </span>
                              <span className="h-2 w-2 rounded-full bg-[#54a879]" />
                            </div>

                            <div className="mt-4 space-y-2">
                              <MiniProduct name="Produto A" />
                              <MiniProduct name="Produto B" />
                              <MiniProduct name="Produto C" />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold">
                                Pedidos recentes
                              </span>
                              <ChevronRight size={13} />
                            </div>

                            <div className="mt-4 space-y-3">
                              <MiniOrder channel="Instagram" />
                              <MiniOrder channel="Loja online" />
                              <MiniOrder channel="WhatsApp" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FLOATING ORDER */}
                <div className="absolute bottom-0 left-0 z-10 w-[245px] rounded-[20px] border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(20,20,20,0.14)] sm:w-[270px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#999]">
                        Novo pedido
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        Pedido recebido
                      </p>
                    </div>

                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7f6ed] text-[#2d8a55]">
                      <Check size={15} />
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3 border-t border-black/[0.06] pt-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff0e8] text-[#f26b38]">
                      <ShoppingBag size={14} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold">
                        Pedido de cliente
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#999]">
                        Loja online
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHANNELS */}
        <section className="border-y border-[#171717]/[0.07] bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b9994]">
                Onde o seu negócio acontece
              </p>

              <p className="mt-1 text-sm font-semibold text-[#4b4b4b]">
                Todos os canais ligados à mesma operação.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {channels.map(({ name, icon: Icon, tone }) => (
                <div
                  key={name}
                  className="flex items-center gap-2.5 rounded-full border border-black/[0.07] bg-[#fcfbf8] px-4 py-2.5"
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full ${tone}`}
                  >
                    <Icon size={14} />
                  </span>

                  <span className="text-xs font-semibold text-[#555]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT */}
        <section
          id="produto"
          className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f26b38]">
                  O produto
                </p>

                <h2 className="mt-5 max-w-[720px] text-[clamp(2.7rem,5.2vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.07em]">
                  Um catálogo.
                  <span className="block text-[#8c8a84]">
                    Uma fonte de verdade.
                  </span>
                </h2>
              </div>

              <p className="max-w-[520px] text-[17px] leading-7 text-[#6d6b67] lg:ml-auto">
                O seu produto não deve ter um preço no Instagram, outro no
                WhatsApp e outro na loja. O Vendora centraliza a informação
                que alimenta toda a operação.
              </p>
            </div>

            {/* STORE PREVIEW */}
            <div className="relative mt-16 overflow-hidden rounded-[30px] border border-[#171717]/10 bg-[#f0eee8] p-3 sm:p-5 lg:mt-20">
              <div className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-white">
                <div className="flex h-16 items-center justify-between border-b border-black/[0.06] px-5 sm:px-8">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f26b38] text-[10px] font-bold text-white">
                      V
                    </span>
                    <span className="text-sm font-bold">A sua loja</span>
                  </div>

                  <div className="hidden items-center gap-7 text-xs font-medium text-[#777] sm:flex">
                    <span>Produtos</span>
                    <span>Categorias</span>
                    <span>Sobre</span>
                  </div>

                  <div className="h-9 w-9 rounded-full bg-[#f5f4f0]" />
                </div>

                <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:p-12">
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f26b38]">
                      Coleção
                    </p>

                    <h3 className="mt-4 text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.065em]">
                      Produtos que
                      <span className="block text-[#88857f]">
                        merecem atenção.
                      </span>
                    </h3>

                    <p className="mt-5 max-w-[380px] text-sm leading-6 text-[#777]">
                      Uma experiência de compra simples, rápida e alinhada
                      com a identidade do seu negócio.
                    </p>

                    <div className="mt-7">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-xs font-semibold text-white">
                        Explorar produtos
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StoreProduct
                      name="Produto principal"
                      price="Preço"
                      accent="orange"
                    />

                    <StoreProduct
                      name="Novo produto"
                      price="Preço"
                      accent="green"
                    />

                    <StoreProduct
                      name="Mais vendido"
                      price="Preço"
                      accent="blue"
                      className="hidden sm:block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OPERATION */}
        <section
          id="operacao"
          className="bg-[#f0eee8] px-5 py-28 sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-[850px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f26b38]">
                Operação conectada
              </p>

              <h2 className="mt-5 text-[clamp(2.8rem,5.6vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.075em]">
                Cada venda deixa um rastro.
                <span className="block text-[#8a8882]">
                  O Vendora acompanha-o.
                </span>
              </h2>
            </div>

            <div className="mt-20 grid gap-4 md:grid-cols-3">
              {workflow.map(({ number, title, text, icon: Icon }) => (
                <article
                  key={number}
                  className="group relative min-h-[350px] overflow-hidden rounded-[26px] border border-black/[0.08] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(20,20,20,0.08)] sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.16em] text-[#aaa7a0]">
                      {number}
                    </span>

                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff0e8] text-[#f26b38] transition group-hover:bg-[#f26b38] group-hover:text-white">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                  </div>

                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#fff3eb] opacity-70" />

                  <div className="relative mt-24">
                    <h3 className="text-2xl font-semibold tracking-[-0.045em]">
                      {title}
                    </h3>

                    <p className="mt-4 max-w-[300px] text-sm leading-6 text-[#777]">
                      {text}
                    </p>
                  </div>

                  <div className="absolute bottom-8 left-9 right-9 h-px bg-black/[0.06]" />

                  <div className="absolute bottom-5 right-9 text-[#bbb8b1]">
                    <ArrowRight size={17} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AUTOMATION */}
        <section
          id="automacao"
          className="overflow-hidden bg-[#1b1b1a] px-5 py-28 text-white sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[11px] font-semibold text-white/60">
                  <Sparkles size={13} className="text-[#f26b38]" />
                  Automação
                </div>

                <h2 className="mt-7 text-[clamp(2.7rem,5.5vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                  O trabalho repetitivo
                  <span className="block text-[#f26b38]">
                    não precisa passar por você.
                  </span>
                </h2>

                <p className="mt-8 max-w-[520px] text-[17px] leading-7 text-white/55">
                  Os agentes do Vendora trabalham dentro das regras da sua
                  operação. A automação ajuda a executar tarefas, enquanto o
                  negócio continua sob o seu controlo.
                </p>

                <Link
                  to="/signup"
                  className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#171717] transition hover:bg-[#f26b38] hover:text-white"
                >
                  Conhecer a automação
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="relative">
                <div className="absolute -inset-10 rounded-full bg-[#f26b38]/10 blur-3xl" />

                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#242422] shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f26b38]">
                        <Zap size={16} />
                      </span>

                      <div>
                        <p className="text-xs font-bold">Marketing Agent</p>
                        <p className="mt-0.5 text-[10px] text-white/40">
                          Operação ativa
                        </p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-[10px] text-[#7bd59e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7bd59e]" />
                      Ativo
                    </span>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="rounded-2xl border border-white/[0.07] bg-[#1b1b1a] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                        Tarefa
                      </p>

                      <p className="mt-3 text-sm leading-6 text-white/80">
                        Preparar conteúdo para os produtos selecionados.
                      </p>

                      <div className="mt-5 flex items-center gap-2">
                        <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[9px] font-semibold text-[#f26b38]">
                          Instagram
                        </span>

                        <span className="rounded-full bg-[#e8f0ff] px-2.5 py-1 text-[9px] font-semibold text-[#5f91ef]">
                          Facebook
                        </span>

                        <span className="rounded-full bg-[#e5f8ed] px-2.5 py-1 text-[9px] font-semibold text-[#65b685]">
                          WhatsApp
                        </span>
                      </div>
                    </div>

                    <div className="my-5 flex justify-center">
                      <div className="h-8 w-px bg-white/10" />
                    </div>

                    <div className="space-y-2">
                      {automationItems.map((item, index) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
                        >
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                              index === 0
                                ? "bg-[#fff0e8] text-[#f26b38]"
                                : "bg-white/[0.06] text-white/50"
                            }`}
                          >
                            {index === 0 ? (
                              <Sparkles size={13} />
                            ) : (
                              <Check size={13} />
                            )}
                          </span>

                          <span className="text-xs text-white/65">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONNECTION */}
        <section className="relative overflow-hidden bg-[#f26b38] px-5 py-28 text-white sm:px-8 lg:px-10 lg:py-36">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border-[60px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full border-[80px] border-white/[0.07]" />

          <div className="relative mx-auto max-w-[1440px]">
            <div className="max-w-[1000px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Tudo conectado
              </p>

              <h2 className="mt-6 text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.08em]">
                Você vende.
                <span className="block text-[#3b2118]">
                  O Vendora conecta.
                </span>
              </h2>

              <p className="mt-8 max-w-[580px] text-[17px] leading-7 text-white/75">
                Uma operação construída para acompanhar o caminho completo:
                descoberta, produto, venda, pedido e gestão.
              </p>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-2">
              {[
                ["Produto", Package],
                ["Canal", MessageCircle],
                ["Venda", ShoppingBag],
                ["Pedido", Truck],
                ["Stock", BarChart3],
              ].map(([label, Icon], index) => {
                const IconComponent = Icon as typeof Package;

                return (
                  <div key={String(label)} className="flex items-center">
                    <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <IconComponent size={15} />
                      <span className="text-xs font-semibold">
                        {String(label)}
                      </span>
                    </div>

                    {index < 4 && (
                      <ChevronRight
                        size={16}
                        className="mx-1 text-white/45"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* START */}
        <section
          id="comece"
          className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="rounded-[32px] border border-black/[0.08] bg-white px-6 py-14 shadow-[0_20px_70px_rgba(20,20,20,0.05)] sm:px-12 lg:px-20 lg:py-20">
              <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f26b38]">
                    Comece agora
                  </p>

                  <h2 className="mt-5 max-w-[850px] text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.07em]">
                    Comece com uma loja.
                    <span className="block text-[#8b8983]">
                      Construa uma operação.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-[570px] text-base leading-7 text-[#777]">
                    Coloque o seu catálogo no ar e tenha uma base para gerir
                    os canais, pedidos, stock e crescimento do negócio.
                  </p>
                </div>

                <Link
                  to="/signup"
                  className="group inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#171717] px-7 text-sm font-bold text-white transition hover:bg-[#f26b38]"
                >
                  Criar conta
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.07] bg-[#f7f5f0]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f26b38] text-[11px] font-black text-white">
              V
            </span>

            <span className="text-sm font-bold tracking-[-0.03em]">
              Vendora
            </span>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-[#777]">
            <a href="#produto" className="hover:text-[#171717]">
              Produto
            </a>
            <a href="#operacao" className="hover:text-[#171717]">
              Operação
            </a>
            <a href="#automacao" className="hover:text-[#171717]">
              Automação
            </a>
            <Link to="/login" className="hover:text-[#171717]">
              Entrar
            </Link>
          </div>

          <p className="text-xs text-[#999]">
            © {new Date().getFullYear()} Vendora
          </p>
        </div>
      </footer>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  accent: "orange" | "green" | "purple";
  className?: string;
}) {
  const accents = {
    orange: "bg-[#fff0e8] text-[#f26b38]",
    green: "bg-[#e8f7ee] text-[#31865a]",
    purple: "bg-[#eeeaff] text-[#765bd4]",
  };

  return (
    <div
      className={`rounded-2xl border border-black/[0.06] bg-white p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#999]">{label}</span>
        <span className={`h-2 w-2 rounded-full ${accents[accent]}`} />
      </div>

      <p className="mt-3 text-lg font-bold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function MiniProduct({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-lg bg-[#f3f1eb]" />

      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold">{name}</p>
        <div className="mt-1 h-1.5 w-12 rounded-full bg-[#eeeae3]" />
      </div>
    </div>
  );
}

function MiniOrder({ channel }: { channel: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-[#777]">{channel}</span>
      <span className="h-2 w-2 rounded-full bg-[#65b685]" />
    </div>
  );
}

function StoreProduct({
  name,
  price,
  accent,
  className = "",
}: {
  name: string;
  price: string;
  accent: "orange" | "green" | "blue";
  className?: string;
}) {
  const backgrounds = {
    orange: "bg-[#fff0e8]",
    green: "bg-[#e8f5ed]",
    blue: "bg-[#eaf1ff]",
  };

  const shapes = {
    orange: "bg-[#f26b38]",
    green: "bg-[#4fa878]",
    blue: "bg-[#5789dc]",
  };

  return (
    <div className={`group ${className}`}>
      <div
        className={`relative aspect-[0.88] overflow-hidden rounded-[20px] ${backgrounds[accent]}`}
      >
        <div
          className={`absolute left-1/2 top-1/2 h-28 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-[18px] ${shapes[accent]} shadow-[0_18px_35px_rgba(0,0,0,0.12)]`}
        />

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold text-[#555]">
          Em stock
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold">{name}</p>
        <p className="mt-1 text-[10px] text-[#999]">{price}</p>
      </div>
    </div>
  );
}
