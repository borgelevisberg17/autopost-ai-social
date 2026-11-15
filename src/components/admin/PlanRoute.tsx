import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEntitlement } from "@/hooks/useEntitlement";
import { routeAllowed } from "@/lib/planAccess";
import { Button } from "@/components/ui/button";

export function PlanRoute({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useEntitlement();
  const { pathname } = useLocation();
  if (isLoading) return <p role="status" className="p-6">A verificar plano…</p>;
  if (error || !routeAllowed(pathname, data ?? null)) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Recurso indisponível no plano atual</h1>
        <p className="mt-2 text-sm text-slate-500">Faça upgrade ao plano da sua loja para aceder a esta funcionalidade.</p>
        <div className="mt-6">
          <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs">
            <Link to="/admin/config">Ver subscrição</Link>
          </Button>
        </div>
      </div>
    </main>
  );
  return children;
}