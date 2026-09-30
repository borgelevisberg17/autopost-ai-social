import { ReactNode } from "react";
import { Circle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <main className="min-h-screen bg-[#f6f3ed] text-[#202522]">
      <div className="min-h-screen lg:grid lg:grid-cols-[0.88fr_1.12fr]">
        {/* Left Side: Editorial Brand Panel with Background Image */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#202522] p-10 text-[#f6f3ed] lg:flex xl:p-14">
          {/* Background Image & Gradient Overlays */}
          <img
            src="/media/optimized/auth-human-commerce.webp"
            alt="Comerciante a gerir a loja"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101512] via-[#101512]/80 to-[#101512]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(44,100,87,0.3),transparent_60%)]" />

          {/* Top Logo */}
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-[#f6f3ed] transition-opacity hover:opacity-80"
            >
              <span className="grid h-9 w-9 place-items-center bg-[#e36c3f] text-white">
                <Circle className="h-3.5 w-3.5 fill-current" />
              </span>
              <span className="text-[20px] font-bold tracking-[-0.05em]">Vendora</span>
            </Link>
          </div>

          {/* Middle Content */}
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

            {/* Feature Highlights */}
            <div className="mt-10 space-y-3.5 border-t border-white/15 pt-8 text-xs font-medium text-white/80">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[#f3b08e]" />
                <span>Integração de loja online, WhatsApp, Instagram e Facebook</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#8bad9d]" />
                <span>Dados operacionais isolados e protegidos por permissões</span>
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            <span>Vendora Commerce OS</span>
            <span>Segurança Ativa</span>
          </div>
        </section>

        {/* Right Side: Clean Form Container */}
        <section className="flex min-h-screen flex-col justify-between bg-[#fffdf9] px-6 py-8 sm:px-12 lg:px-16 xl:px-20">
          {/* Header */}
          <header className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 text-[#202522]">
              <span className="grid h-8 w-8 place-items-center bg-[#202522] text-[#f6f3ed]">
                <Circle className="h-3 w-3 fill-current" />
              </span>
              <span className="text-[18px] font-bold tracking-[-0.05em]">Vendora</span>
            </Link>

            <div>{footer}</div>
          </header>

          {/* Main Form Content */}
          <div
            className={cn(
              "mx-auto my-auto w-full max-w-[420px] py-8",
              compact ? "max-w-[400px]" : "max-w-[420px]"
            )}
          >
            {children}
          </div>

          {/* Footer */}
          <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#f0ece1] pt-6 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#9a968d] sm:flex-row">
            <span>© {new Date().getFullYear()} Vendora</span>
            <Link to="/pricing" className="transition-colors hover:text-[#202522]">
              Ver Planos & Preços →
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
