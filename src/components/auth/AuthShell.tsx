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
    <main className="min-h-[100svh] bg-[#f6f3ed] text-[#202522]">
      <div className="mx-auto flex min-h-[100svh] max-w-[1440px] flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <header className="flex min-h-11 items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Vendora — página inicial"
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-75"
          >
            <BrandMark className="h-8 w-8" />
            <span className="font-serif text-[22px] font-medium tracking-[-0.05em]">
              Vendora
            </span>
          </Link>
          <div className="shrink-0 text-right">{footer}</div>
        </header>

        <div className="my-4 flex flex-1 items-center sm:my-6 lg:my-8">
          <div className="mx-auto grid w-full max-w-[1080px] overflow-hidden border border-[#e2ded5] bg-[#fffdf9] lg:min-h-[600px] lg:grid-cols-[0.88fr_1.12fr]">
            <aside className="relative hidden overflow-hidden bg-[#202522] text-[#f6f3ed] lg:flex">
              <img
                src="/media/optimized/auth-human-commerce.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101512]/80 via-[#101512]/35 to-[#101512]/15" />
              <div className="relative z-10 flex min-h-[600px] w-full items-end p-10 xl:p-14">
                <div className="max-w-sm">
                  <span className="mb-5 block h-px w-9 bg-[#e36c3f]" />
                  <h2 className="font-serif text-[35px] font-medium leading-[1.02] tracking-[-0.04em] xl:text-[42px]">
                    Comércio, em sintonia.
                  </h2>
                </div>
              </div>
            </aside>

            <section className="flex min-h-[calc(100svh-132px)] items-center justify-center bg-[#fffdf9] px-5 py-9 sm:px-10 lg:min-h-[600px] lg:px-12 xl:px-16">
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
