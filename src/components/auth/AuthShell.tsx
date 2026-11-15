import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/site/BrandMark";

type AuthShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
};

export function AuthShell({
  children,
  footer,
  compact = false,
}: AuthShellProps) {
  return (
    <main className="min-h-[100svh] bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-[100svh] max-w-[1440px] flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <header className="flex min-h-11 items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Vendora — página inicial"
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-75"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Vendora
            </span>
          </Link>
          <div className="shrink-0 text-right">{footer}</div>
        </header>

        <div className="my-4 flex flex-1 items-center sm:my-6 lg:my-8">
          <div className="mx-auto grid w-full max-w-[1080px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:min-h-[600px] lg:grid-cols-[0.88fr_1.12fr]">
            <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex">
              <img
                src="/media/optimized/auth-human-commerce.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="relative z-10 flex min-h-[600px] w-full items-end p-10 xl:p-14">
                <div className="max-w-sm">
                  <span className="mb-5 block h-1 w-9 rounded-full bg-emerald-500" />
                  <h2 className="text-[35px] font-bold leading-[1.05] tracking-tight text-white xl:text-[42px]">
                    Comércio, em sintonia.
                  </h2>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    A plataforma inteligente que une a sua loja online, automação de vendas e WhatsApp num só ecossistema.
                  </p>
                </div>
              </div>
            </aside>

            <section className="flex min-h-[calc(100svh-132px)] items-center justify-center bg-white px-5 py-9 sm:px-10 lg:min-h-[600px] lg:px-12 xl:px-16">
              <div
                className={cn(
                  "mx-auto my-auto w-full max-w-[380px]",
                  compact && "max-w-[350px]",
                )}
              >
                {children}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
