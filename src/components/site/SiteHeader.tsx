import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "./BrandMark";

type SiteHeaderProps = {
  ctaHref: string;
  onCtaClick?: () => void;
};

const navItems = [
  { label: "Product", href: "/#channels" },
  { label: "Proof", href: "/#proof" },
  { label: "How it works", href: "/#process" },
  { label: "FAQ", href: "/#faq" },
  { label: "Plans", href: "/pricing", emphasis: true },
];

export function SiteHeader({ ctaHref, onCtaClick }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const authenticated = !authLoading && Boolean(user);

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  const ctaClassName =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#e36c3f] px-3 text-[13px] font-semibold text-white transition hover:bg-[#c95735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202522] focus-visible:ring-offset-2 sm:min-h-11 sm:px-5 sm:text-sm";

  const renderActionLabel = () =>
    authenticated ? (
      <>
        <span className="sm:hidden">Dashboard</span>
        <span className="hidden sm:inline">Open dashboard</span>
      </>
    ) : (
      <>
        <span className="sm:hidden">Start free</span>
        <span className="hidden sm:inline">Start for free</span>
      </>
    );

  const isActive = (href: string) =>
    href === "/pricing"
      ? location.pathname === "/pricing"
      : location.pathname === "/" && location.hash === href.slice(1);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e2ded5] bg-[#f6f3ed]/95 shadow-[0_2px_10px_rgba(32,37,34,0.04)] backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-5 lg:px-8">
        <Link
          to="/"
          aria-label="Vendora — página inicial"
          className="flex shrink-0 items-center gap-2.5"
        >
          <BrandMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-[19px] font-bold tracking-[-0.05em] text-[#202522] sm:text-[21px]">
            Vendora
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-5 lg:flex 2xl:gap-7"
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap py-2 text-[15px] font-medium transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-4 ${
                  active || item.emphasis
                    ? "font-semibold text-[#2c6457]"
                    : "text-[#6e716b]"
                } ${active ? "after:absolute after:inset-x-0 after:-bottom-[10px] after:h-0.5 after:bg-[#e36c3f]" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {authLoading ? (
            <div aria-hidden="true" className="flex items-center gap-2">
              <span className="hidden h-10 w-14 animate-pulse bg-[#e9e5dc] sm:block" />
              <span className="h-10 w-24 animate-pulse bg-[#e9e5dc]" />
            </div>
          ) : (
            <>
              {!authenticated && (
                <Link
                  to="/login"
                  className="hidden min-h-11 items-center px-3 text-[15px] font-semibold text-[#5f625d] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-2 lg:inline-flex"
                >
                  Sign in
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d8d3c8] bg-[#fffdf9] text-[#202522] transition hover:border-[#2c6457] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457] focus-visible:ring-offset-2 lg:hidden"
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
        className={`grid overflow-hidden border-t border-[#e2ded5] bg-[#fffdf9] transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden ${menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
      >
        <nav aria-label="Navegação móvel" className="min-h-0 overflow-hidden">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-1.5 px-4 py-3 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                tabIndex={menuOpen ? 0 : -1}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-xl px-3 py-3.5 text-[15px] font-medium transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2c6457] ${
                  item.emphasis
                    ? "font-semibold text-[#2c6457]"
                    : "text-[#5f625d]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!authLoading && (
              <Link
                to={authenticated ? "/dashboard" : "/login"}
                tabIndex={menuOpen ? 0 : -1}
                className="col-span-2 mt-1 rounded-xl border border-[#d8d3c8] px-3 py-3.5 text-center text-[15px] font-semibold text-[#202522] transition hover:bg-[#f6f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457]"
              >
                {authenticated ? "Open dashboard" : "Sign in to your account"}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
