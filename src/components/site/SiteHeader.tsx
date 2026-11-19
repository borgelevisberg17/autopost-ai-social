import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "./BrandMark";
import { LusionAudioToggle } from "@/components/lusion/LusionAudioToggle";
import { lusionSound } from "@/components/lusion/LusionAudio";
import { useTextScramble } from "@/components/lusion/useTextScramble";

type SiteHeaderProps = {
  ctaHref: string;
  onCtaClick?: () => void;
};

const navItems = [
  { label: "Produto", href: "/#channels" },
  { label: "Resultados", href: "/#proof" },
  { label: "Como funciona", href: "/#process" },
  { label: "Perguntas", href: "/#faq" },
  { label: "Planos", href: "/#plans", emphasis: true },
];

function NavLinkItem({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const { displayText, scramble } = useTextScramble(item.label);

  return (
    <a
      href={item.href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => {
        scramble();
        lusionSound.playHover();
      }}
      onClick={() => lusionSound.playClick()}
      className={`relative whitespace-nowrap py-2 text-[14px] font-medium transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4 ${
        active || item.emphasis
          ? "font-semibold text-slate-900"
          : "text-slate-600"
      } ${active ? "after:absolute after:inset-x-0 after:-bottom-[10px] after:h-0.5 after:bg-slate-900" : ""}`}
    >
      {displayText}
    </a>
  );
}

export function SiteHeader({ ctaHref, onCtaClick }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const authenticated = !authLoading && Boolean(user);

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  const ctaClassName =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] sm:min-h-10 sm:px-5 sm:text-sm";

  const renderActionLabel = () =>
    authenticated ? (
      <>
        <span className="sm:hidden">Dashboard</span>
        <span className="hidden sm:inline">Abrir painel</span>
      </>
    ) : (
      <>
        <span className="sm:hidden">Começar</span>
        <span className="hidden sm:inline">Começar grátis</span>
      </>
    );

  const isActive = (href: string) =>
    href === "/#plans"
      ? location.pathname === "/" && location.hash === "#plans"
      : location.pathname === "/" && location.hash === href.slice(1);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 shadow-[0_2px_20px_rgba(15,23,42,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-5 lg:px-8">
        <Link
          to="/"
          aria-label="Vendora — página inicial"
          className="flex shrink-0 items-center gap-2.5 transition hover:opacity-85"
        >
          <BrandMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-[20px] font-bold tracking-tight text-slate-900 sm:text-[22px]">
            Vendora
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 lg:flex 2xl:gap-8"
        >
          {navItems.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LusionAudioToggle />
          </div>
          {authLoading ? (
            <div aria-hidden="true" className="flex items-center gap-2">
              <span className="hidden h-10 w-14 animate-pulse rounded-full bg-slate-100 sm:block" />
              <span className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          ) : (
            <>
              {!authenticated && (
                <Link
                  to="/login"
                  className="hidden min-h-10 items-center px-4 text-[14px] font-semibold text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:inline-flex"
                >
                  Entrar
                </Link>
              )}
              {authenticated ? (
                <Link to="/dashboard" className={ctaClassName}>
                  {renderActionLabel()}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              ) : onCtaClick ? (
                <button
                  type="button"
                  onClick={onCtaClick}
                  className={ctaClassName}
                >
                  {renderActionLabel()}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : (
                <Link to={ctaHref} className={ctaClassName}>
                  {renderActionLabel()}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
            </>
          )}
          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:hidden shadow-xs"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Menu aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        aria-hidden={!menuOpen}
        className={`grid overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden ${menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
      >
        <nav aria-label="Navegação móvel" className="min-h-0 overflow-hidden">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-2 px-4 py-3 sm:px-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => { setMenuOpen(false); lusionSound.playClick(); }}
                className={`rounded-xl px-3 py-3 text-[14px] font-medium transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 ${
                  item.emphasis
                    ? "font-semibold text-slate-900 bg-slate-50"
                    : "text-slate-600"
                }`}
              >
                {item.label}
              </a>
            ))}
            {!authLoading && (
              <Link
                to={authenticated ? "/dashboard" : "/login"}
                tabIndex={menuOpen ? 0 : -1}
                className="col-span-2 mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-[14px] font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                {authenticated ? "Abrir painel" : "Aceder à conta"}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
