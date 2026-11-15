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

type OrderEvent = {
  id: string;
  type: string;
  actor_type: string;
  description: string;
  created_at: string;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  channel: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

type Filter = "all" | string;

const PAYMENT_STATUS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
};

const FULFILLMENT_STATUS: Record<string, string> = {
  unfulfilled: "Não enviado",
  preparing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
};

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
      return "bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold rounded-md";

    case "confirmed":
      return "bg-sky-50 text-sky-700 border border-sky-200/70 font-semibold rounded-md";

    case "shipped":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-semibold rounded-md";

    case "completed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold rounded-md";

    case "cancelled":
      return "bg-rose-50 text-rose-700 border border-rose-200/70 font-semibold rounded-md";

    default:
      return "bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-md";
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

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderEvents, setSelectedOrderEvents] = useState<OrderEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  async function load() {
    if (!company) return;

    setLoading(true);
    setLoadError(false);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,customer_name,customer_phone,customer_email,notes,channel,status,payment_status,fulfillment_status,total,created_at,order_items(product_name,quantity,unit_price)",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error("Não foi possível carregar os pedidos.");
      setLoadError(true);
      setOrders([]);
    } else {
      setOrders((data as Order[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load persistent order_events when selecting an order
  useEffect(() => {
    if (!selectedOrder || !company) return;

    let cancelled = false;
    setSelectedOrderEvents([]);
    setEventsError(false);
    setEventsLoading(true);

    async function loadEvents() {
      const { data, error } = await supabase
        .from("order_events")
        .select("id, type, actor_type, description, created_at")
        .eq("order_id", selectedOrder.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      setEventsLoading(false);
      if (error) {
        setEventsError(true);
        setSelectedOrderEvents([]);
        return;
      }
      setSelectedOrderEvents((data as OrderEvent[]) ?? []);
    }

    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, [selectedOrder, company, eventsRefreshKey]);

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

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => filteredOrders.some((order) => order.id === id)),
    );
  }, [filteredOrders]);

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

  async function setStatus(
    order: Order,
    updates: { status?: string; payment_status?: string; fulfillment_status?: string }
  ) {
    if (order.status === "cancelled" && updates.status && updates.status !== "cancelled") {
      toast.error("Pedido cancelado não pode ser reaberto.");
      return;
    }

    if (
      updates.status === "cancelled" &&
      !window.confirm("Cancelar este pedido? O stock será reposto.")
    ) {
      return;
    }

    setUpdating(true);

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", order.id);

    if (error) {
      toast.error(error.message);
      setUpdating(false);
      return;
    }

    // Log persistent order event
    if (company) {
      const desc = updates.status
        ? `Estado do pedido alterado para ${ORDER_STATUS[updates.status] ?? updates.status}`
        : updates.payment_status
        ? `Estado do pagamento alterado para ${PAYMENT_STATUS[updates.payment_status] ?? updates.payment_status}`
        : `Envio alterado para ${FULFILLMENT_STATUS[updates.fulfillment_status ?? ""] ?? updates.fulfillment_status}`;

      await supabase.from("order_events").insert({
        company_id: company.id,
        order_id: order.id,
        type: "order.updated",
        actor_type: "user",
        description: desc,
      });
    }

    const updated = {
      ...order,
      ...updates,
    };

    setOrders((current) =>
      current.map((item) => (item.id === order.id ? updated : item)),
    );

    setSelectedOrder((current) =>
      current?.id === order.id ? updated : current,
    );

    toast.success(`Pedido ${formatOrderId(order.id)} atualizado.`);
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

  function openOrder(order: Order) {
    setSelectedOrderEvents([]);
    setEventsError(false);
    setSelectedOrder(order);
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
      "Pagamento",
      "Envio",
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
      PAYMENT_STATUS[order.payment_status] ?? order.payment_status,
      FULFILLMENT_STATUS[order.fulfillment_status] ?? order.fulfillment_status,
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
        <section className="flex flex-col gap-4 pb-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Operação de Vendas
            </span>

            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Pedidos
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Gerencie pedidos, clientes, pagamentos e o envio das vendas em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportOrders}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>
        </section>

        {/* SUMMARY TABS */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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
            tone="amber"
            onClick={() => setFilter("pending")}
          />

          <SummaryItem
            label="Confirmados"
            value={stats.confirmed}
            active={filter === "confirmed"}
            tone="sky"
            onClick={() => setFilter("confirmed")}
          />

          <SummaryItem
            label="Enviados"
            value={stats.shipped}
            active={filter === "shipped"}
            tone="indigo"
            onClick={() => setFilter("shipped")}
          />

          <SummaryItem
            label="Concluídos"
            value={stats.completed}
            active={filter === "completed"}
            tone="emerald"
            onClick={() => setFilter("completed")}
          />

          <SummaryItem
            label="Cancelados"
            value={stats.cancelled}
            active={filter === "cancelled"}
            tone="rose"
            onClick={() => setFilter("cancelled")}
          />
        </section>

        {/* FILTERS */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar pedido, cliente, telefone ou produto..."
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
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
              className="h-10 shrink-0 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              Limpar
            </button>
          )}
        </section>

        {/* BULK ACTIONS */}
        {selectedIds.length > 0 && (
          <section className="sticky top-[72px] z-20 flex flex-col gap-3 rounded-xl bg-slate-900 text-white p-3.5 shadow-md border border-slate-800 sm:flex-row sm:items-center sm:justify-between animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-xs font-bold text-white">
                {selectedIds.length}
              </span>

              <p className="text-xs font-medium text-slate-200">
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
                className="h-8 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
              >
                Confirmar
              </button>

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() =>
                  bulkUpdateStatus("shipped")
                }
                className="h-8 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
              >
                Enviar
              </button>

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() =>
                  bulkUpdateStatus("completed")
                }
                className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition disabled:opacity-50"
              >
                Concluir
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label="Limpar seleção"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* RESULTS */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
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
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
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
        ) : loadError ? (
          <DataError
            message="Não foi possível carregar os pedidos. Tente novamente."
            onRetry={load}
          />
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
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="Selecionar todos os pedidos"
                        className="h-4 w-4 accent-slate-900 rounded"
                      />
                    </th>

                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Estado</TableHead>

                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const selected = selectedIds.includes(
                      order.id,
                    );

                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          "group cursor-pointer transition-colors hover:bg-slate-50/80",
                          selected && "bg-slate-50",
                        )}
                        onClick={() => openOrder(order)}
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

                        <td className="max-w-[200px] px-4 py-3.5">
                          <p className="truncate text-xs font-bold text-slate-900">
                            {order.customer_name}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {order.customer_phone ||
                              order.customer_email ||
                              "Sem contacto"}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {PAYMENT_STATUS[order.payment_status] ?? order.payment_status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {FULFILLMENT_STATUS[order.fulfillment_status] ?? order.fulfillment_status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {channelLabel(order.channel)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                          {formatShortDate(
                            order.created_at,
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            status={order.status}
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold text-slate-900">
                          {formatMoney(
                            order.total,
                            company.currency,
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-slate-100 border-y border-slate-200/80 lg:hidden">
              {filteredOrders.map((order) => {
                const selected = selectedIds.includes(
                  order.id,
                );

                return (
                  <div
                    key={order.id}
                    className={cn(
                      "flex items-start gap-3 py-3.5 px-3 transition",
                      selected && "bg-slate-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleSelected(order.id)
                      }
                      aria-label={`Selecionar ${formatOrderId(order.id)}`}
                      className="mt-1.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() => openOrder(order)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
                        <ShoppingBag
                          className="h-4 w-4 text-slate-600"
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {order.customer_name}
                            </p>

                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                              {formatOrderId(order.id)}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs font-bold text-slate-900">
                            {formatMoney(
                              order.total,
                              company.currency,
                            )}
                          </p>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge
                            status={order.status}
                          />

                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            Pag: {PAYMENT_STATUS[order.payment_status] ?? order.payment_status}
                          </span>

                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            Envio: {FULFILLMENT_STATUS[order.fulfillment_status] ?? order.fulfillment_status}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {channelLabel(order.channel)}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
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
            events={selectedOrderEvents}
            eventsLoading={eventsLoading}
            eventsError={eventsError}
            onRetryEvents={() => setEventsRefreshKey((current) => current + 1)}
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
    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

function SummaryItem({
  label,
  value,
  active,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  tone?: "amber" | "sky" | "indigo" | "emerald" | "rose";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 sm:p-4 text-left transition-all border shadow-2xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
          : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            active ? "text-slate-300" : "text-slate-400",
          )}
        >
          {label}
        </p>
        {tone && value > 0 && !active && (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              tone === "amber" && "bg-amber-500",
              tone === "sky" && "bg-sky-500",
              tone === "indigo" && "bg-indigo-500",
              tone === "emerald" && "bg-emerald-500",
              tone === "rose" && "bg-rose-500",
            )}
          />
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
        className="h-10 w-full appearance-none rounded-lg border border-slate-200/80 bg-white px-3 pr-9 text-xs font-semibold text-slate-700 shadow-2xs outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
  events,
  eventsLoading,
  eventsError,
  onRetryEvents,
  currency,
  updating,
  onClose,
  onStatusChange,
  onCopy,
}: {
  order: Order;
  events: OrderEvent[];
  eventsLoading: boolean;
  eventsError: boolean;
  onRetryEvents: () => void;
  currency?: string;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (
    order: Order,
    updates: { status?: string; payment_status?: string; fulfillment_status?: string }
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

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Fechar detalhe do pedido"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <header className="flex min-h-[64px] items-center justify-between border-b border-slate-100 px-5 sm:px-7 bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-bold text-slate-900">
                {formatOrderId(order.id)}
              </p>

              <button
                type="button"
                onClick={() => onCopy(order.id)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Copiar ID do pedido"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-0.5 text-xs text-slate-400">
              {formatDate(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* STATUS BREAKDOWN */}
          <section className="border-b border-slate-100 px-5 py-6 sm:px-7 space-y-4">
            <div>
              <SectionLabel>Estado do Pedido</SectionLabel>
              <select
                value={order.status}
                disabled={updating || order.status === "cancelled"}
                onChange={(e) => onStatusChange(order, { status: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
              >
                {Object.entries(ORDER_STATUS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel>Pagamento</SectionLabel>
                <select
                  value={order.payment_status}
                  disabled={updating}
                  onChange={(e) => onStatusChange(order, { payment_status: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                >
                  {Object.entries(PAYMENT_STATUS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <SectionLabel>Envio (Fulfillment)</SectionLabel>
                <select
                  value={order.fulfillment_status}
                  disabled={updating}
                  onChange={(e) => onStatusChange(order, { fulfillment_status: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                >
                  {Object.entries(FULFILLMENT_STATUS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* CUSTOMER */}
          <section className="border-b border-slate-100 px-5 py-6 sm:px-7">
            <SectionLabel>Cliente</SectionLabel>

            <h3 className="text-base font-bold tracking-tight text-slate-900">
              {order.customer_name}
            </h3>

            <div className="mt-3 space-y-2.5">
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 transition"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {order.customer_phone}
                </a>
              )}

              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex items-center gap-2.5 break-all text-xs text-slate-600 hover:text-slate-900 transition"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {order.customer_email}
                </a>
              )}

              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                {channelLabel(order.channel)}
              </div>
            </div>
          </section>

          {/* ITEMS */}
          <section className="border-b border-slate-100 px-5 py-6 sm:px-7">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>
                Itens do pedido
              </SectionLabel>

              <span className="text-[11px] font-medium text-slate-400">
                {itemCount}{" "}
                {itemCount === 1
                  ? "unidade"
                  : "unidades"}
              </span>
            </div>

            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {order.order_items.map(
                (item, index) => (
                  <div
                    key={`${item.product_name}-${index}`}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {item.product_name}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {item.quantity} ×{" "}
                        {formatMoney(
                          item.unit_price,
                          currency,
                        )}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-bold text-slate-900">
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

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>

                <span>
                  {formatMoney(
                    itemsTotal,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900">
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

          {/* TIMELINE / EVENTS */}
          <section className="px-5 py-6 sm:px-7">
            <SectionLabel>Order Timeline (Eventos)</SectionLabel>

            <div className="mt-3 space-y-3.5 border-l-2 border-slate-200 pl-4 text-xs text-slate-600">
              {eventsLoading ? (
                <p className="text-slate-400">A carregar eventos...</p>
              ) : eventsError ? (
                <div>
                  <p className="text-rose-600 font-medium">Não foi possível carregar a timeline.</p>
                  <button
                    type="button"
                    onClick={onRetryEvents}
                    className="mt-1 font-semibold text-emerald-700 underline underline-offset-4"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div>
                  <p className="font-bold text-slate-900">Pedido criado</p>
                  <p className="text-[11px] text-slate-400">{formatDate(order.created_at)} via {channelLabel(order.channel)}</p>
                </div>
              ) : (
                events.map((evt) => (
                  <div key={evt.id}>
                    <p className="font-bold text-slate-900">{evt.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(evt.created_at)} · {evt.actor_type}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </p>

              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
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

                    onStatusChange(order, { status: next });
                  }}
                  className="inline-flex min-h-11 items-center gap-2 bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                >
                  {updating
                    ? "A atualizar..."
                    : order.status === "pending"
                      ? "Confirmar pedido"
                      : order.status === "confirmed"
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
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        {hasFilters ? (
          <Search className="h-5 w-5" />
        ) : (
          <ShoppingBag className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {hasFilters
          ? "Nenhum pedido encontrado"
          : "Ainda não existem pedidos"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
        {hasFilters
          ? "Tente alterar a pesquisa ou os filtros selecionados."
          : "Quando a sua loja começar a receber pedidos, eles aparecerão aqui."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      {Array.from({ length: 7 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />

            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />

            <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />

            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />

            <div className="ml-auto h-3 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        ),
      )}
    </div>
  );
}

function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded border border-border px-4 text-sm font-medium hover:bg-muted"
      >
        Tentar novamente
      </button>
    </div>
  );
}
