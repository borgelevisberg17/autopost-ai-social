import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const productLinks = [
  { href: "#whatsapp", label: "WhatsApp IA" },
  { href: "#channels", label: "Publicação multicanal" },
  { href: "#agents", label: "Agentes especializados" },
  { href: "#plans", label: "Planos" },
];
const companyLinks = [
  { href: "#proof", label: "A plataforma" },
  { href: "#process", label: "Como funciona" },
  { href: "#faq", label: "Perguntas frequentes" },
];
const legalLinks = [
  { to: "/policy", label: "Privacidade" },
  { to: "/terms", label: "Termos de utilização" },
  { to: "/data-deletion", label: "Exclusão de dados" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#090a0b] text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/[.035] blur-3xl" />\n      <div className="mx-auto max-w-[1240px] px-5 pb-7 pt-16 sm:px-7 sm:pt-20 lg:px-8">
        <div className="grid gap-12 pb-14 md:grid-cols-[1.4fr_.7fr_.7fr]">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-semibold tracking-[-.04em] text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-black shadow-[0_0_30px_rgba(255,255,255,.12)]">V</span>
              Vendora
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">A operação comercial num só lugar. Ligue canais, organize pedidos e trabalhe com inteligência — sem perder o controlo.</p>\n            <div className="mt-7 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Comércio em movimento</div>
            <a href="#hero-stage" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-white/80 transition hover:text-white">Voltar ao início <ArrowUpRight className="h-3.5 w-3.5"/></a>
          </div>
          <nav aria-label="Produto" className="space-y-4">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Produto</h2>
            {productLinks.map((item)=><a key={item.href} href={item.href} className="block text-sm text-white/65 transition hover:text-white">{item.label}</a>)}
          </nav>
          <nav aria-label="Explorar" className="space-y-4">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Explorar</h2>
            {companyLinks.map((item)=><a key={item.href} href={item.href} className="block text-sm text-white/65 transition hover:text-white">{item.label}</a>)}
            <Link to="/signup" className="inline-flex items-center gap-1 text-sm text-white/65 transition hover:text-white">Criar conta <ArrowUpRight className="h-3 w-3"/></Link>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Vendora. Todos os direitos reservados.</span>
          <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((item)=><Link key={item.to} to={item.to} className="transition hover:text-white/80">{item.label}</Link>)}
          </nav>
          <span className="text-white/30">Feito para o comércio em movimento.</span>
        </div>
      </div>
    </footer>
  );
}
