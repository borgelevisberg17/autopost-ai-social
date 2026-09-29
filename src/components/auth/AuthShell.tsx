import { ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, Store } from "lucide-react";
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

const highlights = [
  "Produtos e stock centralizados",
  "Pedidos em todos os canais",
  "Automação com controlo",
];

export function AuthShell({
  children,
  eyebrow = "VENDA · GESTÃO · CRESCIMENTO",
  title = "A operação da sua loja, num só lugar.",
  description = "Catálogo, pedidos, canais e automação conectados à realidade do seu negócio.",
  footer,
  compact = false,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <div className="min-h-screen lg:grid lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)]">
        {/* Brand side */}
        <section className="relative hidden overflow-hidden bg-[#111111] text-white lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
            <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full border border-white/[0.05]" />
            <div className="absolute bottom-[-180px] right-[-100px] h-[460px] w-[460px] rounded-full border border-white/[0.06]" />
          </div>

          <div className="relative z-10 flex min-h-screen w-full flex-col p-10 xl:p-14">
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 text-white transition-opacity hover:opacity-70"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[11px] border border-white/15 bg-white/[0.06]">
                <Store className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </span>

              <span className="text-[18px] font-semibold tracking-[-0.03em]">
                Vendora
              </span>
            </Link>

            <div className="my-auto max-w-[500px] pb-10">
              <p className="mb-6 text-[11px] font-semibold tracking-[0.18em] text-white/45">
                {eyebrow}
              </p>

              <h2 className="max-w-[490px] text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] xl:text-[58px]">
                {title}
              </h2>

              <p className="mt-7 max-w-[430px] text-[16px] leading-7 text-white/55">
                {description}
              </p>

              <div className="mt-10 space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-[13px] text-white/65"
                  >
                    <CheckCircle2
                      className="h-[17px] w-[17px] text-white/45"
                      strokeWidth={1.8}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-5 text-[11px] text-white/35">
              <span>Uma plataforma para a sua operação.</span>

              <span className="flex items-center gap-1">
                Angola
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </section>

        {/* Form side */}
        <section className="relative flex min-h-screen flex-col bg-white">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
            <Link
              to="/"
              className="flex items-center gap-2 text-[#111111] lg:hidden"
            >
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#111111] text-white">
                <Store className="h-4 w-4" strokeWidth={1.8} />
              </span>

              <span className="font-semibold tracking-[-0.03em]">
                Vendora
              </span>
            </Link>

            <div className="ml-auto">{footer}</div>
          </header>

          <div
            className={cn(
              "mx-auto flex w-full max-w-[470px] flex-1 flex-col justify-center px-5 pb-12 sm:px-8 lg:px-12",
              compact ? "py-10" : "py-8",
            )}
          >
            {children}
          </div>

          <div className="px-5 pb-5 text-center text-[11px] text-[#999999] sm:px-8 lg:px-12 lg:pb-7">
            © {new Date().getFullYear()} Vendora
          </div>
        </section>
      </div>
    </main>
  );
}
