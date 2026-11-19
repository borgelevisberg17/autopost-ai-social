import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const productLinks = [
  { href: "/#whatsapp", label: "WhatsApp IA" },
  { href: "/#channels", label: "Publicação multicanal" },
  { href: "/#agents", label: "Agentes especializados" },
  { href: "/#plans", label: "Planos" },
];

const companyLinks = [
  { href: "/#proof", label: "A plataforma" },
  { href: "/#process", label: "Como funciona" },
  { href: "/#faq", label: "Perguntas frequentes" },
];

const legalLinks = [
  { to: "/policy", label: "Privacidade" },
  { to: "/terms", label: "Termos de utilização" },
  { to: "/data-deletion", label: "Exclusão de dados" },
];

const linkClass =
  "group inline-flex w-fit items-center gap-2 text-[13px] text-white/55 transition-colors duration-200 hover:text-white";

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#090a0b] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-white/[.045] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-[28%] h-64 w-64 rounded-full bg-slate-500/[.06] blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-0 select-none font-semibold leading-none tracking-[-.1em] text-white/[.025] text-[clamp(7rem,19vw,18rem)]"
      >
        VENDORA
      </div>

      <div className="relative mx-auto max-w-[1320px] px-5 pb-8 pt-16 sm:px-7 sm:pt-20 lg:px-10 lg:pt-24">
        <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_.8fr_.8fr_.8fr] lg:gap-x-14">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-xl font-semibold tracking-[-.05em] text-white"
            >
              <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-white text-sm font-bold text-black shadow-[0_0_36px_rgba(255,255,255,.12)]">
                V
              </span>
              Vendora
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-7 text-white/50">
              A operação comercial num só lugar. Ligue canais, organize pedidos
              e trabalhe com inteligência — sem perder o controlo.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" />
              Comércio em movimento
            </div>
          </div>

          <nav aria-label="Produto" className="flex flex-col items-start gap-4">
            <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">
              Produto
            </h2>
            {productLinks.map((item) => (
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-70" />
              </a>
            ))}
          </nav>

          <nav aria-label="Explorar" className="flex flex-col items-start gap-4">
            <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">
              Explorar
            </h2>
            {companyLinks.map((item) => (
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-70" />
              </a>
            ))}
            <Link to="/signup" className={linkClass}>
              Criar conta
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-70" />
            </Link>
          </nav>

          <nav aria-label="Informações legais" className="flex flex-col items-start gap-4">
            <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">
              Legal
            </h2>
            {legalLinks.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>
                {item.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-70" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Vendora. Todos os direitos reservados.</span>
          <a
            href="/#hero-stage"
            className="inline-flex w-fit items-center gap-2 font-medium text-white/55 transition hover:text-white"
          >
            Voltar ao início
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a href="https://cachiluvia.com" target="_blank" rel="noreferrer" className="text-white/45 transition hover:text-white">Desenvolvido por <span className="font-semibold text-white/75">Cachiluvia Soluções</span></a>
        </div>
      </div>
    </footer>
  );
}
