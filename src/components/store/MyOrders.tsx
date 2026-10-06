import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { getMyOrders } from "@/lib/myOrders";

export function MyOrders({ slug }: { slug: string }) {
  const orders = getMyOrders(slug).slice(0, 5);
  if (!orders.length) return null;
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-card p-3 text-sm">
        <Receipt className="h-4 w-4 text-primary" />
        <span className="font-semibold">Os meus pedidos:</span>
        {orders.map((o) => (
          <Link key={o.id} to={`/loja/${slug}/pedido/${o.id}`} className="rounded border border-border px-2 py-1 font-mono text-xs hover:bg-muted">
            #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.at).toLocaleDateString("pt-PT")}
          </Link>
        ))}
      </div>
    </section>
  );
}
