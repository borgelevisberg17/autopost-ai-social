import { useState } from "react";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "For independent teams getting their operation clear.",
    monthly: 29,
    features: ["1 connected brand", "Website + 2 social channels", "Shared catalogue", "Sales AI guardrails"],
  },
  {
    name: "Growth",
    description: "For growing brands that need every channel moving together.",
    monthly: 79,
    featured: true,
    features: ["3 connected brands", "All 4 channels", "Marketing, Sales and Analytics AI", "CRM events and approvals", "Priority onboarding"],
  },
  {
    name: "Scale",
    description: "For multi-brand teams with more volume and more control.",
    monthly: 199,
    features: ["Unlimited operating spaces", "Advanced permissions", "Custom CRM workflows", "Dedicated success planning"],
  },
] as const;

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const discount = annual ? 0.8 : 1;

  return <div className="min-h-screen bg-[#f6f3ed] text-[#202522]"><header className="border-b border-[#e2ded5] bg-[#fffdf9]/95"><div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8"><Link to="/" className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center bg-[#202522] text-[#f6f3ed]"><Circle className="h-3 w-3 fill-current" /></span><span className="text-[19px] font-bold tracking-[-0.05em]">Vendora</span></Link><div className="flex items-center gap-3 text-sm"><Link to="/" className="hidden text-[#6e716b] transition hover:text-[#202522] sm:block">Back to site</Link><Link to="/login" className="font-semibold text-[#5f625d]">Sign in</Link></div></div></header><main><section className="border-b border-[#d8d3c8] bg-[#fffdf9]"><div className="mx-auto max-w-[1240px] px-5 py-20 text-center lg:px-8 lg:py-28"><div className="mx-auto max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#2c6457]"><span className="h-1.5 w-1.5 rounded-full bg-[#2c6457]" /> Plans that grow with the operation</div><h1 className="text-5xl font-semibold leading-[0.94] tracking-[-0.075em] sm:text-7xl">Start with the rhythm your team needs.</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#6e716b] sm:text-lg">One place for catalogue, channels, agents and the daily work behind every sale.</p><div className="mt-8 inline-flex items-center gap-1 border border-[#d8d3c8] bg-[#f1eee7] p-1 text-sm"><button type="button" onClick={() => setAnnual(false)} className={`px-4 py-2 font-semibold transition ${!annual ? "bg-[#fffdf9] text-[#202522] shadow-sm" : "text-[#6e716b]"}`}>Monthly</button><button type="button" onClick={() => setAnnual(true)} className={`inline-flex items-center gap-2 px-4 py-2 font-semibold transition ${annual ? "bg-[#202522] text-white shadow-sm" : "text-[#6e716b]"}`}>Yearly <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#e36c3f]">Save 20%</span></button></div><div className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-2 border border-[#e6d4aa] bg-[#fbf3dd] px-4 py-3 text-left text-xs text-[#8b6b36]"><Sparkles className="h-4 w-4 shrink-0 text-[#e36c3f]" /><span><strong>Launch promotion:</strong> save 30% on your first 3 months with any annual plan.</span></div></div></div></section><section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20"><div className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => { const price = Math.round(plan.monthly * discount); return <article key={plan.name} className={`relative flex flex-col border p-6 sm:p-7 ${plan.featured ? "border-[#2c6457] bg-[#d9e7de] shadow-[0_18px_50px_rgba(44,100,87,0.12)]" : "border-[#d8d3c8] bg-[#fffdf9]"}`}>{plan.featured && <div className="absolute right-5 top-5 bg-[#e36c3f] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Most chosen</div>}<div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">{plan.name}</div><h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">{plan.name === "Growth" ? "Keep every channel moving." : plan.description}</h2>{plan.name === "Growth" && <p className="mt-3 max-w-xs text-sm leading-6 text-[#5f625d]">{plan.description}</p>}<div className="mt-8 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-0.08em]">${price}</span><span className="pb-2 text-xs text-[#6e716b]">/month{annual ? ", billed yearly" : ""}</span></div>{annual && <div className="mt-2 font-mono text-[10px] text-[#8b6b36]">30% off first 3 months · 20% annual saving</div>}<ul className="mt-8 flex-1 space-y-3 border-t border-black/10 pt-6 text-sm text-[#5f625d]">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6457]" />{feature}</li>)}</ul><Link to={`/signup?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`} className={`mt-8 inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold transition ${plan.featured ? "bg-[#202522] text-white hover:bg-[#2c6457]" : "border border-[#c8c1b4] text-[#202522] hover:border-[#2c6457]"}`}>Start with {plan.name} <ArrowRight className="h-4 w-4" /></Link></article>; })}</div><div className="mx-auto mt-10 max-w-3xl border-t border-[#d8d3c8] pt-6 text-center text-xs leading-5 text-[#8f8a80]">All plans include a guided setup, secure access and the same operating foundation. You can change plan after setup.</div></section></main><footer className="border-t border-[#d8d3c8] bg-[#202522] px-5 py-8 text-center text-xs text-white/50">Vendora · Commerce operations, made legible.</footer></div>;
}
