import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  ImageOff,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  price: number;
  promo_price: number | null;
  stock: number;
  images: string[];
  active: boolean;
};

type Filter =
  | "all"
  | "active"
  | "out"
  | "low"
  | "promo";

type FormState = {
  name: string;
  description: string;
  sku: string;
  category: string;
  price: string;
  promo_price: string;
  stock: string;
  images: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  sku: "",
  category: "",
  price: "",
  promo_price: "",
  stock: "0",
  images: "",
  active: true,
};

const LOW_STOCK_LIMIT = 5;

function formatStock(stock: number) {
  return `${stock} ${stock === 1 ? "unidade" : "unidades"}`;
}

function discountPercent(product: Product) {
  if (
    product.promo_price == null ||
    Number(product.price) <= 0 ||
    product.promo_price >= product.price
  ) {
    return null;
  }

  return Math.round(
    ((Number(product.price) - Number(product.promo_price)) /
      Number(product.price)) *
      100,
  );
}

function productPrice(product: Product) {
  return Number(product.promo_price ?? product.price);
}

function stockState(product: Product) {
  if (product.stock <= 0) {
    return {
      label: "Sem stock",
      className: "text-rose-600 font-semibold",
    };
  }

  if (product.stock <= LOW_STOCK_LIMIT) {
    return {
      label: "Stock baixo",
      className: "text-amber-600 font-medium",
    };
  }

  return {
    label: "Disponível",
    className: "text-emerald-700 font-medium",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Products() {
  const { company } = useCompany();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [menuProduct, setMenuProduct] = useState<string | null>(
    null,
  );

  const [deleteProduct, setDeleteProduct] =
    useState<Product | null>(null);

  const load = async () => {
    if (!company) return;

    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,company_id,name,description,sku,category,price,promo_price,stock,images,active",
      )
      .eq("company_id", company.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setLoadError(error.message || "Não foi possível carregar os produtos.");
      setItems([]);
    } else {
      setLoadError(null);
      setItems((data as Product[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((product) => product.category?.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) =>
      String(a).localeCompare(String(b), "pt"),
    ) as string[];
  }, [items]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((product) => product.active).length,
      out: items.filter((product) => product.stock <= 0).length,
      low: items.filter(
        (product) =>
          product.stock > 0 &&
          product.stock <= LOW_STOCK_LIMIT,
      ).length,
      promo: items.filter(
        (product) =>
          product.promo_price != null &&
          Number(product.promo_price) < Number(product.price),
      ).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    return items.filter((product) => {
      if (filter === "active" && !product.active) {
        return false;
      }

      if (filter === "out" && product.stock > 0) {
        return false;
      }

      if (
        filter === "low" &&
        !(
          product.stock > 0 &&
          product.stock <= LOW_STOCK_LIMIT
        )
      ) {
        return false;
      }

      if (
        filter === "promo" &&
        !(
          product.promo_price != null &&
          Number(product.promo_price) < Number(product.price)
        )
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        product.category !== categoryFilter
      ) {
        return false;
      }

      if (!value) {
        return true;
      }

      return [
        product.name,
        product.sku,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value),
        );
    });
  }, [
    items,
    query,
    filter,
    categoryFilter,
  ]);

  const selectedProducts = useMemo(
    () =>
      filtered.filter((product) => selectedIds.includes(product.id)),
    [filtered, selectedIds],
  );

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((product) =>
      selectedIds.includes(product.id),
    );

  const setFormValue = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);

    setForm({
      name: product.name,
      description: product.description ?? "",
      sku: product.sku ?? "",
      category: product.category ?? "",
      price: String(product.price),
      promo_price:
        product.promo_price != null
          ? String(product.promo_price)
          : "",
      stock: String(product.stock),
      images: product.images.join("\n"),
      active: product.active,
    });

    setMenuProduct(null);
    setEditorOpen(true);
  };

  const save = async () => {
    if (!company) return;

    const name = form.name.trim();
    const price = Number(form.price);
    const promo = form.promo_price.trim()
      ? Number(form.promo_price)
      : null;
    const stock = Number(form.stock);

    if (!name) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Indique um preço válido.");
      return;
    }

    if (
      promo !== null &&
      (!Number.isFinite(promo) ||
        promo < 0 ||
        promo >= price)
    ) {
      toast.error(
        "O preço promocional deve ser menor que o preço normal.",
      );
      return;
    }

    if (
      !Number.isFinite(stock) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      toast.error("O stock deve ser um número inteiro válido.");
      return;
    }

    const images = form.images
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => /^https:\/\//i.test(value))
      .slice(0, 8);

    const row = {
      company_id: company.id,
      name,
      description: form.description.trim() || null,
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      price,
      promo_price: promo,
      stock,
      images,
      active: form.active,
    };

    setSaving(true);

    const result = editing
      ? await supabase
          .from("products")
          .update(row)
          .eq("id", editing.id)
          .eq("company_id", company.id)
      : await supabase
          .from("products")
          .insert(row);

    setSaving(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(
      editing
        ? "Produto atualizado."
        : "Produto criado.",
    );

    setEditorOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);

    await load();
  };

  const toggleProduct = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({
        active: !product.active,
      })
      .eq("id", product.id)
      .eq("company_id", company?.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );

    setMenuProduct(null);

    toast.success(
      product.active
        ? "Produto ocultado da loja."
        : "Produto publicado na loja.",
    );
  };

  const updateStock = async (
    product: Product,
    nextStock: number,
  ) => {
    if (nextStock < 0) return;

    const { error } = await supabase
      .from("products")
      .update({
        stock: nextStock,
      })
      .eq("id", product.id)
      .eq("company_id", company?.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              stock: nextStock,
            }
          : item,
      ),
    );

    toast.success("Stock atualizado.");
  };

  const remove = async () => {
    if (!deleteProduct) return;

    const product = deleteProduct;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .eq("company_id", company?.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== product.id),
    );

    setSelectedIds((current) =>
      current.filter((id) => id !== product.id),
    );

    setDeleteProduct(null);

    toast.success("Produto removido.");
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filtered.some(
              (product) => product.id === id,
            ),
        ),
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filtered.map((product) => product.id),
      ]),
    ]);
  };

  const bulkSetActive = async (active: boolean) => {
    if (!selectedProducts.length) return;

    const ids = selectedProducts.map(
      (product) => product.id,
    );

    const { error } = await supabase
      .from("products")
      .update({ active })
      .in("id", ids)
      .eq("company_id", company?.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setItems((current) =>
      current.map((product) =>
        ids.includes(product.id)
          ? {
              ...product,
              active,
            }
          : product,
      ),
    );

    setSelectedIds([]);

    toast.success(
      `${ids.length} ${
        ids.length === 1
          ? "produto atualizado"
          : "produtos atualizados"
      }.`,
    );
  };

  const copySku = async (sku: string | null) => {
    if (!sku) {
      toast.error("Este produto não tem SKU.");
      return;
    }

    try {
      await navigator.clipboard.writeText(sku);
      toast.success("SKU copiado.");
    } catch {
      toast.error("Não foi possível copiar o SKU.");
    }
  };

  const exportProducts = () => {
    if (!filtered.length) {
      toast.error("Não existem produtos para exportar.");
      return;
    }

    const header = [
      "Produto",
      "SKU",
      "Categoria",
      "Preço",
      "Preço promocional",
      "Stock",
      "Estado",
    ];

    const rows = filtered.map((product) => [
      product.name,
      product.sku ?? "",
      product.category ?? "",
      Number(product.price).toFixed(2),
      product.promo_price != null
        ? Number(product.promo_price).toFixed(2)
        : "",
      String(product.stock),
      product.active ? "Ativo" : "Inativo",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `produtos-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    toast.success("Produtos exportados.");
  };

  const clearSelectionAnd = (change: () => void) => {
    setSelectedIds([]);
    change();
  };

  const clearFilters = () => {
    setSelectedIds([]);
    setQuery("");
    setFilter("all");
    setCategoryFilter("all");
  };

  if (!company) {
    return (
      <AdminLayout title="Produtos">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Produtos">
      <div className="mx-auto max-w-[1500px]">
        {/* PAGE HEADER */}

        <section className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Catálogo & Inventário
            </span>

            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Produtos
            </h1>

            <p className="mt-1 max-w-xl text-xs sm:text-sm text-slate-500">
              Gerencie o catálogo, preços, stock e visibilidade dos produtos da sua loja.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={exportProducts}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Archive className="h-3.5 w-3.5" />
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Adicionar produto
            </button>
          </div>
        </section>

        {loadError && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800 border border-amber-200 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <p>Não foi possível carregar o catálogo. Os valores abaixo não representam dados atuais.</p>
            <button type="button" onClick={load} className="h-9 shrink-0 rounded-lg bg-amber-800 px-4 text-xs font-bold text-white hover:bg-amber-900">Tentar novamente</button>
          </div>
        )}

        {/* SUMMARY FILTERS */}

        <section className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <SummaryFilter
              label="Todos"
              value={loading || loadError ? "—" : stats.total}
              active={filter === "all"}
              onClick={() => clearSelectionAnd(() => setFilter("all"))}
            />

            <SummaryFilter
              label="Ativos"
              value={loading || loadError ? "—" : stats.active}
              active={filter === "active"}
              onClick={() => clearSelectionAnd(() => setFilter("active"))}
            />

            <SummaryFilter
              label="Sem stock"
              value={loading || loadError ? "—" : stats.out}
              active={filter === "out"}
              onClick={() => clearSelectionAnd(() => setFilter("out"))}
              warning={stats.out > 0}
            />

            <SummaryFilter
              label="Stock baixo"
              value={loading || loadError ? "—" : stats.low}
              active={filter === "low"}
              onClick={() => clearSelectionAnd(() => setFilter("low"))}
              warning={stats.low > 0}
            />

            <SummaryFilter
              label="Promoções"
              value={loading || loadError ? "—" : stats.promo}
              active={filter === "promo"}
              onClick={() => clearSelectionAnd(() => setFilter("promo"))}
            />
          </section>

        {/* SEARCH + FILTERS */}

        <section className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(event) =>
                clearSelectionAnd(() => setQuery(event.target.value))
              }
              placeholder="Pesquisar produto, SKU ou categoria..."
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            />

            {query && (
              <button
                type="button"
                onClick={() => clearSelectionAnd(() => setQuery(""))}
                aria-label="Limpar pesquisa"
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <FilterSelect
            value={categoryFilter}
            onChange={(value) => clearSelectionAnd(() => setCategoryFilter(value))}
            options={[
              { value: "all", label: "Todas as categorias" },
              ...categories.map((category) => ({
                value: category,
                label: category,
              })),
            ]}
          />

          {(query ||
            filter !== "all" ||
            categoryFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              Limpar filtros
            </button>
          )}
        </section>

        {/* BULK ACTION BAR */}

        {selectedIds.length > 0 && (
          <section className="mb-4 flex flex-col gap-3 rounded-xl bg-slate-900 text-white p-3.5 shadow-md border border-slate-800 sm:flex-row sm:items-center sm:justify-between animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-xs font-bold text-white">
                {selectedIds.length}
              </span>
              <p className="text-xs font-medium text-slate-200">
                {selectedIds.length === 1
                  ? "produto selecionado"
                  : "produtos selecionados"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => bulkSetActive(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition"
              >
                <Check className="h-3.5 w-3.5" />
                Ativar
              </button>

              <button
                type="button"
                onClick={() => bulkSetActive(false)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Ocultar
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex h-8 items-center px-3 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {/* RESULTS */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500">
                  <th className="w-12 px-4 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Selecionar todos os produtos visíveis"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </th>

                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Produto
                  </th>

                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    SKU
                  </th>

                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Categoria
                  </th>

                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Preço
                  </th>

                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Stock
                  </th>

                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>

                  <th className="w-16 px-4 py-3.5" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : loadError ? (
                  <tr><td colSpan={8}><div className="p-8 text-center"><p className="text-sm text-rose-600 font-medium">O catálogo não está disponível no momento.</p><button type="button" onClick={load} className="mt-3 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition">Tentar novamente</button></div></td></tr>
                ) : filtered.length === 0 ? (
                  <EmptyProducts
                    hasFilters={
                      Boolean(query) ||
                      filter !== "all" ||
                      categoryFilter !== "all"
                    }
                    onClear={clearFilters}
                    onCreate={openNew}
                  />
                ) : (
                  filtered.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      currency={company.currency}
                      storeSlug={company.slug}
                      selected={selectedIds.includes(
                        product.id,
                      )}
                      menuOpen={
                        menuProduct === product.id
                      }
                      onSelect={() =>
                        toggleSelection(product.id)
                      }
                      onEdit={() =>
                        openEdit(product)
                      }
                      onToggle={() =>
                        toggleProduct(product)
                      }
                      onDelete={() =>
                        setDeleteProduct(product)
                      }
                      onMenu={() =>
                        setMenuProduct(
                          menuProduct === product.id
                            ? null
                            : product.id,
                        )
                      }
                      onCopySku={() =>
                        copySku(product.sku)
                      }
                      onStockChange={(value) =>
                        updateStock(product, value)
                      }
                      onCloseMenu={() =>
                        setMenuProduct(null)
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="lg:hidden p-3 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="flex animate-pulse gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-1/3 rounded bg-slate-200" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : loadError ? (
              <div className="p-8 text-center"><p className="text-sm font-medium text-rose-600">O catálogo não está disponível no momento.</p><button type="button" onClick={load} className="mt-3 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition">Tentar novamente</button></div>
            ) : filtered.length === 0 ? (
              <div className="p-8">
                <EmptyProductsContent
                  hasFilters={
                    Boolean(query) ||
                    filter !== "all" ||
                    categoryFilter !== "all"
                  }
                  onClear={clearFilters}
                  onCreate={openNew}
                />
              </div>
            ) : (
              filtered.map((product) => (
                <MobileProduct
                  key={product.id}
                  product={product}
                  currency={company.currency}
                  storeSlug={company.slug}
                  selected={selectedIds.includes(
                    product.id,
                  )}
                  menuOpen={
                    menuProduct === product.id
                  }
                  onSelect={() =>
                    toggleSelection(product.id)
                  }
                  onEdit={() =>
                    openEdit(product)
                  }
                  onToggle={() =>
                    toggleProduct(product)
                  }
                  onDelete={() =>
                    setDeleteProduct(product)
                  }
                  onMenu={() =>
                    setMenuProduct(
                      menuProduct === product.id
                        ? null
                        : product.id,
                    )
                  }
                  onCopySku={() =>
                    copySku(product.sku)
                  }
                  onStockChange={(value) =>
                    updateStock(product, value)
                  }
                  onCloseMenu={() =>
                    setMenuProduct(null)
                  }
                />
              ))
            )}
          </div>
        </section>

        {/* RESULT FOOTER */}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-2 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              A mostrar {filtered.length} de {items.length}{" "}
              produtos
            </span>

            {selectedIds.length > 0 && (
              <span className="font-semibold text-slate-900">
                {selectedIds.length} selecionados
              </span>
            )}
          </div>
        )}
      </div>

      {/* PRODUCT EDITOR */}

      <ProductEditor
        open={editorOpen}
        onClose={() => {
          if (!saving) {
            setEditorOpen(false);
            setEditing(null);
          }
        }}
        editing={editing}
        form={form}
        setFormValue={setFormValue}
        currency={company.currency}
        saving={saving}
        onSave={save}
      />

      {/* DELETE CONFIRMATION */}

      {deleteProduct && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Remover produto
                </p>

                <h2
                  id="delete-product-title"
                  className="mt-1 text-lg font-bold tracking-tight text-slate-900"
                >
                  Apagar este produto?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                aria-label="Fechar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              O produto{" "}
              <strong className="font-semibold text-slate-900">
                “{deleteProduct.name}”
              </strong>{" "}
              será removido do catálogo. Para produtos que
              apenas não devem aparecer na loja, recomendamos
              desativá-los.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={remove}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Apagar produto
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function SummaryFilter({
  label,
  value,
  active,
  warning,
  onClick,
}: {
  label: string;
  value: number | string;
  active: boolean;
  warning?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl p-3.5 sm:p-4 text-left transition-all border shadow-2xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
          : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            active ? "text-slate-300" : "text-slate-400",
          )}
        >
          {label}
        </span>

        {warning && typeof value === "number" && value > 0 && !active && (
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>

      <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
        {value}
      </p>
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 min-w-[190px] appearance-none rounded-xl border border-slate-200/80 bg-white pl-3.5 pr-10 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function ProductRow({
  product,
  currency,
  storeSlug,
  selected,
  menuOpen,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
  onMenu,
  onCopySku,
  onStockChange,
  onCloseMenu,
}: {
  product: Product;
  currency: string;
  storeSlug: string;
  selected: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMenu: () => void;
  onCopySku: () => void;
  onStockChange: (stock: number) => void;
  onCloseMenu: () => void;
}) {
  const stock = stockState(product);
  const discount = discountPercent(product);

  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70",
        selected && "bg-slate-50/80",
      )}
    >
      <td className="px-4 py-3.5 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Selecionar ${product.name}`}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900"
        />
      </td>

      <td className="px-4 py-3.5">
        <button
          type="button"
          onClick={onEdit}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <ProductImage product={product} />

          <span className="min-w-0">
            <span className="block max-w-[260px] truncate text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
              {product.name}
            </span>

            {product.description && (
              <span className="mt-0.5 block max-w-[260px] truncate text-xs text-slate-400">
                {product.description}
              </span>
            )}
          </span>
        </button>
      </td>

      <td className="px-4 py-3.5">
        <button
          type="button"
          onClick={onCopySku}
          className="font-mono text-xs text-slate-500 hover:text-slate-900 font-medium"
        >
          {product.sku || "—"}
        </button>
      </td>

      <td className="px-4 py-3.5">
        <span className="text-xs font-medium text-slate-600">
          {product.category || "Geral"}
        </span>
      </td>

      <td className="px-4 py-3.5 text-right">
        {product.promo_price != null ? (
          <div>
            <p className="font-sans text-sm font-bold text-slate-900">
              {formatMoney(
                product.promo_price,
                currency,
              )}
            </p>

            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <s className="text-xs text-slate-400 font-normal">
                {formatMoney(
                  product.price,
                  currency,
                )}
              </s>

              {discount !== null && (
                <span className="rounded-full bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 border border-rose-200">
                  -{discount}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="font-sans text-sm font-bold text-slate-900">
            {formatMoney(
              product.price,
              currency,
            )}
          </span>
        )}
      </td>

      <td className="px-4 py-3.5 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() =>
              onStockChange(product.stock - 1)
            }
            className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Diminuir stock de ${product.name}`}
          >
            −
          </button>

          <span
            className={cn(
              "min-w-[32px] text-center font-sans text-xs font-bold",
              stock.className,
            )}
          >
            {product.stock}
          </span>

          <button
            type="button"
            onClick={() =>
              onStockChange(product.stock + 1)
            }
            className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
            aria-label={`Aumentar stock de ${product.name}`}
          >
            +
          </button>
        </div>

        <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
          {stock.label}
        </p>
      </td>

      <td className="px-4 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition",
            product.active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500",
          )}
          title={
            product.active
              ? "Ocultar da loja"
              : "Publicar na loja"
          }
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              product.active
                ? "bg-emerald-500"
                : "bg-slate-400",
            )}
          />

          {product.active ? "Ativo" : "Inativo"}
        </button>
      </td>

      <td className="relative px-4 py-3.5 text-right">
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Ações para ${product.name}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <ProductMenu
            product={product}
            storeSlug={storeSlug}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
            onCopySku={onCopySku}
            onClose={onCloseMenu}
          />
        )}
      </td>
    </tr>
  );
}

function MobileProduct({
  product,
  currency,
  storeSlug,
  selected,
  menuOpen,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
  onMenu,
  onCopySku,
  onStockChange,
  onCloseMenu,
}: {
  product: Product;
  currency: string;
  storeSlug: string;
  selected: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMenu: () => void;
  onCopySku: () => void;
  onStockChange: (stock: number) => void;
  onCloseMenu: () => void;
}) {
  const stock = stockState(product);

  return (
    <article
      className={cn(
        "relative mb-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition",
        selected && "bg-slate-50/80 border-slate-300",
      )}
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Selecionar ${product.name}`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-900"
        />

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0"
          aria-label={`Editar ${product.name}`}
        >
          <ProductImage product={product} large />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="min-w-0 text-left"
            >
              <p className="truncate text-sm font-bold text-slate-900">
                {product.name}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {product.sku || "Sem SKU"} · {product.category || "Geral"}
              </p>
            </button>

            <button
              type="button"
              onClick={onMenu}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Ações para ${product.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              {product.promo_price != null ? (
                <>
                  <p className="font-sans text-sm font-bold text-slate-900">
                    {formatMoney(
                      product.promo_price,
                      currency,
                    )}
                  </p>

                  <s className="text-xs text-slate-400">
                    {formatMoney(
                      product.price,
                      currency,
                    )}
                  </s>
                </>
              ) : (
                <p className="font-sans text-sm font-bold text-slate-900">
                  {formatMoney(
                    product.price,
                    currency,
                  )}
                </p>
              )}
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-sans text-xs font-bold",
                  stock.className,
                )}
              >
                {formatStock(product.stock)}
              </p>

              <button
                type="button"
                onClick={onToggle}
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                  product.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500",
                )}
              >
                {product.active
                  ? "Ativo"
                  : "Oculto"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <ProductMenu
          product={product}
          storeSlug={storeSlug}
          mobile
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          onCopySku={onCopySku}
          onClose={onCloseMenu}
        />
      )}

      <div className="ml-7 mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-400">
          Ajustar stock
        </span>

        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() =>
            onStockChange(product.stock - 1)
          }
          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-30"
          aria-label={`Diminuir stock de ${product.name}`}
        >
          −
        </button>

        <span className="min-w-[28px] text-center font-sans text-xs font-bold">
          {product.stock}
        </span>

        <button
          type="button"
          onClick={() =>
            onStockChange(product.stock + 1)
          }
          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50"
          aria-label={`Aumentar stock de ${product.name}`}
        >
          +
        </button>
      </div>
    </article>
  );
}

function ProductMenu({
  product,
  storeSlug,
  mobile,
  onEdit,
  onToggle,
  onDelete,
  onCopySku,
  onClose,
}: {
  product: Product;
  storeSlug: string;
  mobile?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCopySku: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl",
        mobile
          ? "right-4 top-16"
          : "right-4 top-12",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
      >
        <Pencil className="h-3.5 w-3.5 text-slate-400" />
        Editar produto
      </button>

      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
      >
        {product.active ? (
          <Archive className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <Zap className="h-3.5 w-3.5 text-emerald-600" />
        )}

        {product.active
          ? "Ocultar da loja"
          : "Publicar na loja"}
      </button>

      <button
        type="button"
        onClick={onCopySku}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
      >
        <Copy className="h-3.5 w-3.5 text-slate-400" />
        Copiar SKU
      </button>

      {product.active && (
        <a
          href={`/loja/${storeSlug}`}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          Ver na loja pública
        </a>
      )}

      <div className="my-1 border-t border-slate-100" />

      <button
        type="button"
        onClick={onDelete}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Apagar produto
      </button>
    </div>
  );
}

function ProductImage({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100",
        large
          ? "h-16 w-16"
          : "h-11 w-11",
      )}
    >
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff className="h-4 w-4 text-slate-400" />
      )}
    </div>
  );
}

function ProductEditor({
  open,
  onClose,
  editing,
  form,
  setFormValue,
  currency,
  saving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Product | null;
  form: FormState;
  setFormValue: <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => void;
  currency: string;
  saving: boolean;
  onSave: () => void;
}) {
  if (!open) return null;

  const price = Number(form.price);
  const promo = Number(form.promo_price);

  const previewPrice =
    form.promo_price.trim() &&
    Number.isFinite(promo) &&
    promo >= 0 &&
    promo < price
      ? promo
      : price;

  const previewImages = form.images
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => /^https:\/\//i.test(value));

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl border-l border-slate-200/80 animate-in slide-in-from-right duration-200">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Catálogo
            </p>

            <h2 id="product-editor-title" className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
              {editing
                ? "Editar produto"
                : "Novo produto"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-8 px-6 py-6">
            {/* INFORMATION */}

            <section>
              <SectionHeading
                eyebrow="Informações"
                title="Dados do produto"
              />

              <div className="mt-4 space-y-4">
                <Field
                  label="Nome"
                  required
                  value={form.name}
                  onChange={(value) =>
                    setFormValue("name", value)
                  }
                  placeholder="Ex.: Nike Air Max"
                  maxLength={120}
                />

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Descrição
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setFormValue(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Descreva o produto para os seus clientes..."
                    maxLength={2000}
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                  />

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {form.description.length}/2000
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="SKU"
                    value={form.sku}
                    onChange={(value) =>
                      setFormValue("sku", value)
                    }
                    placeholder="Ex.: NK-001"
                    maxLength={40}
                  />

                  <Field
                    label="Categoria"
                    value={form.category}
                    onChange={(value) =>
                      setFormValue(
                        "category",
                        value,
                      )
                    }
                    placeholder="Ex.: Calçado"
                    maxLength={60}
                  />
                </div>
              </div>
            </section>

            {/* PRICE & STOCK */}

            <section className="border-t border-slate-100 pt-6">
              <SectionHeading
                eyebrow="Comercial"
                title="Preço e inventário"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={`Preço (${currency})`}
                  value={form.price}
                  onChange={(value) =>
                    setFormValue("price", value)
                  }
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                />

                <NumberField
                  label="Preço promocional"
                  value={form.promo_price}
                  onChange={(value) =>
                    setFormValue(
                      "promo_price",
                      value,
                    )
                  }
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                />

                <NumberField
                  label="Stock"
                  value={form.stock}
                  onChange={(value) =>
                    setFormValue("stock", value)
                  }
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>

              {form.promo_price.trim() &&
                Number.isFinite(promo) &&
                Number.isFinite(price) &&
                promo >= 0 &&
                promo < price && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-3.5 py-2 text-xs text-amber-800">
                    <Tag className="h-4 w-4 text-amber-600 shrink-0" />

                    <span>
                      Promoção com desconto de{" "}
                      <strong>
                        {Math.round(
                          ((price - promo) /
                            price) *
                            100,
                        )}
                        %
                      </strong>
                    </span>
                  </div>
                )}
            </section>

            {/* PUBLICATION */}

            <section className="border-t border-slate-100 pt-6">
              <SectionHeading
                eyebrow="Publicação"
                title="Visibilidade na loja"
              />

              <button
                type="button"
                onClick={() =>
                  setFormValue(
                    "active",
                    !form.active,
                  )
                }
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg transition-colors",
                      form.active
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {form.active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </span>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {form.active
                        ? "Produto publicado"
                        : "Produto oculto"}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {form.active
                        ? "Os clientes podem encontrar e comprar este produto na loja."
                        : "Este produto não aparece no catálogo público da loja."}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    form.active
                      ? "bg-emerald-600"
                      : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform",
                      form.active
                        ? "left-6"
                        : "left-1",
                    )}
                  />
                </span>
              </button>
            </section>

            {/* IMAGES */}

            <section className="border-t border-slate-100 pt-6">
              <SectionHeading
                eyebrow="Conteúdo"
                title="Imagens"
              />

              <div className="mt-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {previewImages.slice(0, 7).map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="aspect-square overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50"
                      >
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ),
                  )}

                  {previewImages.length < 8 && (
                    <div className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
                      <div>
                        <Plus className="mx-auto h-5 w-5 text-slate-400" />

                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          Adicionar
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="mt-4 block text-xs font-semibold text-slate-700">
                  Links das imagens
                </label>

                <textarea
                  value={form.images}
                  onChange={(event) =>
                    setFormValue(
                      "images",
                      event.target.value,
                    )
                  }
                  placeholder={
                    "https://exemplo.com/imagem-1.jpg\nhttps://exemplo.com/imagem-2.jpg"
                  }
                  rows={3}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />

                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  Insira até 8 links HTTPS, um por linha.
                </p>
              </div>
            </section>

            {/* PREVIEW */}

            <section className="border-t border-slate-100 pt-6">
              <SectionHeading
                eyebrow="Pré-visualização"
                title="Como ficará na loja"
              />

              <div className="mt-4 max-w-sm rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                <div className="aspect-square bg-slate-100">
                  {previewImages[0] ? (
                    <img
                      src={previewImages[0]}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="p-3.5">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {form.name.trim() ||
                      "Nome do produto"}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {Number.isFinite(previewPrice)
                        ? formatMoney(
                            previewPrice,
                            currency,
                          )
                        : formatMoney(
                            0,
                            currency,
                          )}
                    </span>

                    {form.promo_price.trim() &&
                      promo < price &&
                      price > 0 && (
                        <s className="text-[11px] text-slate-400">
                          {formatMoney(
                            price,
                            currency,
                          )}
                        </s>
                      )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-9 min-w-[130px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                A guardar...
              </>
            ) : (
              <>
                {editing
                  ? "Guardar alterações"
                  : "Criar produto"}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {eyebrow}
      </p>

      <h3 className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">
        {title}
      </h3>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
      />
    </div>
  );
}

function ProductMenuSpacer() {
  return null;
}

function EmptyProducts({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <tr>
      <td colSpan={8}>
        <EmptyProductsContent
          hasFilters={hasFilters}
          onClear={onClear}
          onCreate={onCreate}
        />
      </td>
    </tr>
  );
}

function EmptyProductsContent({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500 shadow-2xs">
        {hasFilters ? (
          <Search className="h-5 w-5" />
        ) : (
          <Package className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {hasFilters
          ? "Nenhum produto encontrado"
          : "O catálogo ainda está vazio"}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
        {hasFilters
          ? "Experimente alterar a pesquisa ou remover alguns filtros."
          : "Adicione o primeiro produto para começar a construir a sua loja."}
      </p>

      <button
        type="button"
        onClick={hasFilters ? onClear : onCreate}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
      >
        {hasFilters ? (
          "Limpar filtros"
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Adicionar produto
          </>
        )}
      </button>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr
          key={index}
          className="border-b border-slate-100"
        >
          <td className="px-4 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 animate-pulse rounded bg-slate-200" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </td>

          <td className="px-4 py-4">
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="ml-auto h-3 w-20 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
          </td>

          <td />
        </tr>
      ))}
    </>
  );
}
