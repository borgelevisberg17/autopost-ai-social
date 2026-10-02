import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  { name: "Starter", description: "The daily operation clear before adding more complexity.", monthly: 29, featured: false, features: ["1 brand space", "Website + 2 social channels", "Shared catalogue", "Sales AI guardrails"] },
  { name: "Growth", description: "Every channel, campaign and conversation moving together.", monthly: 79, featured: true, features: ["3 brand spaces", "All 4 channels", "Marketing, Sales and Analytics AI", "CRM events and approvals"] },
  { name: "Scale", description: "More control for teams with volume, people and operating spaces.", monthly: 199, featured: false, features: ["Unlimited spaces", "Advanced permissions", "Custom CRM workflows", "Dedicated success planning"] },
] as const;

export function PlansSection() {
  const [annual, setAnnual] = useState(true);
  return <section id="plans" className="border-y border-[#e2ded5] bg-[#f1eee7]">
    <div className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col gap-7 border-b border-[#d8d3c8] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><div className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#2c6457]">Plans that grow with the operation</div><h2 className="text-5xl font-semibold leading-[0.94] tracking-[-0.08em] sm:text-7xl">Start focused.<br /><span className="text-[#2c6457]">Grow without a reset.</span></h2><p className="mt-6 max-w-xl text-base leading-7 text-[#6e716b]">The same clear operating foundation, sized for where your team is now.</p></div>
        <div role="group" aria-label="Billing frequency" className="inline-flex w-fit items-center gap-1 rounded-full border border-[#d8d3c8] bg-[#fffdf9] p-1 text-xs font-semibold"><button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)} className={`rounded-full px-4 py-2.5 transition ${!annual ? "bg-[#202522] text-white" : "text-[#6e716b]"}`}>Monthly</button><button type="button" aria-pressed={annual} onClick={() => setAnnual(true)} className={`rounded-full px-4 py-2.5 transition ${annual ? "bg-[#202522] text-white" : "text-[#6e716b]"}`}>Annual <span className="ml-1 font-mono text-[9px] text-[#e36c3f]">−20%</span></button></div>
      </div>
      <div className="mt-6 flex items-center gap-2 border border-[#e6d4aa] bg-[#fbf3dd] px-4 py-3 text-xs text-[#8b6b36]"><Sparkles className="h-4 w-4 shrink-0 text-[#e36c3f]" /><span><strong>Launch offer:</strong> save 30% on your first 3 months with annual billing.</span></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">{plans.map((plan) => { const price = annual ? Math.round(plan.monthly * .8) : plan.monthly; return <article key={plan.name} className={`flex flex-col border p-6 transition duration-300 hover:-translate-y-1 sm:p-7 ${plan.featured ? "border-[#b9cabe] bg-[#d9e7de] shadow-[0_18px_45px_rgba(44,100,87,0.12)]" : "border-[#d8d3c8] bg-[#fffdf9]"}`}>{plan.featured && <div className="mb-5 w-fit bg-[#e36c3f] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">Most chosen</div>}<div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">{plan.name}</div><h3 className="mt-4 max-w-xs text-2xl font-semibold leading-[1] tracking-[-0.05em]">{plan.description}</h3><div className="mt-7 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-0.08em]">${price}</span><span className="pb-2 text-xs text-[#6e716b]">/month{annual ? " billed yearly" : ""}</span></div><ul className="mt-7 flex-1 space-y-3 border-t border-black/10 pt-6 text-sm text-[#5f625d]">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6457]" />{feature}</li>)}</ul><Link to={`/signup?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`} className={`mt-8 inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold transition ${plan.featured ? "bg-[#202522] text-white hover:bg-[#2c6457]" : "border border-[#c8c1b4] text-[#202522] hover:border-[#2c6457]"}`}>Start with {plan.name} <ArrowRight className="h-4 w-4" /></Link></article>; })}</div>
      <p className="mt-7 text-center text-xs text-[#8f8a80]">No card required to start · Change plan after setup</p>
    </div>
  </section>;
}
