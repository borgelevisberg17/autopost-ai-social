import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, formatMoney } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

export default function OrderStatus() {
  const { slug = "", id = "" } = useParams();
  const [order, setOrder] = useState<{ status: string; total: number; created_at: string; customer_name: string } | null>(null);
  const [currency, setCurrency] = useState("AOA");

  useEffect(() => {
    supabase.rpc("get_order_status", { _order: id }).then(({ data }) => setOrder(data?.[0] ?? null));
    supabase.from("companies").select("currency").eq("slug", slug).maybeSingle().then(({ data }) => data && setCurrency(data.currency));
  }, [id, slug]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
        {order ? <>
          <h1 className="font-display text-2xl font-bold mb-2">Obrigado, {order.customer_name}!</h1>
          <p className="text-muted-foreground mb-4">Guarde este link para acompanhar o pedido.</p>
          <p className="text-sm">Estado: <span className="font-semibold">{ORDER_STATUS[order.status] ?? order.status}</span></p>
          <p className="text-sm">Total: <span className="font-semibold">{formatMoney(order.total, currency)}</span></p>
          <p className="text-xs text-muted-foreground mt-2">{new Date(order.created_at).toLocaleString("pt-PT")}</p>
        </> : <p className="text-muted-foreground">Pedido não encontrado.</p>}
        <Link to={`/loja/${slug}`} className="inline-block mt-6 text-primary">Voltar à loja</Link>
      </div>
    </div>
  );
}
