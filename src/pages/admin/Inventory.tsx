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
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, LoadingState } from "@/components/ui/data-state";
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
  const [productsError, setProductsError] = useState<string | null>(null);
  const [movementsError, setMovementsError] = useState<string | null>(null);
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
    setProductsError(null);
    setMovementsError(null);

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
      setProductsError(productsRes.error.message || "Não foi possível carregar os produtos.");
      setProducts([]);
    } else {
      setProductsError(null);
      setProducts((productsRes.data as ProductStock[]) ?? []);
    }

    if (movementsRes.error) {
      setMovementsError(movementsRes.error.message || "Não foi possível carregar a atividade.");
      setMovements([]);
    } else if (movementsRes.data) {
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

  const closeAdjustModal = () => {
    setAdjustModalOpen(false);
    setSelectedProduct(null);
    setAdjustQty("");
    setAdjustType("in");
    setAdjustReason("");
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !company) return;

    const qtyNum = Number(adjustQty);
    if (!adjustQty.trim() || !Number.isInteger(qtyNum) || qtyNum <= 0) {
      toast.error("Indique uma quantidade válida.");
      return;
    }

    if (adjustType === "out" && qtyNum > selectedProduct.stock) {
      toast.error("A saída não pode ser maior que o stock atual.");
      return;
    }

    const newStock =
      adjustType === "in"
        ? selectedProduct.stock + qtyNum
        : selectedProduct.stock - qtyNum;

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
    const { error: movementError } = await supabase.from("inventory_movements").insert({
      company_id: company.id,
      product_id: selectedProduct.id,
      type: adjustType,
      quantity: qtyNum,
      reason: adjustReason.trim() || (adjustType === "in" ? "Entrada manual" : "Ajuste manual"),
    });

    setSaving(false);
    if (movementError) {
      toast.error("O stock foi atualizado, mas o movimento não foi registado. O histórico pode estar incompleto.");
      closeAdjustModal();
      await loadData();
      return;
    }
    toast.success("Stock e movimento atualizados com sucesso.");
    closeAdjustModal();
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
        {(productsError || movementsError) && (
          <div className="flex flex-col gap-3 rounded-xl bg-[#fff4ed] px-4 py-4 text-sm text-[#7b3f24] shadow-sm ring-1 ring-[#f0c7ad] sm:flex-row sm:items-center sm:justify-between">
            <p>Não foi possível carregar todos os dados do inventário. Os valores em falta não são apresentados como zero.</p>
            <button type="button" onClick={loadData} className="min-h-10 shrink-0 bg-[#202522] px-4 text-sm font-semibold text-white hover:bg-neutral-800">Tentar novamente</button>
          </div>
        )}
        <PageHeader eyebrow="Gestão de stock" title="Inventário" description="Controle o stock disponível, limites mínimos e movimentações do seu catálogo." actions={<button
            type="button"
            onClick={loadData}
            className="inline-flex min-h-10 items-center gap-2 border border-[#ded9d0] bg-[#fffdf9] px-4 text-sm font-medium transition hover:border-neutral-400 hover:bg-[#f1eee7]"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>} />

        {/* METRICS */}
        <section className="grid border-y border-[#ded9d0] sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total de Unidades"
            value={productsError ? "—" : String(stats.totalOnHand)}
            icon={Box}
            loading={loading}
          />

          <MetricCard
            label="Produtos no Catálogo"
            value={productsError ? "—" : String(stats.totalProducts)}
            icon={PackageCheck}
            loading={loading}
          />

          <MetricCard
            label="Stock Baixo (≤5)"
            value={productsError ? "—" : String(stats.lowStockCount)}
            warning={stats.lowStockCount > 0}
            icon={AlertTriangle}
            loading={loading}
          />

          <MetricCard
            label="Esgotados"
            value={productsError ? "—" : String(stats.outOfStockCount)}
            danger={stats.outOfStockCount > 0}
            icon={PackageX}
            loading={loading}
          />
        </section>

        {/* FILTERS & SEARCH */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a7aaa2]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar produto ou SKU..."
              className="h-11 w-full rounded-sm border border-[#ded9d0] bg-[#fffdf9] pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "all" ? "bg-black text-white border-black" : "bg-[#fffdf9] text-[#5f625d] border-[#ded9d0]"
              )}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("low")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "low" ? "bg-black text-white border-black" : "bg-[#fffdf9] text-[#5f625d] border-[#ded9d0]"
              )}
            >
              Stock Baixo ({productsError ? "—" : stats.lowStockCount})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("out")}
              className={cn(
                "h-11 px-4 text-xs font-semibold transition border",
                stockFilter === "out" ? "bg-black text-white border-black" : "bg-[#fffdf9] text-[#5f625d] border-[#ded9d0]"
              )}
            >
              Esgotados ({productsError ? "—" : stats.outOfStockCount})
            </button>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* STOCK TABLE */}
          <section className="rounded-xl bg-[#fffdf9] shadow-sm ring-1 ring-[#ebe7df]">
            {loading ? (
              <LoadingState label="A carregar inventário" className="border-0" />
            ) : productsError ? (
              <div className="p-8 text-sm text-[#7b3f24]">
                <p>Os produtos do inventário não estão disponíveis.</p>
                <button type="button" onClick={loadData} className="mt-3 min-h-10 bg-[#202522] px-4 text-sm font-semibold text-white hover:bg-neutral-800">
                  Tentar novamente
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState title={query || stockFilter !== "all" ? "Nenhum produto corresponde aos filtros" : "O inventário está vazio"} description={query || stockFilter !== "all" ? "Altere a pesquisa ou o filtro para ver outros produtos." : "Adicione produtos ao catálogo para começar a controlar o stock."} className="border-0" />
            ) : (
              <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ded9d0] bg-[#f1eee7]/50 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7aaa2]">
                    <th className="px-5 py-3.5">Produto</th>
                    <th className="px-5 py-3.5">SKU</th>
                    <th className="px-5 py-3.5 text-center">Stock Atual</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f1eee7]">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#202522]">{p.name}</p>
                        <p className="text-xs text-[#a7aaa2]">{p.category || "Sem categoria"}</p>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-[#747b73]">
                        {p.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-[7px]",
                            p.stock <= 0
                              ? "bg-red-100 text-red-800"
                              : p.stock <= LOW_STOCK_THRESHOLD
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#ebe7df] text-[#303732]"
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
                          className="inline-flex items-center gap-1.5 border border-[#ded9d0] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#303732] transition hover:bg-[#f1eee7]"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            {!loading && !productsError && (
              <div className="space-y-3 p-3 md:hidden">
                {filteredProducts.length === 0 ? (
                  <EmptyState title={query || stockFilter !== "all" ? "Nenhum produto corresponde aos filtros" : "O inventário está vazio"} description={query || stockFilter !== "all" ? "Altere a pesquisa ou o filtro para ver outros produtos." : "Adicione produtos ao catálogo para começar a controlar o stock."} className="border-0" />
                ) : filteredProducts.map((p) => (
                  <article key={p.id} className="rounded-xl bg-[#fffdf9] p-4 shadow-sm ring-1 ring-[#ebe7df]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#202522]">{p.name}</p><p className="mt-1 truncate text-xs text-[#a7aaa2]">{p.sku || "Sem SKU"} · {p.category || "Sem categoria"}</p></div>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", p.stock <= 0 ? "bg-red-100 text-red-800" : p.stock <= LOW_STOCK_THRESHOLD ? "bg-amber-100 text-amber-800" : "bg-[#ebe7df] text-[#303732]")}>{p.stock} {p.stock === 1 ? "unidade" : "unidades"}</span>
                    </div>
                    <button type="button" onClick={() => { setSelectedProduct(p); setAdjustModalOpen(true); }} className="mt-4 min-h-10 w-full rounded-md bg-[#202522] px-3 text-xs font-semibold text-white hover:bg-neutral-800">Ajustar stock</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* MOVEMENTS LOG */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#ded9d0] pb-3">
              <History className="h-4 w-4 text-[#747b73]" />
              <h3 className="text-sm font-semibold text-[#202522]">Atividade de Inventário</h3>
            </div>

            <div className="space-y-2 rounded-xl bg-[#fffdf9] shadow-sm ring-1 ring-[#ebe7df]">
              {loading ? (
                <div className="p-6 text-center text-xs text-[#a7aaa2]">A carregar atividade…</div>
              ) : movementsError ? (
                <div className="p-6 text-center text-xs text-[#7b3f24]">Não foi possível carregar a atividade. <button type="button" onClick={loadData} className="font-semibold underline">Tentar novamente</button></div>
              ) : movements.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#a7aaa2]">
                  Nenhuma movimentação registada ainda.
                </div>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="rounded-xl bg-[#f8f6f1] p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#202522]">{m.product_name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono font-semibold",
                          m.type === "in" ? "text-emerald-700" : "text-[#5f625d]"
                        )}
                      >
                        {m.type === "in" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {m.type === "in" ? "+" : "-"}{m.quantity}
                      </span>
                    </div>
                    <p className="mt-1 text-[#747b73]">{m.reason || "Movimentação manual"}</p>
                    <p className="mt-0.5 text-[10px] text-[#a7aaa2]">
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
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 px-4 py-4" role="dialog" aria-modal="true" aria-labelledby="adjust-stock-title">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-[#fffdf9] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ded9d0] pb-4">
              <div>
                <h3 id="adjust-stock-title" className="text-base font-semibold text-[#202522]">Ajustar Stock</h3>
                <p className="text-xs text-[#a7aaa2]">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={closeAdjustModal}
                aria-label="Fechar ajuste"
                className="grid h-10 w-10 place-items-center text-[#a7aaa2] hover:bg-[#ebe7df] hover:text-[#202522]"
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
                    adjustType === "in" ? "bg-black text-white border-black" : "bg-[#fffdf9] text-[#5f625d] border-[#ded9d0]"
                  )}
                >
                  <Plus className="h-4 w-4" /> Entrada (+Stock)
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType("out")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 text-xs font-semibold border",
                    adjustType === "out" ? "bg-black text-white border-black" : "bg-[#fffdf9] text-[#5f625d] border-[#ded9d0]"
                  )}
                >
                  <Minus className="h-4 w-4" /> Saída (-Stock)
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f625d]">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Ex: 10"
                  className="min-h-11 w-full border border-[#c9c3b8] px-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f625d]">Motivo do Ajuste</label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Recebimento de fornecedor, contagem..."
                  className="min-h-11 w-full border border-[#c9c3b8] px-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAdjustModal}
                className="h-10 px-4 text-sm font-medium text-[#747b73] hover:bg-[#ebe7df]"
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
    <div className="border-b border-[#ded9d0] px-5 py-5 sm:border-r last:border-r-0 lg:border-b-0">
      <div className="flex items-center justify-between text-[#a7aaa2]">
        <p className="text-xs font-medium uppercase tracking-[0.12em]">{label}</p>
        <Icon className={cn("h-4 w-4", warning && "text-amber-600", danger && "text-red-600")} />
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-20 animate-pulse bg-[#ebe7df]" />
      ) : (
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            warning && "text-amber-700",
            danger && "text-red-700",
            !warning && !danger && "text-[#202522]"
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
