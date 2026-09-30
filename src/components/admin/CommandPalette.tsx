import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Box,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

type SearchResult = {
  id: string;
  type: "product" | "order" | "customer" | "nav";
  title: string;
  subtitle: string;
  url: string;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { company } = useCompany();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !company) return;

    const navShortcuts: SearchResult[] = [
      {
        id: "nav-dash",
        type: "nav",
        title: "Visão Geral",
        subtitle: "Navegação",
        url: "/dashboard",
      },
      {
        id: "nav-prod",
        type: "nav",
        title: "Produtos",
        subtitle: "Navegação",
        url: "/admin/produtos",
      },
      {
        id: "nav-inv",
        type: "nav",
        title: "Inventário",
        subtitle: "Navegação",
        url: "/admin/inventario",
      },
      {
        id: "nav-ord",
        type: "nav",
        title: "Pedidos",
        subtitle: "Navegação",
        url: "/admin/pedidos",
      },
      {
        id: "nav-cust",
        type: "nav",
        title: "Clientes",
        subtitle: "Navegação",
        url: "/admin/clientes",
      },
      {
        id: "nav-ag",
        type: "nav",
        title: "Agentes",
        subtitle: "Navegação",
        url: "/admin/agentes",
      },
      {
        id: "nav-appr",
        type: "nav",
        title: "Central de Aprovações",
        subtitle: "Navegação",
        url: "/admin/aprovacoes",
      },
      {
        id: "nav-analytics",
        type: "nav",
        title: "Analytics",
        subtitle: "Navegação",
        url: "/admin/analytics",
      },
      {
        id: "nav-[#nav-config]",
        type: "nav",
        title: "Configurações",
        subtitle: "Navegação",
        url: "/admin/config",
      },
    ];

    if (!query.trim()) {
      setResults(navShortcuts);
      return;
    }

    async function performSearch() {
      setLoading(true);
      const q = query.trim().toLowerCase();

      // Search products, orders, customers
      const [pRes, oRes, cRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, sku")
          .eq("company_id", company.id)
          .ilike("name", `%${q}%`)
          .limit(4),

        supabase
          .from("orders")
          .select("id, customer_name, total")
          .eq("company_id", company.id)
          .ilike("customer_name", `%${q}%`)
          .limit(4),

        supabase
          .from("customers")
          .select("id, name, phone, email")
          .eq("company_id", company.id)
          .ilike("name", `%${q}%`)
          .limit(4),
      ]);

      const items: SearchResult[] = [];

      // Filtered Nav
      const matchedNav = navShortcuts.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.url.toLowerCase().includes(q),
      );
      items.push(...matchedNav);

      if (pRes.data) {
        pRes.data.forEach((p) => {
          items.push({
            id: p.id,
            type: "product",
            title: p.name,
            subtitle: p.sku ? `SKU: ${p.sku}` : "Produto",
            url: "/admin/produtos",
          });
        });
      }

      if (oRes.data) {
        oRes.data.forEach((o) => {
          items.push({
            id: o.id,
            type: "order",
            title: `Pedido #${o.id.slice(0, 8).toUpperCase()}`,
            subtitle: `Cliente: ${o.customer_name}`,
            url: "/admin/pedidos",
          });
        });
      }

      if (cRes.data) {
        cRes.data.forEach((c) => {
          items.push({
            id: c.id,
            type: "customer",
            title: c.name,
            subtitle: c.email || c.phone || "Cliente",
            url: "/admin/clientes",
          });
        });
      }

      setResults(items);
      setLoading(false);
    }

    performSearch();
  }, [query, open, company]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-[100] grid place-items-start justify-center bg-[#202522]/35 px-4 pt-[12vh] backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisa global"
        className="w-full max-w-2xl overflow-hidden rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] shadow-[0_24px_80px_rgba(32,37,34,0.2)]"
      >
        <div className="flex items-center border-b border-[#e9e5dc] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#687168]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar em Vendora (produtos, pedidos, clientes, navegar...)"
            className="h-14 w-full bg-transparent px-3 text-sm text-[#202522] outline-none placeholder:text-[#9a9e96]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pesquisa"
            className="grid h-8 w-8 place-items-center text-[#858c83] transition hover:bg-[#f1eee7] hover:text-[#202522]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(56vh,460px)] overflow-y-auto p-2">
          {loading ? (
            <p className="p-4 text-center text-xs text-neutral-400">
              A pesquisar...
            </p>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-xs text-neutral-400">
              Nenhum resultado para "{query}"
            </p>
          ) : (
            <div className="space-y-0.5">
              {results.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  type="button"
                  onClick={() => {
                    navigate(res.url);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-[3px] px-3 py-3 text-left transition hover:bg-[#f0f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6457]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-[3px] bg-[#e9eee9] text-[#526755]">
                      {res.type === "product" && (
                        <Package className="h-3.5 w-3.5" />
                      )}
                      {res.type === "order" && (
                        <ShoppingBag className="h-3.5 w-3.5" />
                      )}
                      {res.type === "customer" && (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      {res.type === "nav" && (
                        <LayoutDashboard className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#202522]">
                        {res.title}
                      </p>
                      <p className="text-[11px] text-[#858c83]">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#858c83]">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#e9e5dc] bg-[#faf9f4] px-4 py-2.5 text-[10px] text-[#858c83]">
          <span>
            Dica: Use <strong>⌘ K</strong> para abrir/fechar
          </span>
          <span>Vendora Commerce OS</span>
        </div>
      </div>
    </div>
  );
}
