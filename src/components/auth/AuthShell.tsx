import { ReactNode } from "react";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type AuthShellProps = { children: ReactNode; eyebrow?: string; title?: string; description?: string; footer?: ReactNode; compact?: boolean; };
const highlights = ["Catálogo e stock num só lugar", "Pedidos de todos os canais", "Automação com controlo humano"];

export function AuthShell({ children, eyebrow = "VENDA · OPERAÇÃO · CRESCIMENTO", title = "A operação da sua loja, num só lugar.", description = "Catálogo, pedidos, canais e automação conectados à realidade do seu negócio.", footer, compact = false }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f3ed] text-[#202522]">
      <div className="min-h-screen lg:grid lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <section className="relative hidden overflow-hidden bg-[#202522] text-[#f6f3ed] lg:flex">
          <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-white/10" />
          <div className="pointer-events-none absolute bottom-16 right-16 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative z-10 flex min-h-screen w-full flex-col p-10 xl:p-14">
            <Link to="/" className="inline-flex w-fit items-center gap-2 text-[#f6f3ed] transition-opacity hover:opacity-70">
              <span className="grid h-9 w-9 place-items-center rounded-[7px] border border-white/20 bg-[#e36c3f] text-white"><Circle className="h-3.5 w-3.5 fill-current" /></span>
              <span className="text-[18px] font-bold tracking-[-0.04em]">Vendora</span>
            </Link>
            <div className="my-auto max-w-[500px] pb-10">
              <p className="mb-6 font-mono text-[11px] font-medium tracking-[0.18em] text-[#e36c3f]">{eyebrow}</p>
              <h2 className="max-w-[490px] text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] xl:text-[58px]">{title}</h2>
              <p className="mt-7 max-w-[430px] text-[16px] leading-7 text-white/60">{description}</p>
              <div className="mt-10 space-y-3">{highlights.map((item) => <div key={item} className="flex items-center gap-3 text-[13px] text-white/70"><Check className="h-4 w-4 text-[#e36c3f]" />{item}</div>)}</div>
              <div className="mt-8 max-w-[430px] border border-white/10 bg-white/5 p-2"><img src="/media/optimized/operations-audit.webp" alt="Vendora operations view with channel status and audit activity" loading="lazy" className="aspect-[16/9] w-full object-cover opacity-90" /><div className="flex items-center justify-between px-2 pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40"><span>Operations preview</span><span className="text-[#e36c3f]">Live context</span></div></div>
            </div>
            <div className="flex items-end justify-between border-t border-white/10 pt-5 text-[11px] text-white/40"><span>Commerce operations, made legible.</span><span className="flex items-center gap-1">Luanda <ArrowUpRight className="h-3 w-3" /></span></div>
          </div>
        </section>
        <section className="relative flex min-h-screen flex-col bg-[#fffdf9]">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7"><Link to="/" className="flex items-center gap-2 text-[#202522] lg:hidden"><span className="grid h-8 w-8 place-items-center rounded-[7px] bg-[#202522] text-[#f6f3ed]"><Circle className="h-3 w-3 fill-current" /></span><span className="font-bold tracking-[-0.04em]">Vendora</span></Link><div className="ml-auto">{footer}</div></header>
          <div className={cn("mx-auto flex w-full max-w-[470px] flex-1 flex-col justify-center px-5 pb-12 sm:px-8 lg:px-12", compact ? "py-10" : "py-8")}>{children}</div>
          <div className="px-5 pb-5 text-center font-mono text-[10px] text-[#9a968d] sm:px-8 lg:px-12 lg:pb-7">© {new Date().getFullYear()} Vendora</div>
        </section>
      </div>
    </main>
  );
}
