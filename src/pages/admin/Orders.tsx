import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, ORDER_STATUS } from "@/lib/format";
import { toast } from "sonner";

type Order = { id: string; customer_name: string; customer_phone: string | null; customer_email: string | null; notes: string | null; channel: string; status: string; total: number; created_at: string; order_items: { product_name: string; quantity: number; unit_price: number }[] };

export default function Orders() {
  const { company } = useCompany();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("orders").select("*, order_items(product_name,quantity,unit_price)").eq("company_id", company.id).order("created_at", { ascending: false }).limit(200);
    setOrders((data as Order[]) ?? []);
  };
  useEffect(() => { load(); }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (o: Order, status: string) => {
    if (o.status === "cancelled") return toast.error("Pedido cancelado não pode ser reaberto");
    if (status === "cancelled" && !confirm("Cancelar este pedido? O stock será reposto.")) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    load();
  };

  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <AdminLayout title="Pedidos">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {[["all", "Todos"], ...Object.entries(ORDER_STATUS)].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${filter === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{v}</button>
        ))}
      </div>
      {list.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">Sem pedidos.</div> : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-PT")} · {o.channel} · {o.customer_phone || o.customer_email || "sem contacto"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold">{formatMoney(o.total, company?.currency)}</span>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value)} disabled={o.status === "cancelled"} className="rounded-lg bg-secondary px-2 py-1 text-sm">
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground">{o.order_items.map((i, idx) => <li key={idx}>{i.quantity}× {i.product_name} — {formatMoney(i.unit_price, company?.currency)}</li>)}</ul>
              {o.notes && <p className="text-sm mt-2 italic">“{o.notes}”</p>}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
