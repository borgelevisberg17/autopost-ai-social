import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateShellProps = { className?: string; children?: ReactNode };

function StateShell({ className, children }: StateShellProps) {
  return <div className={cn("grid min-h-[220px] place-items-center border-y border-slate-200/80 bg-white/50 px-6 py-12 text-center", className)}>{children}</div>;
}

export function LoadingState({ label = "A carregar", className }: { label?: string; className?: string }) {
  return <StateShell className={className}><div className="flex items-center gap-2 text-sm text-slate-500" role="status" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin text-emerald-600" />{label}<span className="sr-only">. Aguarde.</span></div></StateShell>;
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return <StateShell className={className}><div className="max-w-sm"><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-400 shadow-xs"><Inbox className="h-4 w-4" /></div><h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}{action && <div className="mt-5 flex justify-center">{action}</div>}</div></StateShell>;
}

export function ErrorState({ title = "Não foi possível carregar", description = "Verifique a ligação e tente novamente.", onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return <StateShell className={className}><div className="max-w-sm"><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-xs"><AlertCircle className="h-4 w-4" /></div><h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-5 inline-flex h-9 items-center rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Tentar novamente</button>}</div></StateShell>;
}
