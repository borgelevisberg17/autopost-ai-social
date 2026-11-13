import { Link } from "react-router-dom";

const legalLinks = [
  { to: "/policy", label: "Privacidade" },
  { to: "/terms", label: "Termos" },
  { to: "/data-deletion", label: "Exclusão de dados" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#202522] text-white/55">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-7 text-xs lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <span className="font-semibold text-white">Vendora</span>
          <span>Operações de comércio, sem perder o fio.</span>
          <span>© {new Date().getFullYear()} Vendora</span>
        </div>
        <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4">
          {legalLinks.map((item) => (
            <Link key={item.to} to={item.to} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
