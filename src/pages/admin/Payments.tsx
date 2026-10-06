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
        <section className="pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">Loja / Estados financeiros</p>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">Pagamentos</h1>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-[#747b73]">Leitura dos pedidos devolvidos pelo sistema. Pagamento, estado do pedido e fulfillment aparecem separados para não sugerir uma confirmação que não existe.</p>
            <Link to="/admin/pedidos" className="inline-flex h-9 shrink-0 items-center border border-[#ded9d0] bg-[#fffdf9] px-3 text-xs font-semibold text-[#5f625d] hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]">Ver pedidos</Link>
          </div>
        </section>

        <section className="grid gap-px border border-[#ded9d0] bg-[#ded9d0] sm:grid-cols-4">
          {[["Pedidos carregados", summary.total], ["Pagos", summary.paid], ["Pendentes", summary.pending], ["Falharam", summary.failed]].map(([label, value]) => <div key={String(label)} className="bg-[#fffdf9] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858c83]">{label}</p><p className="mt-2 font-serif text-2xl text-[#202522]">{value}</p></div>)}
        </section>

        <div className="flex flex-col gap-3 border border-[#ded9d0] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-[#202522]">Estados por pedido</p><p className="mt-1 text-xs text-[#747b73]">Limite de 500 pedidos recentes. Resumos e filtro são derivados dos status devolvidos.</p></div>
          <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="payment-status-filter">Filtrar por pagamento</label><select id="payment-status-filter" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-9 min-w-36 border border-[#ded9d0] bg-[#fffdf9] px-2.5 text-xs text-[#5f625d] outline-none focus:border-[#2c6457]"><option value="all">Todos os pagamentos</option>{paymentStatuses.map((value) => <option key={value} value={value}>{value === "__empty__" ? "Pagamento não registado" : stateLabel(value, PAYMENT_STATUS, "Pagamento")}</option>)}</select><button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 border border-[#ded9d0] bg-[#f1eee7] px-3 text-xs font-semibold text-[#5f625d] hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"><RefreshCw className="h-3.5 w-3.5" />Atualizar</button></div>
        </div>

        {loading ? <div className="grid min-h-[300px] place-items-center border border-[#ded9d0] bg-[#fffdf9]"><div className="flex items-center gap-3 text-sm text-[#747b73]"><Loader2 className="h-4 w-4 animate-spin" />A carregar pedidos...</div></div> : error ? <section className="border border-[#e7c3b8] bg-[#fff8f5] p-6"><p className="text-sm font-semibold text-[#9e412c]">Não foi possível mostrar os pagamentos</p><p className="mt-2 text-sm leading-6 text-[#747b73]">{error} Confirme o acesso à loja e tente novamente.</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex h-9 items-center gap-2 bg-[#202522] px-3 text-xs font-semibold text-white hover:bg-[#2c6457]"><RefreshCw className="h-3.5 w-3.5" />Tentar novamente</button></section> : filteredOrders.length === 0 ? <section className="border border-dashed border-[#cfc9bd] bg-[#fffdf9] p-10 text-center"><CreditCard className="mx-auto h-5 w-5 text-[#9aa198]" /><p className="mt-4 font-serif text-xl text-[#202522]">Nenhum pedido neste recorte</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747b73]">Não existem pedidos com o filtro selecionado. Esta página é somente leitura: não cobra, reembolsa nem reconcilia pagamentos.</p></section> : <section className="overflow-x-auto border border-[#ded9d0] bg-[#fffdf9]"><div className="min-w-[760px]"><div className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_1fr] gap-4 border-b border-[#ded9d0] bg-[#f1eee7] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#858c83]"><span>Pedido / cliente</span><span>Total</span><span>Pagamento</span><span>Pedido</span><span>Fulfillment</span></div>{filteredOrders.map((order) => <article key={order.id} className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_1fr] gap-4 border-b border-[#ebe7df] px-4 py-4 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#202522]">{order.customer_name || "Cliente não registado"}</p><p className="mt-1 font-mono text-[10px] text-[#9aa198]">#{order.id.slice(0, 8).toUpperCase()} · {channelLabel(order.channel)}</p><p className="mt-1 text-[10px] text-[#a0a59e]">{date(order.created_at)}</p></div><p className="text-sm font-semibold text-[#202522]">{formatMoney(order.total, company?.currency ?? "AOA")}</p><div className="space-y-1.5"><span className={cn("h-fit w-fit border px-2 py-1 text-[10px] font-semibold", stateClass(order.payment_status, "payment"))}>{stateLabel(order.payment_status, PAYMENT_STATUS, "Pagamento")}</span>{order.payment_method && <p className="text-[10px] text-muted-foreground">{order.payment_method === "iban" ? "IBAN" : "Express"}{order.payment_reference ? ` · ${order.payment_reference}` : ""}</p>}{order.payment_proof_path && <button type="button" onClick={() => void viewProof(order.id)} className="block text-[11px] font-semibold text-primary underline">Ver comprovativo</button>}{key(order.payment_status) !== "paid" && <div className="flex gap-1"><button type="button" onClick={() => void setPay(order.id, "paid")} className="border border-border bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">Confirmar</button>{order.payment_proof_path && key(order.payment_status) !== "failed" && <button type="button" onClick={() => void setPay(order.id, "failed")} className="border border-border px-2 py-1 text-[10px] font-semibold">Rejeitar</button>}</div>}</div><span className={cn("h-fit w-fit border px-2 py-1 text-[10px] font-semibold", stateClass(order.status, "order"))}>{stateLabel(order.status, ORDER_STATUS, "Pedido")}</span><span className={cn("h-fit w-fit border px-2 py-1 text-[10px] font-semibold", stateClass(order.fulfillment_status, "fulfillment"))}>{stateLabel(order.fulfillment_status, FULFILLMENT_STATUS, "Fulfillment")}</span></article>)}</div></section>}
      </div>
    </AdminLayout>
  );
}
