import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEntitlement } from "@/hooks/useEntitlement";
import { routeAllowed } from "@/lib/planAccess";
import { Button } from "@/components/ui/button";

export function PlanRoute({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useEntitlement();
  const { pathname } = useLocation();
  if (isLoading) return <p role="status" className="p-6">A verificar plano…</p>;
  if (error || !routeAllowed(pathname, data ?? null)) return <main className="min-h-screen bg-background text-foreground p-6 space-y-4"><h1 className="font-serif text-2xl">Recurso indisponível no plano atual</h1><Button asChild><Link to="/admin/config">Ver subscrição</Link></Button></main>;
  return children;
}