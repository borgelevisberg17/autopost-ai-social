import { Link } from "react-router-dom";

const legalLinks = [
  { to: "/policy", label: "Privacidade" },
  { to: "/terms", label: "Termos" },
  { to: "/data-deletion", label: "Exclusão de dados" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-8 text-xs sm:py-9 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <span className="font-semibold tracking-tight text-slate-950">Vendora</span>
          <span>Operações de comércio, sem perder o fio.</span>
          <span>© {new Date().getFullYear()} Vendora</span>
        </div>
        <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5">
          {legalLinks.map((item) => (
            <Link key={item.to} to={item.to} className="transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
