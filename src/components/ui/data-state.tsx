import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateShellProps = { className?: string; children?: ReactNode };

function StateShell({ className, children }: StateShellProps) {
  return <div className={cn("grid min-h-[220px] place-items-center border-y border-[#ded9d0] px-6 py-12 text-center", className)}>{children}</div>;
}

export function LoadingState({ label = "A carregar", className }: { label?: string; className?: string }) {
  return <StateShell className={className}><div className="flex items-center gap-2 text-sm text-[#747b73]" role="status" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin text-[#2c6457]" />{label}<span className="sr-only">. Aguarde.</span></div></StateShell>;
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return <StateShell className={className}><div className="max-w-sm"><div className="mx-auto grid h-10 w-10 place-items-center border border-[#ded9d0] bg-[#f1eee7] text-[#747b73]"><Inbox className="h-4 w-4" /></div><h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#202522]">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-[#747b73]">{description}</p>}{action && <div className="mt-5 flex justify-center">{action}</div>}</div></StateShell>;
}

export function ErrorState({ title = "Não foi possível carregar", description = "Verifique a ligação e tente novamente.", onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return <StateShell className={className}><div className="max-w-sm"><div className="mx-auto grid h-10 w-10 place-items-center border border-[#e3b9ad] bg-[#f5e7e2] text-[#b94e37]"><AlertCircle className="h-4 w-4" /></div><h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#202522]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#747b73]">{description}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-5 inline-flex h-9 items-center border border-[#ded9d0] bg-[#fffdf9] px-3 text-xs font-semibold text-[#202522] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]">Tentar novamente</button>}</div></StateShell>;
}
