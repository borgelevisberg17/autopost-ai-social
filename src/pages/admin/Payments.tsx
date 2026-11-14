import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, ORDER_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaymentOrder = {
  id: string;
  customer_name: string;
  total: number;
  payment_status: string | null;
  status: string | null;
  fulfillment_status: string | null;
  created_at: string;
  channel: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_proof_path?: string | null;
};

type FilterValue = "all" | string;

type LooseQueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type LooseQuery = {
  select: (columns: string) => LooseQuery;
  eq: (column: string, value: string) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  limit: (count: number) => Promise<LooseQueryResult>;
};

const PAYMENT_STATUS: Record<string, string> = { pending: "Pendente", paid: "Pago", failed: "Falhou", refunded: "Reembolsado" };
const FULFILLMENT_STATUS: Record<string, string> = { unfulfilled: "Não enviado", pending: "Pendente", preparing: "Em preparação", shipped: "Enviado", delivered: "Entregue" };

function key(value: string | null) { return value?.trim().toLowerCase() || "__empty__"; }
function stateLabel(value: string | null, labels: Record<string, string>, kind: string) {
  const raw = value?.trim();
  if (!raw) return `${kind} não registado`;
  return labels[raw.toLowerCase()] ?? `${kind} não reconhecido · ${raw}`;
}
function stateClass(value: string | null, kind: "payment" | "order" | "fulfillment") {
  const normalized = key(value);
  if (kind === "payment" && normalized === "paid") return "border-[#b8cbbd] bg-[#e9eee9] text-[#2c6457]";
  if (kind === "payment" && (normalized === "failed" || normalized === "refunded")) return "border-[#e7c3b8] bg-[#f8e9e4] text-[#9e412c]";
  if (kind === "order" && normalized === "cancelled") return "border-[#e7c3b8] bg-[#f8e9e4] text-[#9e412c]";
  return "border-[#ded9d0] bg-[#fffdf9] text-[#747b73]";
}
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Data inválida" : new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsed); }
function channelLabel(value: string | null) { if (!value) return "Canal não registado"; const known: Record<string, string> = { website: "Loja", store: "Loja", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" }; return known[value.toLowerCase()] ?? value; }

export default function Payments() {
  const { company } = useCompany();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<FilterValue>("all");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    setError(null);
    const queryClient = supabase as unknown as {
      from: (table: string) => LooseQuery;
    };
    const { data, error: queryError } = await queryClient
      .from("orders")
      .select("id,customer_name,total,payment_status,status,fulfillment_status,created_at,channel,payment_method,payment_reference,payment_proof_path,payment_submitted_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (queryError) {
      setError("Não foi possível carregar os estados de pagamento.");
      setOrders([]);
    } else {
      setOrders((data as PaymentOrder[]) ?? []);
    }
    setLoading(false);
  };

  const viewProof = async (id: string) => {
    const w = window.open("", "_blank");
    const { data, error: e } = await supabase.functions.invoke("payment-proof", { body: { order_id: id } });
    if (e || !data?.url) { w?.close(); toast.error("Não foi possível abrir o comprovativo."); return; }
    if (w) w.location.href = data.url; else window.location.href = data.url;
  };
  const setPay = async (id: string, status: "paid" | "failed") => {
    const { error: e } = await supabase.rpc("set_payment_status", { _order: id, _status: status });
    if (e) { toast.error(e.message); return; }
    toast.success(status === "paid" ? "Pagamento confirmado" : "Comprovativo rejeitado");
    void load();
  };

  useEffect(() => { void load(); }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentStatuses = useMemo(() => Array.from(new Set(orders.map((order) => key(order.payment_status)))), [orders]);
  const filteredOrders = useMemo(() => orders.filter((order) => paymentFilter === "all" || key(order.payment_status) === paymentFilter), [orders, paymentFilter]);
  const summary = useMemo(() => ({
    total: orders.length,
    paid: orders.filter((order) => key(order.payment_status) === "paid").length,
    pending: orders.filter((order) => key(order.payment_status) === "pending").length,
    failed: orders.filter((order) => key(order.payment_status) === "failed").length,
  }), [orders]);

  return (
    <AdminLayout title="Pagamentos">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Financeiro & Comprovativos
            </span>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Pagamentos
            </h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
              Valide comprovativos bancários, acompanhe liquidações e audite os estados de pagamento da sua loja.
            </p>
          </div>
          <Link
            to="/admin/pedidos"
            className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            Ver todos os pedidos
          </Link>
        </section>

        {/* 4-KPI SUMMARY METRICS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pedidos Carregados", value: summary.total, tone: "slate" },
            { label: "Pagos / Confirmados", value: summary.paid, tone: "emerald" },
            { label: "Aguardando Pagamento", value: summary.pending, tone: "amber" },
            { label: "Falharam / Rejeitados", value: summary.failed, tone: "rose" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
              <p className={cn(
                "mt-1.5 text-2xl font-bold tracking-tight",
                item.tone === "emerald" && "text-emerald-600",
                item.tone === "amber" && "text-amber-600",
                item.tone === "rose" && "text-rose-600",
                item.tone === "slate" && "text-slate-900",
              )}>
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* FILTER BAR */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Histórico de Liquidações</p>
            <p className="mt-0.5 text-xs text-slate-500">Mostrando os últimos 500 pedidos recebidos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="payment-status-filter">Filtrar por pagamento</label>
            <select
              id="payment-status-filter"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="h-9 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none shadow-2xs focus:border-slate-400"
            >
              <option value="all">Todos os pagamentos</option>
              {paymentStatuses.map((value) => (
                <option key={value} value={value}>
                  {value === "__empty__" ? "Pagamento não registado" : stateLabel(value, PAYMENT_STATUS, "Pagamento")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        {/* ORDERS TABLE */}
        {loading ? (
          <div className="grid min-h-[300px] place-items-center rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              A carregar pedidos e comprovativos...
            </div>
          </div>
        ) : error ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-6">
            <p className="text-sm font-bold text-rose-800">Não foi possível carregar os pagamentos</p>
            <p className="mt-1 text-xs text-slate-600">{error} Confirme o acesso à loja e tente novamente.</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </section>
        ) : filteredOrders.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-base font-bold text-slate-900">Nenhum pagamento encontrado</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Não existem pedidos correspondentes ao filtro selecionado.
            </p>
          </section>
        ) : (
          <section className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Pedido / Cliente</span>
                <span>Total</span>
                <span>Pagamento</span>
                <span>Estado Pedido</span>
                <span>Envio</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <article key={order.id} className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_1fr] gap-4 px-4 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-slate-900">{order.customer_name || "Cliente não registado"}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">#{order.id.slice(0, 8).toUpperCase()} · {channelLabel(order.channel)}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{date(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{formatMoney(order.total, company?.currency ?? "AOA")}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold",
                        key(order.payment_status) === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                        key(order.payment_status) === "pending" ? "bg-amber-50 text-amber-800 border border-amber-200/60" :
                        "bg-rose-50 text-rose-700 border border-rose-200/60"
                      )}>
                        {stateLabel(order.payment_status, PAYMENT_STATUS, "Pagamento")}
                      </span>
                      {order.payment_method && (
                        <p className="text-[10px] text-slate-500 font-medium">{order.payment_method === "iban" ? "Transferência IBAN" : "Express"}{order.payment_reference ? ` · Ref: ${order.payment_reference}` : ""}</p>
                      )}
                      {order.payment_proof_path && (
                        <button type="button" onClick={() => void viewProof(order.id)} className="block text-[11px] font-bold text-emerald-700 hover:underline">
                          Ver Comprovativo ↗
                        </button>
                      )}
                      {key(order.payment_status) !== "paid" && (
                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => void setPay(order.id, "paid")}
                            className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                          >
                            Confirmar
                          </button>
                          {order.payment_proof_path && key(order.payment_status) !== "failed" && (
                            <button
                              type="button"
                              onClick={() => void setPay(order.id, "failed")}
                              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                            >
                              Rejeitar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        order.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                        order.status === "confirmed" ? "bg-sky-50 text-sky-700 border border-sky-200/60" :
                        order.status === "shipped" ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60" :
                        order.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200/60" :
                        "bg-amber-50 text-amber-800 border border-amber-200/60"
                      )}>
                        {stateLabel(order.status, ORDER_STATUS, "Pedido")}
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200/60">
                        {stateLabel(order.fulfillment_status, FULFILLMENT_STATUS, "Fulfillment")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
