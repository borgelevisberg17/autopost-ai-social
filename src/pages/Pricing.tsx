import { useState } from "react";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { name: "Starter", kicker: "For independent teams", description: "Get the daily operation clear before adding more complexity.", monthly: 29, features: ["1 connected brand", "Website + 2 social channels", "Shared catalogue", "Sales AI guardrails"] },
  { name: "Growth", kicker: "For growing brands", description: "Keep every channel, campaign and customer conversation moving together.", monthly: 79, featured: true, features: ["3 connected brands", "All 4 channels", "Marketing, Sales and Analytics AI", "CRM events and approvals", "Priority onboarding"] },
  { name: "Scale", kicker: "For multi-brand teams", description: "More control for teams with more volume, people and operating spaces.", monthly: 199, features: ["Unlimited operating spaces", "Advanced permissions", "Custom CRM workflows", "Dedicated success planning"] },
] as const;

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const discount = annual ? 0.8 : 1;

  return <div className="min-h-screen bg-[#f7f3ea] text-[#202522]">
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/15 bg-[#202522]/50 text-white backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center bg-[#e36c3f] text-white"><Circle className="h-3 w-3 fill-current" /></span><span className="text-[19px] font-bold tracking-[-0.05em]">Vendora</span></Link>
        <div className="flex items-center gap-5 text-sm"><Link to="/" className="hidden text-white/65 transition hover:text-white sm:block">Back to site</Link><Link to="/login" className="font-semibold text-white">Sign in</Link></div>
      </div>
    </header>

    <main>
      <section className="relative min-h-[680px] overflow-hidden bg-[#202522] text-white sm:min-h-[740px]">
        <img src="/media/optimized/pricing-hero-editorial.webp" alt="Shop owner using Vendora while customers browse a store" className="absolute inset-0 h-full w-full object-cover object-center opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101512] via-[#101512]/90 to-[#101512]/20" />
        <div className="relative mx-auto flex min-h-[680px] max-w-[1240px] items-end px-5 pb-16 pt-32 sm:min-h-[740px] sm:pb-24 lg:px-8">
          <div className="max-w-2xl reveal-up">
            <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3b08e]"><span className="h-1.5 w-1.5 rounded-full bg-[#e36c3f]" /> Plans that grow with the operation</div>
            <h1 className="max-w-xl text-6xl font-semibold leading-[0.88] tracking-[-0.08em] sm:text-8xl">A calmer way to keep selling.</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/70 sm:text-lg">Choose the operating rhythm that fits your team today. Add channels, people and control as the business earns its next stage.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><a href="#plans" className="inline-flex h-12 items-center gap-2 bg-[#e36c3f] px-6 text-sm font-semibold text-white transition hover:bg-[#f08055]">See the plans <ArrowRight className="h-4 w-4" /></a><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">No card required to start</span></div>
          </div>
        </div>
        <div className="absolute bottom-5 right-5 hidden max-w-[250px] border border-white/20 bg-[#202522]/60 p-4 text-xs leading-5 text-white/65 backdrop-blur sm:block lg:right-8"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#e36c3f]">Launch window</span><p className="mt-2">Save 30% on your first 3 months with an annual plan.</p></div>
      </section>

      <section id="plans" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-[#d8d3c8] pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#2c6457]">Choose your operating rhythm</div><h2 className="max-w-xl text-4xl font-semibold leading-[0.95] tracking-[-0.07em] sm:text-5xl">Start focused. Grow without a reset.</h2></div><div className="inline-flex shrink-0 items-center gap-1 self-start border border-[#d8d3c8] bg-[#fffdf9] p-1 text-sm sm:self-auto"><button type="button" onClick={() => setAnnual(false)} className={`px-4 py-2 font-semibold transition ${!annual ? "bg-[#f1eee7] text-[#202522]" : "text-[#6e716b]"}`}>Monthly</button><button type="button" onClick={() => setAnnual(true)} className={`inline-flex items-center gap-2 px-4 py-2 font-semibold transition ${annual ? "bg-[#202522] text-white" : "text-[#6e716b]"}`}>Yearly <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">Save 20%</span></button></div></div>
        <div className="mt-8 flex items-center gap-2 border border-[#e6d4aa] bg-[#fbf3dd] px-4 py-3 text-xs text-[#8b6b36]"><Sparkles className="h-4 w-4 shrink-0 text-[#e36c3f]" /><span><strong>Launch promotion:</strong> 30% off your first 3 months with any annual plan.</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">{plans.map((plan) => { const price = Math.round(plan.monthly * discount); return <article key={plan.name} className={`relative flex flex-col overflow-hidden border p-6 transition duration-300 hover:-translate-y-1 sm:p-8 ${plan.featured ? "border-[#2c6457] bg-[#d9e7de] shadow-[0_22px_60px_rgba(44,100,87,0.14)]" : "border-[#d8d3c8] bg-[#fffdf9]"}`}>{plan.featured && <div className="absolute right-0 top-0 bg-[#e36c3f] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Most chosen</div>}<div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">{plan.name}</div><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f8a80]">{plan.kicker}</p><h3 className="mt-3 max-w-xs text-2xl font-semibold leading-[1.02] tracking-[-0.05em]">{plan.description}</h3><div className="mt-8 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-0.08em]">${price}</span><span className="pb-2 text-xs text-[#6e716b]">/month{annual ? ", billed yearly" : ""}</span></div>{annual && <div className="mt-2 font-mono text-[10px] text-[#8b6b36]">30% off first 3 months · 20% annual saving</div>}<ul className="mt-8 flex-1 space-y-3 border-t border-black/10 pt-6 text-sm text-[#5f625d]">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6457]" />{feature}</li>)}</ul><Link to={`/signup?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`} className={`mt-8 inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold transition ${plan.featured ? "bg-[#202522] text-white hover:bg-[#2c6457]" : "border border-[#c8c1b4] text-[#202522] hover:border-[#2c6457]"}`}>Start with {plan.name} <ArrowRight className="h-4 w-4" /></Link></article>; })}</div>
        <p className="mt-8 text-center text-xs leading-5 text-[#8f8a80]">All plans include guided setup, secure access and the same operating foundation. Change plan after setup.</p>
      </section>
    </main>
    <footer className="border-t border-[#35453d] bg-[#202522] px-5 py-8 text-center text-xs text-white/50">Vendora · Commerce operations, made legible.</footer>
  </div>;
}
