import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  Download,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Customer = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channel: string | null;
  notes: string | null;
  total_spent: number;
  orders_count: number;
  last_order_at: string | null;
  created_at: string;
};

type OrderRecord = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  channel: string;
};

function channelKey(channel: string | null) {
  const lower = channel?.toLowerCase();
  return !lower || lower === "website" || lower === "store" ? "website" : lower;
}

function channelLabel(channel: string | null) {
  const lower = channelKey(channel);
  if (lower === "whatsapp") return "WhatsApp";
  if (lower === "instagram") return "Instagram";
  if (lower === "facebook") return "Facebook";
  if (lower === "website") return "Loja";
  return channel;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function Customers() {
  const { company } = useCompany();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"spent" | "orders" | "recent">("spent");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerOrdersError, setCustomerOrdersError] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formChannel, setFormChannel] = useState("website");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!company) return;

    setLoading(true);
    setLoadError(false);

    // 1. Fetch from customers table
    const { data: dbCustomers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers table:", error);
      setLoadError(true);
      setCustomers([]);
      setLoading(false);
      return;
    }

    let list: Customer[] = (dbCustomers as Customer[]) ?? [];

    // 2. Derive/Aggregate from orders table to include historical buyers not yet synced
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, total, created_at, channel, status")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      setLoadError(true);
      setCustomers([]);
      setLoading(false);
      return;
    }

    if (ordersData && ordersData.length > 0) {
      const derivedMap = new Map<string, Customer>();

      // Populate existing DB customers into map by name/email/phone
      list.forEach((c) => {
        const key = (c.email || c.phone || c.name).toLowerCase().trim();
        derivedMap.set(key, c);
      });

      // Process orders
      ordersData.forEach((order) => {
        if (order.status === "cancelled") return;

        const key = (order.customer_email || order.customer_phone || order.customer_name).toLowerCase().trim();
        const existing = derivedMap.get(key);

        if (existing) {
          // Update derived metrics if higher or missing
          if (!dbCustomers || dbCustomers.length === 0) {
            existing.total_spent += Number(order.total);
            existing.orders_count += 1;
            if (!existing.last_order_at || new Date(order.created_at) > new Date(existing.last_order_at)) {
              existing.last_order_at = order.created_at;
            }
          }
        } else {
          // Synthetic customer record derived from orders
          derivedMap.set(key, {
            id: order.id,
            company_id: company.id,
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            channel: order.channel,
            notes: null,
            total_spent: Number(order.total),
            orders_count: 1,
            last_order_at: order.created_at,
            created_at: order.created_at,
          });
        }
      });

      list = Array.from(derivedMap.values());
    }

    setCustomers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load orders for selected customer
  useEffect(() => {
    if (!selectedCustomer || !company) return;

    let cancelled = false;
    setCustomerOrders([]);
    setCustomerOrdersError(false);
    async function loadCustomerOrders() {
      setLoadingOrders(true);

      const queryFilter = supabase
        .from("orders")
        .select("id, total, status, created_at, channel")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (selectedCustomer.email) {
        queryFilter.eq("customer_email", selectedCustomer.email);
      } else if (selectedCustomer.phone) {
        queryFilter.eq("customer_phone", selectedCustomer.phone);
      } else {
        queryFilter.eq("customer_name", selectedCustomer.name);
      }

      const { data, error } = await queryFilter.limit(50);
      if (cancelled) return;
      setCustomerOrders((data as OrderRecord[]) ?? []);
      setCustomerOrdersError(Boolean(error));
      setLoadingOrders(false);
    }

    void loadCustomerOrders();
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer, company, ordersRefreshKey]);

  const stats = useMemo(() => {
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent), 0);
    const avgSpent = customers.length > 0 ? totalSpent / customers.length : 0;
    const repeatBuyers = customers.filter((c) => c.orders_count > 1).length;

    return {
      total: customers.length,
      totalSpent,
      avgSpent,
      repeatBuyers,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return customers
      .filter((c) => {
        if (channelFilter !== "all" && channelKey(c.channel) !== channelFilter) {
          return false;
        }

        if (!q) return true;

        return (
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "spent") return Number(b.total_spent) - Number(a.total_spent);
        if (sortBy === "orders") return b.orders_count - a.orders_count;
        if (sortBy === "recent") {
          const dateA = a.last_order_at ? new Date(a.last_order_at).getTime() : 0;
          const dateB = b.last_order_at ? new Date(b.last_order_at).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [customers, query, channelFilter, sortBy]);

  const handleCreateCustomer = async () => {
    if (!company) return;
    if (!formName.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        company_id: company.id,
        name: formName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        channel: formChannel,
        notes: formNotes.trim() || null,
        total_spent: 0,
        orders_count: 0,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Cliente adicionado com sucesso.");
    setNewModalOpen(false);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormNotes("");
    await loadData();
    if (data) {
      setSelectedCustomer(data as Customer);
    }
  };

  const exportCustomers = () => {
    if (!filteredCustomers.length) {
      toast.error("Sem clientes para exportar.");
      return;
    }

    const header = ["Nome", "Email", "Telefone", "Canal", "Pedidos", "Total Gasto", "Último Pedido"];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.email ?? "",
      c.phone ?? "",
      channelLabel(c.channel),
      c.orders_count,
      Number(c.total_spent).toFixed(2),
      c.last_order_at ? new Date(c.last_order_at).toISOString() : "",
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Lista de clientes exportada.");
  };

  if (!company) {
    return (
      <AdminLayout title="Clientes">
        <div />
      </AdminLayout>
    );
  }

  const currency = company.currency;

  return (
    <AdminLayout title="Clientes">
      <div className="space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-4 pb-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Relacionamento Comercial & CRM
            </span>

            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Clientes
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Acompanhe quem compra na sua loja, histórico de encomendas e canais de contacto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportCustomers}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={() => setNewModalOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Novo cliente
            </button>
          </div>
        </section>

        {/* METRICS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Total de Clientes"
            value={String(stats.total)}
            icon={Users}
            loading={loading}
          />
          <MetricCard
            label="Total Movimentado"
            value={formatMoney(stats.totalSpent, currency)}
            icon={Wallet}
            loading={loading}
          />
          <MetricCard
            label="Ticket Médio / Cliente"
            value={formatMoney(stats.avgSpent, currency)}
            icon={ShoppingBag}
            loading={loading}
          />
          <MetricCard
            label="Clientes Recorrentes"
            value={String(stats.repeatBuyers)}
            subText={`${stats.total > 0 ? Math.round((stats.repeatBuyers / stats.total) * 100) : 0}% da base`}
            icon={UserCheck}
            loading={loading}
          />
        </section>

        {/* FILTERS & SEARCH */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar cliente por nome, email ou telefone..."
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            >
              <option value="all">Todos os canais</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "spent" | "orders" | "recent")}
              className="h-10 rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            >
              <option value="spent">Ordenar: Maior gasto</option>
              <option value="orders">Ordenar: Mais pedidos</option>
              <option value="recent">Ordenar: Pedido mais recente</option>
            </select>
          </div>
        </section>

        {/* CUSTOMERS LIST */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : loadError ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
              <p className="text-xs font-medium text-rose-600">Não foi possível carregar os clientes.</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-3 inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-900">Nenhum cliente encontrado</p>
              <p className="mt-1 text-xs text-slate-500">
                {query ? "Tente ajustar a pesquisa ou os filtros." : "Quando receber pedidos, os clientes aparecerão aqui."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-2xs">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-900">{customer.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        {customer.phone || customer.email || "Sem contacto"}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>{customer.orders_count} {customer.orders_count === 1 ? "pedido" : "pedidos"}</span>
                        <span className="font-bold text-slate-900">{formatMoney(customer.total_spent, currency)}</span>
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
              <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Contactos</th>
                    <th className="px-5 py-3.5">Canal</th>
                    <th className="px-5 py-3.5 text-center">Pedidos</th>
                    <th className="px-5 py-3.5 text-right">Total Gasto</th>
                    <th className="px-5 py-3.5">Último Pedido</th>
                    <th className="w-10 px-5 py-3.5" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="group cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-2xs">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Cliente desde {formatDate(customer.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {customer.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {!customer.phone && !customer.email && <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-5 py-3.5 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {channelLabel(customer.channel)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-900">
                        {customer.orders_count}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-900">
                        {formatMoney(customer.total_spent, currency)}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {formatDate(customer.last_order_at)}
                      </td>

                      <td className="px-5 py-3.5">
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* CUSTOMER DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50"
            onClick={() => setSelectedCustomer(null)}
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
            <header className="flex min-h-[64px] items-center justify-between border-b border-slate-100 px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-2xs">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400">Cliente desde {formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
              {/* CONTACT & OVERVIEW */}
              <section className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Gasto</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {formatMoney(selectedCustomer.total_spent, currency)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pedidos</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{selectedCustomer.orders_count}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Médio</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {formatMoney(
                      selectedCustomer.orders_count > 0
                        ? selectedCustomer.total_spent / selectedCustomer.orders_count
                        : 0,
                      currency
                    )}
                  </p>
                </div>
              </section>

              {/* CONTACT DETAILS */}
              <section className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contactos</p>

                <div className="space-y-2 text-xs text-slate-600">
                  {selectedCustomer.phone && (
                    <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2.5 hover:text-slate-900 transition">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedCustomer.phone}</span>
                    </a>
                  )}

                  {selectedCustomer.email && (
                    <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-2.5 hover:text-slate-900 transition">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedCustomer.email}</span>
                    </a>
                  )}

                  <div className="flex items-center gap-2.5 text-slate-500">
                    <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Canal de origem: {channelLabel(selectedCustomer.channel)}</span>
                  </div>
                </div>
              </section>

              {/* ORDER HISTORY */}
              <section className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Histórico de Pedidos</p>

                {loadingOrders ? (
                  <p className="text-xs text-slate-400">A carregar pedidos...</p>
                ) : customerOrdersError ? (
                  <div>
                    <p className="text-xs text-rose-600">Não foi possível carregar o histórico.</p>
                    <button
                      type="button"
                      onClick={() => setOrdersRefreshKey((current) => current + 1)}
                      className="mt-1 text-xs font-semibold text-emerald-700 underline underline-offset-4"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum pedido efetuado ainda.</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 text-xs">
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatShortDate(order.created_at)} · {channelLabel(order.channel)}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatMoney(order.total, currency)}</p>
                          <span className="text-[10px] uppercase font-semibold text-slate-500">{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ACTIVITY TIMELINE */}
              <section className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atividade</p>

                <div className="space-y-3 border-l-2 border-slate-200 pl-4 text-xs text-slate-600">
                  {selectedCustomer.last_order_at && (
                    <div>
                      <p className="font-bold text-slate-900">Última compra realizada</p>
                      <p className="text-[11px] text-slate-400">{formatDate(selectedCustomer.last_order_at)}</p>
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-slate-900">Registo de cliente</p>
                    <p className="text-[11px] text-slate-400">{formatDate(selectedCustomer.created_at)} via {channelLabel(selectedCustomer.channel)}</p>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {newModalOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Novo Cliente</h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nome *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="maria@exemplo.com"
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Telefone</label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+244 9xx xxx xxx"
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Canal Principal</label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                >
                  <option value="website">Website</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Preferências, notas de entrega..."
                  rows={2}
                  className="w-full resize-y rounded-xl border border-slate-200/80 bg-white p-3 text-xs leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {saving ? "A guardar..." : "Guardar Cliente"}
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
  subText,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  subText?: string;
  icon: typeof Users;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center justify-between text-slate-400">
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subText && <p className="mt-1 text-xs text-slate-500 font-medium">{subText}</p>}
        </>
      )}
    </div>
  );
}
