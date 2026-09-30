import { ReactNode } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/site/BrandMark";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  compact?: boolean;
};

export function AuthShell({
  children,
  eyebrow = "SISTEMA OPERACIONAL COMERCIAL",
  title = "Uma forma mais calma de gerir o seu negócio.",
  description = "Catálogo, pedidos, canais de venda e automação inteligente num só lugar.",
  footer,
  compact = false,
}: AuthShellProps) {
  return (
    <main className="min-h-[100svh] bg-[#f6f3ed] text-[#202522]">
      <div className="min-h-[100svh] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#202522] p-10 text-[#f6f3ed] lg:flex xl:p-14">
          <img
            src="/media/optimized/auth-human-commerce.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101512] via-[#101512]/80 to-[#101512]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(44,100,87,0.3),transparent_60%)]" />

          <div className="relative z-10">
            <Link
              to="/"
              aria-label="Vendora — página inicial"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <BrandMark className="h-9 w-9" />
              <span className="text-xl font-bold tracking-[-0.05em]">
                Vendora
              </span>
            </Link>
          </div>

          <div className="relative z-10 my-auto max-w-[460px] py-12">
            <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#f3b08e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e36c3f]" />
              {eyebrow}
            </div>
            <h2 className="text-balance text-[42px] font-semibold leading-[0.96] tracking-[-0.06em] text-white">
              {title}
            </h2>
            <p className="mt-6 text-[15px] leading-7 text-white/70">
              {description}
            </p>
            <div className="mt-10 space-y-3.5 border-t border-white/15 pt-8 text-xs font-medium text-white/80">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 shrink-0 text-[#f3b08e]" />
                <span>
                  Integração de loja online, WhatsApp, Instagram e Facebook
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#8bad9d]" />
                <span>
                  Dados operacionais isolados e protegidos por permissões
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            <span>Vendora Commerce OS</span>
            <span>Segurança ativa</span>
          </div>
        </section>

        <section className="relative flex min-h-[196px] flex-col justify-between overflow-hidden bg-[#202522] p-5 text-[#f6f3ed] sm:min-h-[220px] sm:p-7 lg:hidden">
          <img
            src="/media/optimized/auth-human-commerce.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[center_44%] opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101512]/90 via-[#101512]/65 to-[#101512]/45" />
          <Link
            to="/"
            aria-label="Vendora — página inicial"
            className="relative z-10 inline-flex w-fit items-center gap-2.5"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-[-0.05em]">
              Vendora
            </span>
          </Link>
          <div className="relative z-10 mt-8">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#f3b08e]">
              Comércio num só lugar
            </div>
            <p className="mt-2 max-w-sm text-xl font-semibold leading-tight tracking-[-0.04em] sm:text-2xl">
              Menos separadores. Mais controlo da operação.
            </p>
          </div>
        </section>

        <section className="flex min-h-[calc(100svh-196px)] flex-col justify-between bg-[#fffdf9] px-5 py-5 sm:min-h-[calc(100svh-220px)] sm:px-12 sm:py-7 lg:min-h-[100svh] lg:px-16 lg:py-8 xl:px-20">
          <header className="flex min-h-8 items-center justify-between">
            <Link
              to="/"
              aria-label="Vendora — página inicial"
              className="hidden items-center gap-2.5 text-[#202522] lg:inline-flex"
            >
              <BrandMark className="h-8 w-8" />
              <span className="text-lg font-bold tracking-[-0.05em]">
                Vendora
              </span>
            </Link>
            <div className="ml-auto text-right">{footer}</div>
          </header>

          <div
            className={cn(
              "mx-auto my-auto w-full max-w-[420px] py-8",
              compact && "max-w-[400px]",
            )}
          >
            {children}
          </div>

          <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#f0ece1] pt-5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#9a968d] sm:flex-row sm:text-left">
            <span>© {new Date().getFullYear()} Vendora</span>
            <Link
              to="/pricing"
              className="transition-colors hover:text-[#202522]"
            >
              Ver planos e preços <span aria-hidden="true">→</span>
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
