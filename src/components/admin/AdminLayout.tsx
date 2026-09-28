import { ReactNode } from "react";
import { Link, NavLink, Navigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Bot, Settings, Store, LogOut, Loader2 } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/admin/produtos", icon: Package, label: "Produtos" },
  { to: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { to: "/admin/agentes", icon: Bot, label: "Agentes" },
  { to: "/admin/config", icon: Settings, label: "Config" },
];

export function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { company, companies, loading, select } = useCompany();
  const { signOut } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!company) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-2 mb-6">
          <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center"><Store className="w-5 h-5 text-primary-foreground" /></div>
          <span className="font-display font-bold text-xl">Vendora</span>
        </Link>
        {companies.length > 1 ? (
          <select value={company.id} onChange={(e) => select(e.target.value)} className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm">
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : <p className="px-2 mb-4 text-sm text-muted-foreground truncate">{company.name}</p>}
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <n.icon className="w-4 h-4" />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <a href={`/loja/${company.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"><Store className="w-4 h-4" />Ver loja</a>
          <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 glass border-b border-border px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
          <h1 className="font-display text-lg lg:text-2xl font-bold truncate">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <div className="px-4 lg:px-8 py-6">{children}</div>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border h-16 flex items-center justify-around">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn("flex flex-col items-center gap-1 text-[10px] px-2", isActive ? "text-primary" : "text-muted-foreground")}>
            <n.icon className="w-5 h-5" />{n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
