import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Box,
  History,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProductStock = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  stock: number;
  active: boolean;
};

type InventoryMovement = {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  product_name?: string;
};

const LOW_STOCK_THRESHOLD = 5;

export default function Inventory() {
  const { company } = useCompany();

  const [products, setProducts] = useState<ProductStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [adjustReason, setAdjustReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!company) return;

    setLoading(true);

    const [productsRes, movementsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, category, stock, active")
        .eq("company_id", company.id)
        .order("stock", { ascending: true }),

      supabase
        .from("inventory_movements")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (productsRes.error) {
      toast.error("Não foi possível carregar os produtos.");
    } else {
      setProducts((productsRes.data as ProductStock[]) ?? []);
    }

    if (!movementsRes.error && movementsRes.data) {
      const pMap = new Map((productsRes.data as ProductStock[])?.map((p) => [p.id, p.name]));
      const list = (movementsRes.data as InventoryMovement[]).map((m) => ({
        ...m,
        product_name: pMap.get(m.product_id) ?? "Produto",
      }));
      setMovements(list);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const totalOnHand = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;

    return {
      totalProducts: products.length,
      totalOnHand,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((p) => {
      if (stockFilter === "low" && !(p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)) {
        return false;
      }
      if (stockFilter === "out" && p.stock > 0) {
        return false;
      }

      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [products, query, stockFilter]);

  const handleAdjustStock = async () => {
    if (!selectedProduct || !company) return;

    const qtyNum = parseInt(adjustQty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Indique uma quantidade válida.");
      return;
    }

    const newStock =
      adjustType === "in"
        ? selectedProduct.stock + qtyNum
        : Math.max(0, selectedProduct.stock - qtyNum);

    setSaving(true);

    // Update stock in products
    const { error: pError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (pError) {
      toast.error(pError.message);
      setSaving(false);
      return;
    }

    // Log movement in inventory_movements
    await supabase.from("inventory_movements").insert({
      company_id: company.id,
      product_id: selectedProduct.id,
      type: adjustType,
      quantity: qtyNum,
      reason: adjustReason.trim() || (adjustType === "in" ? "Entrada manual" : "Ajuste manual"),
    });

    setSaving(false);
    toast.success("Stock atualizado com sucesso.");
    setAdjustModalOpen(false);
    setSelectedProduct(null);
    setAdjustQty("");
    setAdjustReason("");
    await loadData();
  };

  if (!company) {
    return (
      <AdminLayout title="Inventário">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Inventário">
      <div className="space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Gestão de Stock
            </p>

            <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
              Inventário
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Controle o stock disponível, limites mínimos e movimentações do seu catálogo.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-4 text-sm font-medium transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </section>

        {/* METRICS */}
        <section className="grid border-y border-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total de Unidades"
            value={String(stats.totalOnHand)}
            icon={Box}
            loading={loading}
          />

          <MetricCard
            label="Produtos no Catálogo"
            value={String(stats.totalProducts)}
            icon={PackageCheck}
            loading={loading}
          />

          <MetricCard
            label="Stock Baixo (≤5)"
            value={String(stats.lowStockCount)}
            warning={stats.lowStockCount > 0}
            icon={AlertTriangle}
            loading={loading}
          />

          <MetricCard
            label="Esgotados"
            value={String(stats.outOfStockCount)}
            danger={stats.outOfStockCount > 0}
            icon={PackageX}
            loading={loading}
          />
        </section>

        {/* FILTERS & SEARCH */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar produto ou SKU..."
              className="h-11 w-full rounded-sm border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "all" ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200"
              )}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("low")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "low" ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200"
              )}
            >
              Stock Baixo ({stats.lowStockCount})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("out")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "out" ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200"
              )}
            >
              Esgotados ({stats.outOfStockCount})
            </button>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* STOCK TABLE */}
          <section className="border-y border-neutral-200 bg-white">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-full animate-pulse bg-neutral-100" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Box className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-3 text-sm font-semibold text-neutral-900">Nenhum produto encontrado</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    <th className="px-5 py-3.5">Produto</th>
                    <th className="px-5 py-3.5">SKU</th>
                    <th className="px-5 py-3.5 text-center">Stock Atual</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-950">{p.name}</p>
                        <p className="text-xs text-neutral-400">{p.category || "Sem categoria"}</p>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-neutral-500">
                        {p.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full",
                            p.stock <= 0
                              ? "bg-red-100 text-red-800"
                              : p.stock <= LOW_STOCK_THRESHOLD
                              ? "bg-amber-100 text-amber-800"
                              : "bg-neutral-100 text-neutral-800"
                          )}
                        >
                          {p.stock} {p.stock === 1 ? "unidade" : "unidades"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* MOVEMENTS LOG */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <History className="h-4 w-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-950">Atividade de Inventário</h3>
            </div>

            <div className="border border-neutral-200 bg-white divide-y divide-neutral-100">
              {movements.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">
                  Nenhuma movimentação registada ainda.
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-950">{m.product_name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono font-semibold",
                          m.type === "in" ? "text-emerald-700" : "text-neutral-700"
                        )}
                      >
                        {m.type === "in" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {m.type === "in" ? "+" : "-"}{m.quantity}
                      </span>
                    </div>
                    <p className="mt-1 text-neutral-500">{m.reason || "Movimentação manual"}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {new Intl.DateTimeFormat("pt-PT", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(m.created_at))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-950">Ajustar Stock</h3>
                <p className="text-xs text-neutral-400">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("in")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 text-xs font-semibold border",
                    adjustType === "in" ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200"
                  )}
                >
                  <Plus className="h-4 w-4" /> Entrada (+Stock)
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType("out")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 text-xs font-semibold border",
                    adjustType === "out" ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-200"
                  )}
                >
                  <Minus className="h-4 w-4" /> Saída (-Stock)
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Ex: 10"
                  className="h-10 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Motivo do Ajuste</label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Recebimento de fornecedor, contagem..."
                  className="h-10 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="h-10 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdjustStock}
                disabled={saving}
                className="h-10 bg-black px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "A atualizar..." : "Confirmar Ajuste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function MetricCard({
  label,
  value,
  warning,
  danger,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  warning?: boolean;
  danger?: boolean;
  icon: typeof Box;
  loading: boolean;
}) {
  return (
    <div className="border-b border-neutral-200 px-5 py-5 sm:border-r last:border-r-0 lg:border-b-0">
      <div className="flex items-center justify-between text-neutral-400">
        <p className="text-xs font-medium uppercase tracking-[0.12em]">{label}</p>
        <Icon className={cn("h-4 w-4", warning && "text-amber-600", danger && "text-red-600")} />
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-20 animate-pulse bg-neutral-100" />
      ) : (
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            warning && "text-amber-700",
            danger && "text-red-700",
            !warning && !danger && "text-neutral-950"
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
