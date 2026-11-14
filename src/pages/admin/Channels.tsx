import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Box,
  Check,
  CircleAlert,
  ExternalLink,
  Facebook,
  Globe2,
  ImageOff,
  Instagram,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  Unplug,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Provider = "website" | "instagram" | "facebook" | "whatsapp";
type ChannelTab = "products" | "orders" | "connection";

type Connection = {
  id: string;
  provider: Provider;
  account_id: string | null;
  account_name: string | null;
  status: string;
  last_synced_at: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  promo_price: number | null;
  stock: number;
  images: string[];
  active: boolean;
};

type OrderItem = {
  product_name: string;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  channel: string;
  order_items: OrderItem[] | null;
};

type ChannelDefinition = {
  id: Provider;
  label: string;
  description: string;
  icon: typeof Globe2;
  tone: string;
  available: boolean;
};

const CHANNELS: ChannelDefinition[] = [
  {
    id: "website",
    label: "Loja Online",
    description: "A sua montra digital oficial e checkout público integrado.",
    icon: Globe2,
    tone: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
    available: true,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Business",
    description: "Atendimento conversacional inteligente e pedidos assistidos.",
    icon: MessageCircle,
    tone: "bg-teal-50 text-teal-600 ring-1 ring-teal-200/50",
    available: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Descoberta de produtos e catálogo social no Instagram.",
    icon: Instagram,
    tone: "bg-pink-50 text-pink-600 ring-1 ring-pink-200/50",
    available: false,
  },
  {
    id: "facebook",
    label: "Facebook Shop",
    description: "Sincronização de catálogo e pedidos via Meta Commerce.",
    icon: Facebook,
    tone: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50",
    available: false,
  },
];

const TABS: { id: ChannelTab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Produtos", icon: Package },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "connection", label: "Ligação", icon: Settings2 },
];

function statusFor(
  channel: ChannelDefinition,
  connection?: Connection,
  connectionError = false,
  connectionLoading = false,
) {
  if (channel.id === "website") {
    return { label: "Loja pública", tone: "positive" as const };
  }

  if (connectionLoading) {
    return { label: "A verificar ligação", tone: "neutral" as const };
  }

  if (connectionError) {
    return { label: "Estado indisponível", tone: "warning" as const };
  }

  if (connection?.status.toLowerCase() === "connected") {
    return { label: "Ligado", tone: "positive" as const };
  }

  if (
    connection &&
    ["error", "expired", "failed", "revoked"].includes(
      connection.status.toLowerCase(),
    )
  ) {
    return { label: "Requer atenção", tone: "warning" as const };
  }

  return {
    label: channel.available ? "Disponível" : "Não ligado",
    tone: "neutral" as const,
  };
}

function statusClass(tone: "positive" | "warning" | "neutral") {
  if (tone === "positive")
    return "border-emerald-200 bg-emerald-50/80 text-emerald-700";
  if (tone === "warning")
    return "border-amber-200 bg-amber-50/80 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatSync(value: string | null) {
  if (!value) return "Ainda sem sincronização";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return labels[status.toLowerCase()] ?? status;
}

function orderStatusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  if (value === "confirmed" || value === "shipped") return "bg-sky-50 text-sky-700 border border-sky-200/80";
  if (value === "cancelled") return "bg-rose-50 text-rose-700 border border-rose-200/80";
  return "bg-amber-50 text-amber-800 border border-amber-200/80";
}

function ProductCard({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images?.find(Boolean);
  const hasImage = Boolean(image && !imageFailed);
  const discounted =
    product.promo_price != null && product.promo_price < product.price;
  const price = product.promo_price ?? product.price;
  const stockText =
    product.stock <= 0
      ? "Sem stock"
      : product.stock <= 5
        ? `Stock baixo · ${product.stock}`
        : `${product.stock} em stock`;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {hasImage ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">
            <ImageOff
              aria-hidden="true"
              className="h-8 w-8"
              strokeWidth={1.5}
            />
          </div>
        )}
        <span
          className={cn(
            "absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-xs backdrop-blur-xs",
            product.stock <= 5
              ? "bg-amber-500/90 text-white"
              : "bg-slate-900/80 text-white",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              product.stock <= 5 ? "bg-amber-200" : "bg-emerald-400",
            )}
          />
          {stockText}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-sm font-semibold text-slate-900">
            {product.name}
          </h3>
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border",
              product.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500",
            )}
          >
            {product.active ? "Ativo" : "Pausado"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-400 font-medium">
          {product.category || product.sku || "Produto Vendora"}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-base font-bold text-slate-900">
            {formatMoney(Number(price), currency)}
          </span>
          {discounted && (
            <span className="text-xs text-slate-400 line-through">
              {formatMoney(Number(product.price), currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full whitespace-nowrap px-2.5 py-0.5 text-[10px] font-medium",
        orderStatusClass(status),
      )}
    >
      {orderStatusLabel(status)}
    </span>
  );
}

export default function Channels() {
  const { company } = useCompany();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [connectionsError, setConnectionsError] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider>("website");
  const [activeTab, setActiveTab] = useState<ChannelTab>("products");
  const [productQuery, setProductQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const connectionMap = useMemo(
    () =>
      new Map(
        connections.map((connection) => [connection.provider, connection]),
      ),
    [connections],
  );
  const selectedChannel =
    CHANNELS.find((channel) => channel.id === selectedProvider) ?? CHANNELS[0];
  const selectedConnection = connectionMap.get(selectedProvider);
  const selectedStatus = statusFor(
    selectedChannel,
    selectedConnection,
    connectionsError,
    connectionsLoading,
  );
  const currency = company?.currency || "EUR";
  const usesCentralStoreData = selectedProvider !== "website";
  const ordersSourceLabel = usesCentralStoreData ? "Loja Vendora" : "Loja online";

  const filteredProducts = useMemo(() => {
    const search = productQuery.trim().toLocaleLowerCase("pt");
    if (!search) return products;
    return products.filter((product) =>
      [product.name, product.category, product.sku]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("pt").includes(search)),
    );
  }, [products, productQuery]);

  useEffect(() => {
    const companyId = company?.id;
    if (!companyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setConnectionsLoading(true);
      const [connectionResult, productResult] = await Promise.all([
        supabase
          .from("social_connections")
          .select("id,provider,account_id,account_name,status,last_synced_at")
          .eq("company_id", companyId)
          .order("provider"),
        supabase
          .from("products")
          .select("id,name,sku,category,price,promo_price,stock,images,active")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (connectionResult.error) {
        toast.error("Não foi possível carregar o estado das plataformas.");
        setConnectionsError(true);
        setConnections([]);
      } else {
        setConnectionsError(false);
        setConnections((connectionResult.data as Connection[]) ?? []);
      }

      if (productResult.error) {
        toast.error("Não foi possível carregar o catálogo.");
        setProductsError(true);
        setProducts([]);
      } else {
        setProductsError(false);
        setProducts((productResult.data as Product[]) ?? []);
      }

      setConnectionsLoading(false);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [company?.id, refreshKey]);

  useEffect(() => {
    const companyId = company?.id;
    if (!companyId) return;

    let cancelled = false;

    async function loadOrders() {
      setOrdersLoading(true);
      let query = supabase
        .from("orders")
        .select(
          "id,customer_name,total,status,created_at,channel,order_items(product_name,quantity)",
          { count: "exact" },
        )
        .eq("company_id", companyId);

      if (selectedProvider === "website") {
        query = query.in("channel", ["website", "store"]);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled) return;

      if (error) {
        toast.error("Não foi possível carregar os pedidos da loja.");
        setOrdersError(true);
        setOrders([]);
        setOrderCount(0);
      } else {
        setOrdersError(false);
        setOrders((data as Order[]) ?? []);
        setOrderCount(count ?? 0);
      }

      setOrdersLoading(false);
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [company?.id, selectedProvider, refreshKey]);

  const disconnect = async (connection: Connection) => {
    if (!company?.id) return;
    setDisconnecting(connection.id);
    const { error } = await supabase
      .from("social_connections")
      .delete()
      .eq("id", connection.id)
      .eq("company_id", company.id);
    setDisconnecting(null);

    if (error) {
      toast.error("Não foi possível desligar o canal.");
      return;
    }

    setConnections((current) =>
      current.filter((item) => item.id !== connection.id),
    );
    toast.success("Canal desligado.");
  };

  const selectedPlatformIsActive: boolean | null =
    selectedProvider === "website"
      ? true
      : connectionsLoading || connectionsError
        ? null
        : selectedConnection?.status.toLowerCase() === "connected";
  const selectedPlatformNeedsAttention =
    selectedProvider !== "website" &&
    !connectionsLoading &&
    !connectionsError &&
    Boolean(
      selectedConnection &&
        ["error", "expired", "failed", "revoked"].includes(
          selectedConnection.status.toLowerCase(),
        ),
    );
  const Icon = selectedChannel.icon;

  return (
    <AdminLayout
      title="Canais"
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading || ordersLoading}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (loading || ordersLoading) && "animate-spin",
            )}
          />
          Atualizar
        </button>
      }
    >
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              CANAIS & DISTRIBUIÇÃO
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Plataformas de Venda
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Controle a presença omnicanal, catálogo e pedidos por origem num só lugar.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {CHANNELS.length} plataformas configuradas
          </span>
        </section>

        {/* CHANNELS GRID */}
        <section aria-label="Selecionar plataforma" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => {
            const ChannelIcon = channel.icon;
            const connection = connectionMap.get(channel.id);
            const state = statusFor(
              channel,
              connection,
              connectionsError,
              connectionsLoading,
            );
            const selected = selectedProvider === channel.id;

            return (
              <button
                key={channel.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSelectedProvider(channel.id);
                  setActiveTab("products");
                }}
                className={cn(
                  "relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                  selected
                    ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-sm"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        channel.tone,
                      )}
                    >
                      <ChannelIcon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        statusClass(state.tone),
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          state.tone === "positive"
                            ? "bg-emerald-500"
                            : state.tone === "warning"
                              ? "bg-amber-500"
                              : "bg-slate-400",
                        )}
                      />
                      {state.label}
                    </span>
                  </div>
                  <h3 className="mt-3 font-sans text-sm font-bold text-slate-900">
                    {channel.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {channel.description}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* ACTIVE CHANNEL DETAILS */}
        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
                      selectedChannel.tone,
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-sans text-lg font-bold text-slate-900">
                      {selectedChannel.label}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {connectionsError && selectedProvider !== "website"
                        ? "Estado de sincronização indisponível"
                        : selectedConnection?.last_synced_at
                          ? `Última sincronização ${formatSync(selectedConnection.last_synced_at)}`
                          : selectedProvider === "website"
                            ? "Montra pública ativa na infraestrutura Vendora"
                            : "Nenhuma sincronização registada"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedProvider === "website" ? (
                    <a
                      href={`/loja/${company?.slug ?? ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      Abrir Loja <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : selectedConnection?.status === "connected" ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("connection")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      Gerir canal <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* TABS */}
              <div
                className="mt-5 flex gap-1 border-t border-slate-100 pt-4"
                role="tablist"
                aria-label="Secções do canal"
              >
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition",
                        selected
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <TabIcon aria-hidden="true" className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </article>

            {activeTab === "products" && (
              <section
                role="tabpanel"
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {usesCentralStoreData ? "Catálogo Central da Loja" : "Montra da Loja Online"}
                    </span>
                    <h2 className="mt-1 font-sans text-lg font-bold text-slate-900">
                      Produtos Disponíveis
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {loading
                        ? "A carregar catálogo..."
                        : `${products.length} produtos registados na loja Vendora`}
                    </p>
                  </div>
                  <Link
                    to="/admin/produtos"
                    className="group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                  >
                    Gerir catálogo{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                {selectedProvider !== "website" && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/60 p-3.5 text-xs leading-relaxed text-amber-900">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                    />
                    <p>
                      Estes são os produtos da sua loja Vendora apresentados como referência. A sincronização de inventário bidirecional para {selectedChannel.label} está em fase de expansão.
                    </p>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  />
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Pesquisar por nome, categoria ou referência..."
                    aria-label="Pesquisar produtos do catálogo"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse overflow-hidden rounded-xl border border-slate-200/80 bg-white"
                      >
                        <div className="aspect-[4/3] bg-slate-100" />
                        <div className="space-y-2 p-4">
                          <div className="h-3.5 w-2/3 rounded-full bg-slate-200" />
                          <div className="h-3 w-1/3 rounded-full bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <DataError
                    message="Não foi possível carregar o catálogo. Tente novamente."
                    onRetry={() => setRefreshKey((current) => current + 1)}
                  />
                ) : filteredProducts.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                    <Box
                      aria-hidden="true"
                      className="mb-3 h-8 w-8 text-slate-300"
                    />
                    <p className="text-sm font-semibold text-slate-900">
                      {products.length === 0
                        ? "Ainda não há produtos no catálogo"
                        : "Nenhum produto encontrado"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm">
                      {products.length === 0
                        ? "Adicione produtos ao catálogo Vendora para poder distribuí-los em todos os canais."
                        : "Tente outro termo ou limpe a pesquisa."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={currency}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "orders" && (
              <section
                role="tabpanel"
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div className="mb-4 flex items-end justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Origem / {ordersSourceLabel}
                    </span>
                    <h2 className="mt-1 font-sans text-lg font-bold text-slate-900">
                      {usesCentralStoreData ? "Pedidos da Loja" : "Pedidos da Loja Online"}
                    </h2>
                  </div>
                  <Link
                    to="/admin/pedidos"
                    className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Ver todos{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                {ordersLoading ? (
                  <div
                    className="space-y-3 py-4"
                    aria-label="A carregar pedidos"
                  >
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-lg bg-slate-100"
                      />
                    ))}
                  </div>
                ) : ordersError ? (
                  <DataError
                    message="Não foi possível carregar os pedidos da loja. Tente novamente."
                    onRetry={() => setRefreshKey((current) => current + 1)}
                  />
                ) : orders.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                    <ShoppingBag
                      aria-hidden="true"
                      className="mb-3 h-8 w-8 text-slate-300"
                    />
                    <p className="text-sm font-semibold text-slate-900">
                      Sem pedidos registados
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Os pedidos recebidos através da {ordersSourceLabel} aparecerão aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        currency={currency}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "connection" && (
              <section
                role="tabpanel"
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div className="mb-4 border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Sistema & Conexões
                  </span>
                  <h2 className="mt-1 font-sans text-lg font-bold text-slate-900">
                    Estado da Integração
                  </h2>
                </div>
                {selectedProvider === "website" ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Check aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Loja Pública Vendora Ativa
                      </p>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600">
                        A sua loja opera na infraestrutura de alta disponibilidade da Vendora com catálogo partilhado, checkout nativo e pedidos em tempo real. Não requer configuração adicional.
                      </p>
                      <a
                        href={`/loja/${company?.slug ?? ""}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Abrir loja pública{" "}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ) : connectionsLoading ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
                    <Loader2
                      aria-hidden="true"
                      className="mb-3 h-6 w-6 animate-spin text-slate-400"
                    />
                    <p className="text-sm font-semibold text-slate-900">
                      A verificar a ligação...
                    </p>
                    <p className="mt-1 max-w-md text-xs text-slate-500">
                      A consultar o estado da integração com os servidores da Meta.
                    </p>
                  </div>
                ) : connectionsError ? (
                  <DataError
                    message="Não foi possível verificar a ligação desta plataforma. Atualize para consultar novamente."
                    onRetry={() => setRefreshKey((current) => current + 1)}
                  />
                ) : selectedConnection ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCell
                        label="Conta"
                        value={
                          selectedConnection.account_name ||
                          "Nome não fornecido"
                        }
                      />
                      <InfoCell
                        label="ID da conta"
                        value={selectedConnection.account_id || "Não fornecido"}
                      />
                      <InfoCell
                        label="Estado"
                        value={
                          statusFor(selectedChannel, selectedConnection).label
                        }
                      />
                      {selectedConnection.last_synced_at && (
                        <InfoCell
                          label="Última sincronização"
                          value={formatSync(selectedConnection.last_synced_at)}
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                      <p className="max-w-lg text-xs text-slate-500">
                        A ligação e a data de sincronização são atualizadas automaticamente através do webhook oficial.
                      </p>
                      <button
                        type="button"
                        onClick={() => void disconnect(selectedConnection)}
                        disabled={disconnecting === selectedConnection.id}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {disconnecting === selectedConnection.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unplug className="h-3.5 w-3.5" />
                        )}
                        {disconnecting === selectedConnection.id
                          ? "A desligar..."
                          : "Desligar canal"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
                    <CircleAlert
                      aria-hidden="true"
                      className="mb-3 h-8 w-8 text-slate-300"
                    />
                    <p className="text-sm font-semibold text-slate-900">
                      Integração disponível em breve
                    </p>
                    <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                      O canal {selectedChannel.label} está preparado para receber sincronização de produtos via Meta Commerce API assim que o protocolo for ativado na sua conta.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Resumo de Atividade
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                    selectedPlatformNeedsAttention
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : selectedPlatformIsActive === true
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selectedPlatformNeedsAttention
                        ? "bg-amber-500"
                        : selectedPlatformIsActive === true
                          ? "bg-emerald-500"
                          : "bg-slate-400",
                    )}
                  />
                  {connectionsLoading && selectedProvider !== "website"
                    ? "A verificar"
                    : selectedPlatformNeedsAttention
                    ? "Atenção"
                    : selectedPlatformIsActive === null
                      ? "Indisponível"
                      : selectedPlatformIsActive
                        ? "Ativo"
                        : "Não ligado"}
                </span>
              </div>
              <h2 className="mt-2 font-sans text-base font-bold text-slate-900">
                Registo de Pedidos
              </h2>
              <div className="mt-3 border-y border-slate-100 py-3.5">
                {ordersLoading ? (
                  <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
                ) : ordersError ? (
                  <p className="font-sans text-3xl font-bold text-slate-300">
                    —
                  </p>
                ) : (
                  <p className="font-sans text-3xl font-bold tracking-tight text-slate-900">
                    {orderCount}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {usesCentralStoreData
                    ? "Pedidos registados no sistema central da loja."
                    : "Pedidos com origem direta na loja online."}
                </p>
              </div>
              <Link
                to="/admin/pedidos"
                className="group mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Abrir pedidos{" "}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </section>

            {activeTab !== "orders" && (
              <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Pedidos Recentes
                    </span>
                    <h2 className="mt-0.5 font-sans text-sm font-bold text-slate-900">
                      Últimas Vendas
                    </h2>
                  </div>
                  <Link
                    to="/admin/pedidos"
                    aria-label="Ver todos os pedidos"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {ordersLoading ? (
                  <div
                    className="space-y-2 py-2"
                    aria-label="A carregar pedidos recentes"
                  >
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-12 animate-pulse rounded-lg bg-slate-100"
                      />
                    ))}
                  </div>
                ) : ordersError ? (
                  <p className="py-4 text-xs text-rose-600">
                    Não foi possível consultar os pedidos.
                  </p>
                ) : orders.length === 0 ? (
                  <p className="py-4 text-xs text-slate-500 text-center">
                    Ainda não há pedidos associados à {ordersSourceLabel}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-start gap-2.5 py-2.5 first:pt-1 last:pb-1"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                          <ShoppingBag
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-slate-900">
                              #{order.id.slice(0, 6).toUpperCase()}
                            </span>
                            <OrderStatus status={order.status} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {order.customer_name || "Cliente"} ·{" "}
                            <span className="font-semibold text-slate-900">{formatMoney(Number(order.total), currency)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

function DataError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
      <CircleAlert aria-hidden="true" className="mb-2 h-6 w-6 text-rose-500" />
      <p className="max-w-md text-xs text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-xs font-semibold text-slate-900 underline hover:text-slate-600"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-sans text-xs font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function OrderRow({ order, currency }: { order: Order; currency: string }) {
  const items = (order.order_items ?? []).reduce(
    (count, item) => count + item.quantity,
    0,
  );

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)_100px_100px] sm:gap-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
        <ShoppingBag aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">
          {order.customer_name || "Cliente"}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
        </p>
      </div>
      <div className="hidden text-xs text-slate-500 sm:block">
        {items} {items === 1 ? "artigo" : "artigos"}
      </div>
      <div className="text-right">
        <p className="font-sans text-sm font-bold text-slate-900">
          {formatMoney(Number(order.total), currency)}
        </p>
        <div className="mt-1 flex justify-end">
          <OrderStatus status={order.status} />
        </div>
      </div>
    </div>
  );
}
