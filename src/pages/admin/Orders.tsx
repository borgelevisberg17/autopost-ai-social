import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Mail,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, ORDER_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  channel: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

type Filter = "all" | string;

function formatOrderId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function channelLabel(channel: string) {
  const value = channel?.toLowerCase();

  if (value === "whatsapp") return "WhatsApp";
  if (value === "instagram") return "Instagram";
  if (value === "facebook") return "Facebook";
  if (value === "website" || value === "store") return "Loja";
  if (!value) return "Loja";

  return channel;
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-[#f5f5f2] text-neutral-700";

    case "confirmed":
      return "bg-neutral-100 text-neutral-700";

    case "shipped":
      return "bg-neutral-900 text-white";

    case "completed":
      return "bg-black text-white";

    case "cancelled":
      return "bg-neutral-100 text-neutral-400";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function StatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  if (status === "pending") {
    return <Clock3 className={className} />;
  }

  if (status === "confirmed") {
    return <Check className={className} />;
  }

  if (status === "shipped") {
    return <Truck className={className} />;
  }

  if (status === "completed") {
    return <Check className={className} />;
  }

  if (status === "cancelled") {
    return <XCircle className={className} />;
  }

  return <Package className={className} />;
}

export default function Orders() {
  const { company } = useCompany();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  async function load() {
    if (!company) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,customer_name,customer_phone,customer_email,notes,channel,status,total,created_at,order_items(product_name,quantity,unit_price)",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error("Não foi possível carregar os pedidos.");
      setOrders([]);
    } else {
      setOrders((data as Order[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  const channels = useMemo(() => {
    return Array.from(
      new Set(
        orders
          .map((order) => order.channel)
          .filter(Boolean),
      ),
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        filter === "all" || order.status === filter;

      if (!matchesStatus) return false;

      const matchesChannel =
        channelFilter === "all" ||
        order.channel === channelFilter;

      if (!matchesChannel) return false;

      if (!query) return true;

      const productMatches = order.order_items?.some((item) =>
        item.product_name.toLowerCase().includes(query),
      );

      return (
        productMatches ||
        [
          order.customer_name,
          order.customer_phone,
          order.customer_email,
          order.channel,
          order.id,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          )
      );
    });
  }, [orders, filter, channelFilter, search]);

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedIds.includes(order.id),
    );

  const selectedOrders = useMemo(
    () =>
      orders.filter((order) =>
        selectedIds.includes(order.id),
      ),
    [orders, selectedIds],
  );

  async function setStatus(order: Order, status: string) {
    if (order.status === "cancelled") {
      toast.error("Pedido cancelado não pode ser reaberto.");
      return;
    }

    if (status === order.status) return;

    if (
      status === "cancelled" &&
      !window.confirm(
        "Cancelar este pedido? O stock será reposto.",
      )
    ) {
      return;
    }

    setUpdating(true);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id);

    if (error) {
      toast.error(error.message);
      setUpdating(false);
      return;
    }

    const updated = {
      ...order,
      status,
    };

    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? updated : item,
      ),
    );

    setSelectedOrder((current) =>
      current?.id === order.id ? updated : current,
    );

    toast.success(
      `Pedido ${formatOrderId(order.id)} atualizado.`,
    );

    setUpdating(false);
  }

  async function bulkUpdateStatus(status: string) {
    if (!selectedOrders.length) return;

    if (
      status === "cancelled" &&
      !window.confirm(
        `Cancelar ${selectedOrders.length} pedidos? O stock será reposto.`,
      )
    ) {
      return;
    }

    setBulkUpdating(true);

    const ids = selectedOrders
      .filter((order) => order.status !== "cancelled")
      .map((order) => order.id);

    if (!ids.length) {
      toast.error("Não existem pedidos válidos para atualizar.");
      setBulkUpdating(false);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .in("id", ids);

    if (error) {
      toast.error(error.message);
      setBulkUpdating(false);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        ids.includes(order.id)
          ? { ...order, status }
          : order,
      ),
    );

    setSelectedOrder((current) =>
      current && ids.includes(current.id)
        ? { ...current, status }
        : current,
    );

    setSelectedIds([]);

    toast.success(
      `${ids.length} ${ids.length === 1 ? "pedido atualizado" : "pedidos atualizados"}.`,
    );

    setBulkUpdating(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredOrders.some(
              (order) => order.id === id,
            ),
        ),
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredOrders.map((order) => order.id),
      ]),
    ]);
  }

  async function copyOrderId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID do pedido copiado.");
    } catch {
      toast.error("Não foi possível copiar o ID.");
    }
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setChannelFilter("all");
  }

  function exportOrders() {
    if (!filteredOrders.length) {
      toast.error("Não existem pedidos para exportar.");
      return;
    }

    const header = [
      "Pedido",
      "Cliente",
      "Telefone",
      "Email",
      "Itens",
      "Total",
      "Canal",
      "Estado",
      "Data",
    ];

    const rows = filteredOrders.map((order) => [
      formatOrderId(order.id),
      order.customer_name,
      order.customer_phone ?? "",
      order.customer_email ?? "",
      order.order_items.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      ),
      Number(order.total).toFixed(2),
      channelLabel(order.channel),
      ORDER_STATUS[order.status] ?? order.status,
      new Date(order.created_at).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) =>
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
    link.download = `pedidos-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    toast.success("Pedidos exportados.");
  }

  if (!company) {
    return (
      <AdminLayout title="Pedidos">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pedidos">
      <div className="space-y-7">
        {/* HEADER */}
        <section className="flex flex-col gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Operação
            </p>

            <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
              Pedidos
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Gerencie pedidos, clientes e o processamento das
              vendas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportOrders}
              className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-4 text-sm font-medium transition hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid border-y border-neutral-200 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryItem
            label="Todos"
            value={stats.total}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <SummaryItem
            label="Pendentes"
            value={stats.pending}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />

          <SummaryItem
            label="Confirmados"
            value={stats.confirmed}
            active={filter === "confirmed"}
            onClick={() => setFilter("confirmed")}
          />

          <SummaryItem
            label="Enviados"
            value={stats.shipped}
            active={filter === "shipped"}
            onClick={() => setFilter("shipped")}
          />

          <SummaryItem
            label="Concluídos"
            value={stats.completed}
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          />

          <SummaryItem
            label="Cancelados"
            value={stats.cancelled}
            active={filter === "cancelled"}
            onClick={() => setFilter("cancelled")}
          />
        </section>

        {/* FILTERS */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar pedido, cliente, telefone ou produto..."
              className="h-11 w-full rounded-sm border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <FilterSelect
            value={filter}
            onChange={setFilter}
            ariaLabel="Filtrar por estado"
            className="lg:w-44"
          >
            <option value="all">Todos os estados</option>

            {Object.entries(ORDER_STATUS).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ),
            )}
          </FilterSelect>

          <FilterSelect
            value={channelFilter}
            onChange={setChannelFilter}
            ariaLabel="Filtrar por canal"
            className="lg:w-40"
          >
            <option value="all">Todos os canais</option>

            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channelLabel(channel)}
              </option>
            ))}
          </FilterSelect>

          {(search ||
            filter !== "all" ||
            channelFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 shrink-0 px-3 text-sm text-neutral-500 underline underline-offset-4 hover:text-black hover:no-underline"
            >
              Limpar
            </button>
          )}
        </section>

        {/* BULK ACTIONS */}
        {selectedIds.length > 0 && (
          <section className="sticky top-[72px] z-20 flex flex-col gap-3 border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-7 w-7 place-items-center bg-black text-xs font-semibold text-white">
                {selectedIds.length}
              </div>

              <p className="text-sm font-medium">
                {selectedIds.length === 1
                  ? "pedido selecionado"
                  : "pedidos selecionados"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() =>
                  bulkUpdateStatus("confirmed")
                }
                className="min-h-9 border border-neutral-200 px-3 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Marcar como confirmado
              </button>

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() =>
                  bulkUpdateStatus("shipped")
                }
                className="min-h-9 border border-neutral-200 px-3 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Marcar como enviado
              </button>

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() =>
                  bulkUpdateStatus("completed")
                }
                className="min-h-9 bg-black px-3 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                Concluir
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="grid h-9 w-9 place-items-center text-neutral-400 hover:bg-neutral-100 hover:text-black"
                aria-label="Limpar seleção"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* RESULTS */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">
            {loading
              ? "A carregar pedidos..."
              : `${filteredOrders.length} ${
                  filteredOrders.length === 1
                    ? "pedido encontrado"
                    : "pedidos encontrados"
                }`}
          </p>

          {!loading && filteredOrders.length > 0 && (
            <button
              type="button"
              onClick={toggleAllVisible}
              className="text-xs font-medium text-neutral-600 hover:text-black"
            >
              {allVisibleSelected
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </button>
          )}
        </div>

        {/* ORDERS */}
        {loading ? (
          <OrdersSkeleton />
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders
            hasFilters={
              Boolean(search) ||
              filter !== "all" ||
              channelFilter !== "all"
            }
            onClear={clearFilters}
          />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-hidden border-y border-neutral-200 lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="Selecionar todos os pedidos"
                        className="h-4 w-4 accent-black"
                      />
                    </th>

                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Estado</TableHead>

                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Total
                    </th>

                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const itemCount =
                      order.order_items?.reduce(
                        (sum, item) =>
                          sum + Number(item.quantity),
                        0,
                      ) ?? 0;

                    const selected = selectedIds.includes(
                      order.id,
                    );

                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          "group cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0 hover:bg-neutral-50",
                          selected && "bg-neutral-50",
                        )}
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                      >
                        <td
                          className="px-4 py-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleSelected(order.id)
                            }
                            aria-label={`Selecionar ${formatOrderId(order.id)}`}
                            className="h-4 w-4 accent-black"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-semibold">
                            {formatOrderId(order.id)}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-4 py-4">
                          <p className="truncate text-sm font-medium">
                            {order.customer_name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-neutral-400">
                            {order.customer_phone ||
                              order.customer_email ||
                              "Sem contacto"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-neutral-500">
                          {itemCount}{" "}
                          {itemCount === 1
                            ? "item"
                            : "itens"}
                        </td>

                        <td className="px-4 py-4 text-sm text-neutral-500">
                          {channelLabel(order.channel)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-neutral-500">
                          {formatShortDate(
                            order.created_at,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={order.status}
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold">
                          {formatMoney(
                            order.total,
                            company.currency,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <ArrowRight className="ml-auto h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-700" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 lg:hidden">
              {filteredOrders.map((order) => {
                const itemCount =
                  order.order_items?.reduce(
                    (sum, item) =>
                      sum + Number(item.quantity),
                    0,
                  ) ?? 0;

                const selected = selectedIds.includes(
                  order.id,
                );

                return (
                  <div
                    key={order.id}
                    className={cn(
                      "flex items-start gap-3 py-4",
                      selected && "bg-neutral-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleSelected(order.id)
                      }
                      aria-label={`Selecionar ${formatOrderId(order.id)}`}
                      className="mt-2 h-4 w-4 shrink-0 accent-black"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100">
                        <ShoppingBag
                          className="h-4 w-4 text-neutral-600"
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {order.customer_name}
                            </p>

                            <p className="mt-0.5 font-mono text-[10px] text-neutral-400">
                              {formatOrderId(order.id)}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-semibold">
                            {formatMoney(
                              order.total,
                              company.currency,
                            )}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            status={order.status}
                          />

                          <span className="text-[11px] text-neutral-400">
                            {itemCount}{" "}
                            {itemCount === 1
                              ? "item"
                              : "itens"}
                          </span>

                          <span className="text-[11px] text-neutral-300">
                            ·
                          </span>

                          <span className="text-[11px] text-neutral-400">
                            {channelLabel(order.channel)}
                          </span>

                          <span className="text-[11px] text-neutral-300">
                            ·
                          </span>

                          <span className="text-[11px] text-neutral-400">
                            {formatShortDate(
                              order.created_at,
                            )}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-neutral-300" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          currency={company.currency}
          updating={updating}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={setStatus}
          onCopy={copyOrderId}
        />
      )}
    </AdminLayout>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
      {children}
    </th>
  );
}

function SummaryItem({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b border-neutral-200 px-4 py-4 text-left transition-colors last:border-b-0 sm:px-5 lg:border-b-0 lg:border-r lg:px-5 lg:last:border-r-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset",
        active
          ? "bg-neutral-50"
          : "hover:bg-neutral-50",
      )}
    >
      <p className="text-xs text-neutral-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold tracking-tight">
        {value}
      </p>
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-sm border border-neutral-200 bg-white px-3 pr-9 text-sm font-medium outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium whitespace-nowrap",
        statusTone(status),
      )}
    >
      <StatusIcon
        status={status}
        className="h-3 w-3"
      />

      {ORDER_STATUS[status] ?? status}
    </span>
  );
}

function OrderDrawer({
  order,
  currency,
  updating,
  onClose,
  onStatusChange,
  onCopy,
}: {
  order: Order;
  currency?: string;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (
    order: Order,
    status: string,
  ) => void;
  onCopy: (id: string) => void;
}) {
  const itemsTotal = order.order_items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) *
        Number(item.unit_price),
    0,
  );

  const itemCount = order.order_items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const timeline = [
    {
      label: "Pedido recebido",
      active: true,
    },
    {
      label: "Pedido confirmado",
      active: [
        "confirmed",
        "shipped",
        "completed",
      ].includes(order.status),
    },
    {
      label: "Pedido enviado",
      active: ["shipped", "completed"].includes(
        order.status,
      ),
    },
    {
      label: "Pedido concluído",
      active: order.status === "completed",
    },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Fechar detalhe do pedido"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[1px]"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-neutral-200 bg-white shadow-2xl">
        {/* HEADER */}
        <header className="flex min-h-[68px] items-center justify-between border-b border-neutral-200 px-5 sm:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold">
                {formatOrderId(order.id)}
              </p>

              <button
                type="button"
                onClick={() => onCopy(order.id)}
                className="grid h-7 w-7 place-items-center rounded-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Copiar ID do pedido"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-0.5 text-xs text-neutral-400">
              {formatDate(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* STATUS */}
          <section className="border-b border-neutral-200 px-5 py-6 sm:px-7">
            <SectionLabel>
              Estado do pedido
            </SectionLabel>

            <div className="relative">
              <select
                value={order.status}
                disabled={
                  updating ||
                  order.status === "cancelled"
                }
                onChange={(event) =>
                  onStatusChange(
                    order,
                    event.target.value,
                  )
                }
                className={cn(
                  "h-11 w-full appearance-none border px-3 pr-10 text-sm font-medium outline-none transition",
                  statusTone(order.status),
                  "focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900",
                )}
              >
                {Object.entries(ORDER_STATUS).map(
                  ([key, label]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            </div>

            {order.status === "cancelled" && (
              <p className="mt-3 text-xs leading-5 text-neutral-400">
                Pedidos cancelados não podem ser
                reabertos.
              </p>
            )}
          </section>

          {/* CUSTOMER */}
          <section className="border-b border-neutral-200 px-5 py-6 sm:px-7">
            <SectionLabel>Cliente</SectionLabel>

            <h3 className="text-lg font-semibold tracking-tight">
              {order.customer_name}
            </h3>

            <div className="mt-4 space-y-3">
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-3 text-sm text-neutral-600 hover:text-black"
                >
                  <Phone className="h-4 w-4 text-neutral-400" />
                  {order.customer_phone}
                </a>
              )}

              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex items-center gap-3 break-all text-sm text-neutral-600 hover:text-black"
                >
                  <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                  {order.customer_email}
                </a>
              )}

              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <ShoppingBag className="h-4 w-4 text-neutral-400" />
                {channelLabel(order.channel)}
              </div>
            </div>
          </section>

          {/* ITEMS */}
          <section className="border-b border-neutral-200 px-5 py-6 sm:px-7">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>
                Itens do pedido
              </SectionLabel>

              <span className="text-xs text-neutral-400">
                {itemCount}{" "}
                {itemCount === 1
                  ? "unidade"
                  : "unidades"}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 border-y border-neutral-100">
              {order.order_items.map(
                (item, index) => (
                  <div
                    key={`${item.product_name}-${index}`}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {item.quantity} ×{" "}
                        {formatMoney(
                          item.unit_price,
                          currency,
                        )}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold">
                      {formatMoney(
                        Number(item.quantity) *
                          Number(item.unit_price),
                        currency,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>

                <span>
                  {formatMoney(
                    itemsTotal,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
                <span>Total</span>

                <span>
                  {formatMoney(
                    order.total,
                    currency,
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* NOTES */}
          {order.notes && (
            <section className="border-b border-neutral-200 px-5 py-6 sm:px-7">
              <SectionLabel>
                Observações
              </SectionLabel>

              <div className="border-l-2 border-neutral-200 pl-4">
                <p className="text-sm leading-6 text-neutral-600">
                  {order.notes}
                </p>
              </div>
            </section>
          )}

          {/* TIMELINE */}
          <section className="px-5 py-6 sm:px-7">
            <SectionLabel>
              Processamento
            </SectionLabel>

            <div className="mt-5">
              {timeline.map((item, index) => (
                <TimelineItem
                  key={item.label}
                  label={item.label}
                  active={item.active}
                  last={
                    index === timeline.length - 1
                  }
                />
              ))}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                Total
              </p>

              <p className="mt-0.5 text-lg font-semibold tracking-tight">
                {formatMoney(
                  order.total,
                  currency,
                )}
              </p>
            </div>

            {order.status !== "cancelled" &&
              order.status !== "completed" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    const next =
                      order.status === "pending"
                        ? "confirmed"
                        : order.status === "confirmed"
                          ? "shipped"
                          : "completed";

                    onStatusChange(order, next);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {updating
                    ? "A atualizar..."
                    : order.status ===
                        "pending"
                      ? "Confirmar pedido"
                      : order.status ===
                          "confirmed"
                        ? "Marcar como enviado"
                        : "Concluir pedido"}

                  {!updating && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              )}
          </div>
        </footer>
      </aside>
    </div>
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
      {children}
    </p>
  );
}

function TimelineItem({
  label,
  active,
  last,
}: {
  label: string;
  active: boolean;
  last: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3 pb-5 last:pb-0">
      <div
        className={cn(
          "relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          active
            ? "border-black bg-black text-white"
            : "border-neutral-200 bg-white text-transparent",
        )}
      >
        <Check className="h-3 w-3" />
      </div>

      {!last && (
        <div
          className={cn(
            "absolute left-[9px] top-5 h-full w-px",
            active
              ? "bg-neutral-300"
              : "bg-neutral-200",
          )}
        />
      )}

      <p
        className={cn(
          "pt-0.5 text-sm",
          active
            ? "font-medium text-neutral-900"
            : "text-neutral-400",
        )}
      >
        {label}
      </p>
    </div>
  );
}

function EmptyOrders({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="border-y border-neutral-200 py-20 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
        {hasFilters ? (
          <Search className="h-4 w-4 text-neutral-400" />
        ) : (
          <ShoppingBag className="h-4 w-4 text-neutral-400" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold">
        {hasFilters
          ? "Nenhum pedido encontrado"
          : "Ainda não existem pedidos"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-neutral-400">
        {hasFilters
          ? "Tente alterar a pesquisa ou os filtros selecionados."
          : "Quando a sua loja começar a receber pedidos, eles aparecerão aqui."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 text-xs font-semibold underline underline-offset-4 hover:no-underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="border-y border-neutral-200">
      {Array.from({ length: 7 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-neutral-100 px-4 py-5 last:border-b-0"
          >
            <div className="h-4 w-4 animate-pulse bg-neutral-100" />

            <div className="h-3 w-20 animate-pulse bg-neutral-100" />

            <div className="h-3 w-40 animate-pulse bg-neutral-100" />

            <div className="h-3 w-20 animate-pulse bg-neutral-100" />

            <div className="ml-auto h-3 w-24 animate-pulse bg-neutral-100" />
          </div>
        ),
      )}
    </div>
  );
}
