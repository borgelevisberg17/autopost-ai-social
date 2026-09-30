import { useState } from "react";
import {
  ArrowRight,
  Check,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const plans = [
  {
    name: "Starter",
    kicker: "For independent teams",
    description: "Get the daily operation clear before adding more complexity.",
    monthly: 29,
    features: [
      "1 connected brand space",
      "Website + 2 social channels",
      "Shared product catalogue & stock",
      "Sales AI guardrails & validation",
      "Standard order management",
      "Email support",
    ],
  },
  {
    name: "Growth",
    kicker: "For growing brands",
    description:
      "Keep every channel, campaign and customer conversation moving together.",
    monthly: 79,
    featured: true,
    features: [
      "3 connected brand spaces",
      "All 4 channels (Web, IG, FB, WhatsApp)",
      "Marketing, Sales and Analytics AI",
      "CRM events & approval workflows",
      "Priority customer onboarding",
      "Advanced sales performance metrics",
    ],
  },
  {
    name: "Scale",
    kicker: "For multi-brand operations",
    description:
      "More control for teams with high volume, multi-user permissions and custom spaces.",
    monthly: 199,
    features: [
      "Unlimited operating spaces",
      "Custom role-based permissions",
      "Custom CRM webhooks & workflows",
      "Dedicated success planning",
      "Guaranteed uptime SLA",
      "24/7 priority support",
    ],
  },
] as const;

const FAQ_PRICING = [
  {
    q: "Posso alterar o meu plano mais tarde?",
    a: "Sim. Pode fazer upgrade, downgrade ou cancelar o seu plano a qualquer momento diretamente nas configurações da sua empresa.",
  },
  {
    q: "Existe período de fidelização?",
    a: "Não. Os planos mensais podem ser cancelados mensalmente sem custos de penalização. Os planos anuais são faturados uma vez por ano com desconto.",
  },
  {
    q: "Preciso de cartão de crédito para experimentar?",
    a: "Não é necessário cartão para iniciar a configuração da sua conta e testar o sistema.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Todos os planos contam com suporte por email e documentação. Os planos Growth e Scale têm prioridade e acompanhamento dedicado.",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const { user } = useAuth();
  const startPath = user ? "/dashboard" : "/signup";
  const discount = annual ? 0.8 : 1;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f3ed] text-[#202522]">
      <SiteHeader ctaHref={startPath} />

      {/* Main Content */}
      <main className="pt-[72px] sm:pt-[76px]">
        {/* Editorial Hero with Background Image */}
        <section className="relative overflow-hidden bg-[#202522] text-white">
          <img
            src="/media/optimized/pricing-hero-editorial.webp"
            alt="Loja comercial Vendora"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#101512]/90 via-[#101512]/80 to-[#101512]" />

          <div className="relative mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3b08e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e36c3f]" />
                Transparent Pricing
              </div>

              <h1 className="text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.075em] text-white sm:text-6xl lg:text-7xl">
                A calmer way to <br className="hidden sm:inline" />
                <span className="text-[#f3b08e]">keep selling.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Choose the operating rhythm that fits your team today. Add
                channels, people and control as your business grows.
              </p>

              {/* Billing Toggle */}
              <div className="mt-9 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1.5 text-xs font-semibold backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={`rounded-full px-5 py-2.5 transition ${
                    !annual
                      ? "bg-white text-[#202522] shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Faturação Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setAnnual(true)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 transition ${
                    annual
                      ? "bg-white text-[#202522] shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Faturação Anual
                  <span className="rounded-full bg-[#e36c3f] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
                    Poupe 20%
                  </span>
                </button>
              </div>

              {/* Launch Promo Banner */}
              <div className="mx-auto mt-6 max-w-md flex items-center justify-center gap-2 border border-[#e6d4aa]/30 bg-[#fbf3dd]/10 px-4 py-2.5 text-xs text-[#f3b08e] backdrop-blur-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-[#e36c3f]" />
                <span>
                  <strong>Promoção de lançamento:</strong> 30% de desconto nos
                  primeiros 3 meses no plano anual.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Plans Grid Section */}
        <section className="border-b border-[#e2ded5] bg-[#fffdf9]">
          <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const price = Math.round(plan.monthly * discount);
                return (
                  <article
                    key={plan.name}
                    className={`relative flex flex-col justify-between border p-7 transition duration-300 ${
                      plan.featured
                        ? "border-[#2c6457] bg-[#d9e7de] shadow-[0_20px_50px_rgba(44,100,87,0.12)]"
                        : "border-[#d8d3c8] bg-[#fffdf9]"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute right-0 top-0 bg-[#e36c3f] px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                        Mais escolhido
                      </div>
                    )}

                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">
                        {plan.name}
                      </div>

                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f8a80]">
                        {plan.kicker}
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold leading-snug tracking-[-0.04em]">
                        {plan.description}
                      </h2>

                      <div className="mt-6 flex items-end gap-2 border-b border-black/10 pb-6">
                        <span className="text-5xl font-semibold tracking-[-0.08em]">
                          ${price}
                        </span>
                        <span className="pb-1 text-xs text-[#6e716b]">
                          /mês{annual ? " (faturado anualmente)" : ""}
                        </span>
                      </div>

                      <ul className="mt-6 space-y-3.5 text-xs leading-5 text-[#5f625d]">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6457]" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4">
                      <Link
                        to={`/signup?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`}
                        className={`inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold transition ${
                          plan.featured
                            ? "bg-[#202522] text-white hover:bg-[#2c6457]"
                            : "border border-[#c8c1b4] text-[#202522] hover:border-[#2c6457] hover:bg-[#2c6457] hover:text-white"
                        }`}
                      >
                        Começar com {plan.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f8a80]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#2c6457]" /> Sem cartão de
                crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[#2c6457]" /> Configuração imediata
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#2c6457]" /> Cancele quando
                quiser
              </span>
            </div>
          </div>
        </section>

        {/* Pricing FAQ Section */}
        <section className="border-b border-[#d8d3c8] bg-[#f1eee7]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#2c6457]">
                <HelpCircle className="h-3.5 w-3.5" /> Dúvidas Frequentes
              </div>
              <h2 className="text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
                Perguntas sobre os planos
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {FAQ_PRICING.map((item) => (
                <div
                  key={item.q}
                  className="border border-[#d8d3c8] bg-[#fffdf9] p-6"
                >
                  <h3 className="text-base font-semibold text-[#202522]">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#6e716b]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
