import { useState } from "react";
import {
  ArrowRight,
  Check,
  HelpCircle,
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
    q: "Can I change my plan later?",
    a: "Yes. Upgrade, downgrade or cancel at any time from your company settings.",
  },
  {
    q: "Is there a long-term commitment?",
    a: "No. Monthly plans can be cancelled at any time. Annual plans are billed once a year at a discounted rate.",
  },
  {
    q: "Do I need a credit card to get started?",
    a: "No card is needed to set up your account and explore the platform.",
  },
  {
    q: "What support is included?",
    a: "Every plan includes email support and documentation. Growth and Scale include priority support and dedicated guidance.",
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

      <main className="pt-[72px] sm:pt-[76px]">
        <section className="relative isolate overflow-hidden bg-[#202522] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] sm:h-[430px] sm:w-[430px]" />
            <div className="absolute left-1/2 top-1/2 hidden h-[570px] w-[570px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e36c3f]/[0.16] sm:block" />
          </div>

          <div className="relative mx-auto max-w-[1240px] px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3b08e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e36c3f]" />
                Transparent pricing
              </div>

              <h1 className="text-balance text-[clamp(2.35rem,9vw,4.8rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-white sm:text-6xl lg:text-7xl">
                A calmer way to <br className="hidden sm:inline" />
                <span className="text-[#f3b08e]">keep selling.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Choose the operating rhythm that fits your team today. Add
                channels, people and control as your business grows.
              </p>

              <div
                role="group"
                aria-label="Billing frequency"
                className="mx-auto mt-9 grid w-full max-w-[440px] grid-cols-2 gap-1 rounded-2xl border border-white/15 bg-white/[0.06] p-1.5 text-xs font-semibold sm:inline-flex sm:w-auto sm:max-w-none sm:rounded-full sm:bg-black/30"
              >
                <button
                  type="button"
                  aria-pressed={!annual}
                  onClick={() => setAnnual(false)}
                  className={`min-h-11 rounded-xl px-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:rounded-full sm:px-5 ${
                    !annual
                      ? "bg-white text-[#202522] shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  aria-pressed={annual}
                  onClick={() => setAnnual(true)}
                  className={`inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:gap-2 sm:rounded-full sm:px-5 ${
                    annual
                      ? "bg-white text-[#202522] shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Annual
                  <span className="rounded-full bg-[#e36c3f] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white sm:px-2 sm:text-[9px]">
                    Save 20%
                  </span>
                </button>
              </div>

              <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-2xl border border-[#e6d4aa]/25 bg-white/[0.04] px-4 py-3 text-xs leading-5 text-[#f3b08e]">
                <Sparkles className="h-4 w-4 shrink-0 text-[#e36c3f]" />
                <span>
                  <strong>Launch offer:</strong> 30% off your first 3 months
                  with annual billing.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Available plans" className="bg-[#f6f3ed]">
          <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {plans.map((plan) => {
                const price = Math.round(plan.monthly * discount);
                return (
                  <article
                    key={plan.name}
                    className={`relative flex h-full flex-col justify-between rounded-2xl border p-5 shadow-[0_6px_24px_rgba(32,37,34,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(32,37,34,0.09)] sm:p-7 ${
                      plan.featured
                        ? "border-[#b9cabe] bg-[#d9e7de]"
                        : "border-[#e2ded5] bg-[#fffdf9]"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#e36c3f] px-3.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                        Most popular
                      </div>
                    )}

                    <div>
                      <h2 className="font-serif text-[26px] font-medium tracking-[-0.04em] text-[#202522]">
                        {plan.name}
                      </h2>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#2c6457]">
                        {plan.kicker}
                      </p>
                      <p className="mt-3 min-h-[48px] text-[15px] leading-6 text-[#6e716b]">
                        {plan.description}
                      </p>

                      <div
                        aria-live="polite"
                        className="mt-6 flex items-end gap-2 rounded-xl bg-white/55 px-4 py-4"
                      >
                        <span className="font-serif text-5xl font-medium tracking-[-0.08em]">
                          ${price}
                        </span>
                        <span className="pb-1 text-xs text-[#6e716b]">
                          /month{annual ? " (billed annually)" : ""}
                        </span>
                      </div>

                      <ul className="mt-6 space-y-3.5 text-sm leading-6 text-[#5f625d]">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5"
                          >
                            <Check className="mt-1 h-4 w-4 shrink-0 text-[#2c6457]" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <Link
                        to={`/signup?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`}
                        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2 ${
                          plan.featured
                            ? "bg-[#202522] text-white hover:bg-[#2c6457]"
                            : "border border-[#d2cdbf] bg-transparent text-[#202522] hover:border-[#2c6457] hover:bg-[#2c6457] hover:text-white"
                        }`}
                      >
                        Start with {plan.name}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center text-xs font-medium text-[#737a72]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ded9d0] bg-[#fffdf9] px-4 py-2">
                <Zap className="h-4 w-4 text-[#2c6457]" /> Ready in minutes
              </span>
            </div>
          </div>
        </section>

        <section className="bg-[#f1eee7]">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#2c6457]">
                <HelpCircle className="h-3.5 w-3.5" /> Common questions
              </div>
              <h2 className="text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
                Questions about plans
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {FAQ_PRICING.map((item) => (
                <article
                  key={item.q}
                  className="rounded-2xl border border-[#e2ded5] bg-[#fffdf9] p-5 sm:p-6"
                >
                  <h3 className="text-base font-semibold text-[#202522]">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#6e716b]">
                    {item.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
