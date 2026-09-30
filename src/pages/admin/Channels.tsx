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
    label: "Loja online",
    description: "A loja pública e o checkout da Vendora.",
    icon: Globe2,
    tone: "bg-[#e9eee9] text-[#2c6457]",
    available: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Produtos e descoberta através do Instagram.",
    icon: Instagram,
    tone: "bg-[#f5e7e2] text-[#b94e37]",
    available: false,
  },
  {
    id: "facebook",
    label: "Facebook Shop",
    description: "Catálogo e pedidos através do Facebook e Instagram.",
    icon: Facebook,
    tone: "bg-[#e8edf2] text-[#385d78]",
    available: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Conversas e pedidos assistidos pelo WhatsApp.",
    icon: MessageCircle,
    tone: "bg-[#e5efea] text-[#28725d]",
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
) {
  if (channel.id === "website") {
    return { label: "Loja pública", tone: "positive" as const };
  }

  if (connectionError) {
    return { label: "Estado indisponível", tone: "warning" as const };
  }

  if (connection?.status === "connected") {
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
    return "border-[#d5e1d5] bg-[#edf2e9] text-[#2c6457]";
  if (tone === "warning") return "border-[#ead7ca] bg-[#f8eee6] text-[#a44d2e]";
  return "border-[#e4e0d7] bg-[#f8f7f1] text-[#737a72]";
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
  if (value === "completed" || value === "shipped") {
    return "bg-[#edf2e9] text-[#2c6457]";
  }
  if (value === "cancelled") return "bg-[#f8eee6] text-[#a44d2e]";
  return "bg-[#f1eee7] text-[#666e66]";
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
    <article className="group overflow-hidden rounded-[4px] border border-[#e6e2d9] bg-[#fffdf9] transition hover:border-[#c9d0c5]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#efede5]">
        {hasImage ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[#9ca295]">
            <ImageOff
              aria-hidden="true"
              className="h-7 w-7"
              strokeWidth={1.4}
            />
          </div>
        )}
        <span
          className={cn(
            "absolute bottom-2 left-2 inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-medium shadow-sm",
            product.stock <= 5
              ? "border-[#ead7ca] bg-[#fff9f4] text-[#a44d2e]"
              : "border-[#d5e1d5] bg-[#f8fbf6] text-[#2c6457]",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              product.stock <= 5 ? "bg-[#bd592f]" : "bg-[#477b55]",
            )}
          />
          {stockText}
        </span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-h-10 font-serif text-[15px] font-medium leading-5 text-[#202522]">
            {product.name}
          </h3>
          <span
            className={cn(
              "mt-0.5 shrink-0 border px-1.5 py-0.5 text-[9px]",
              product.active
                ? "border-[#e2e7dd] bg-[#f1f3ed] text-[#647460]"
                : "border-[#e4e0d7] bg-[#f6f3ed] text-[#858c83]",
            )}
          >
            {product.active ? "Ativo" : "Pausado"}
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] text-[#858c83]">
          {product.category || product.sku || "Produto Vendora"}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-[16px] font-medium text-[#202522]">
            {formatMoney(Number(price), currency)}
          </span>
          {discounted && (
            <span className="text-[11px] text-[#92978e] line-through">
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
        "inline-flex whitespace-nowrap px-2 py-1 text-[9px] font-medium",
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
  );
  const currency = company?.currency || "EUR";

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
      } else {
        query = query.ilike("channel", selectedProvider);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .limit(5);

      if (cancelled) return;

      if (error) {
        toast.error("Não foi possível carregar os pedidos deste canal.");
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
      : connectionsError
        ? null
        : selectedConnection?.status === "connected";
  const Icon = selectedChannel.icon;

  return (
    <AdminLayout
      title="Canais"
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading || ordersLoading}
          className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-[#e3dfd6] bg-[#fffdf9] px-3 text-xs font-semibold text-[#525c54] transition hover:border-[#b9c6b7] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="space-y-5 sm:space-y-6">
        <section className="flex flex-col justify-between gap-3 border-b border-[#e4e0d7] pb-5 sm:flex-row sm:items-end sm:pb-6">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#718071]">
              Plataformas / Distribuição
            </p>
            <h2 className="font-serif text-[29px] font-medium leading-tight tracking-[-0.045em] text-[#202522] sm:text-[37px]">
              Acompanhe os seus canais.
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#697168] sm:text-sm sm:leading-6">
              Estado das plataformas, catálogo da loja e pedidos por origem num
              só lugar.
            </p>
          </div>
          <span className="text-[11px] text-[#858c83]">
            {CHANNELS.length} plataformas alvo
          </span>
        </section>

        <section
          aria-label="Selecionar plataforma"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {CHANNELS.map((channel) => {
            const ChannelIcon = channel.icon;
            const connection = connectionMap.get(channel.id);
            const state = statusFor(channel, connection, connectionsError);
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
                  "min-w-0 rounded-[4px] border p-3 text-left transition sm:p-3.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]",
                  selected
                    ? "border-[#aebba9] bg-[#edf0e8] shadow-[inset_0_0_0_1px_#aebba9]"
                    : "border-[#e4e0d7] bg-[#fffdf9] hover:border-[#c9d0c5] hover:bg-white",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      channel.tone,
                    )}
                  >
                    <ChannelIcon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[#202522]">
                      {channel.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block truncate text-[10px]",
                        state.tone === "positive"
                          ? "text-[#2c6457]"
                          : state.tone === "warning"
                            ? "text-[#a44d2e]"
                            : "text-[#858c83]",
                      )}
                    >
                      {state.label}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </section>

        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <article className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-[10px] text-[#858c83]">
                <Link
                  to="/admin/canais"
                  className="transition hover:text-[#202522]"
                >
                  Canais
                </Link>
                <span aria-hidden="true">/</span>
                <span className="font-medium text-[#525c54]">
                  {selectedChannel.label}
                </span>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-full sm:h-14 sm:w-14",
                      selectedChannel.tone,
                    )}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-[22px] font-medium tracking-[-0.035em] text-[#202522] sm:text-[27px]">
                      {selectedChannel.label}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#737a72]">
                      {selectedChannel.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#eeeae2] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium",
                        statusClass(selectedStatus.tone),
                      )}
                    >
                      {selectedStatus.tone === "positive" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <CircleAlert className="h-3 w-3" />
                      )}
                      {selectedStatus.label}
                    </span>
                    <p className="mt-1.5 text-[10px] text-[#858c83]">
                      {connectionsError && selectedProvider !== "website"
                        ? "Estado de sincronização indisponível"
                        : selectedConnection?.last_synced_at
                          ? `Última sincronização ${formatSync(selectedConnection.last_synced_at)}`
                          : selectedProvider === "website"
                            ? "Loja pública da Vendora"
                            : "Sem sincronização registada"}
                    </p>
                  </div>
                  {selectedProvider === "website" ? (
                    <a
                      href={`/loja/${company?.slug ?? ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[#e3dfd6] bg-[#fffdf9] px-3 text-[11px] font-semibold text-[#39423a] transition hover:bg-[#f4f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                    >
                      Abrir loja <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : selectedConnection?.status === "connected" ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("connection")}
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[#e3dfd6] bg-[#fffdf9] px-3 text-[11px] font-semibold text-[#39423a] transition hover:bg-[#f4f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                    >
                      Gerir canal <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="max-w-[150px] text-[10px] leading-4 text-[#858c83]">
                      Gestão de ligação ainda não disponível
                    </span>
                  )}
                </div>
              </div>
            </article>

            <div
              className="flex overflow-x-auto border-b border-[#e4e0d7]"
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
                      "inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 px-4 text-xs transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2c6457]",
                      selected
                        ? "border-[#ad6b43] font-semibold text-[#202522]"
                        : "border-transparent text-[#737a72] hover:text-[#202522]",
                    )}
                  >
                    <TabIcon aria-hidden="true" className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "products" && (
              <section
                role="tabpanel"
                className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5"
              >
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#ece8df] pb-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7f897e]">
                      Catálogo central
                    </p>
                    <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522] sm:text-xl">
                      Produtos da loja
                    </h2>
                    <p className="mt-1 text-[11px] text-[#858c83]">
                      {loading
                        ? "A carregar catálogo..."
                        : `${products.length} produtos no catálogo Vendora`}
                    </p>
                  </div>
                  <Link
                    to="/admin/produtos"
                    className="group inline-flex h-9 shrink-0 items-center justify-center gap-2 border border-[#d9dfd3] bg-[#edf0e8] px-3 text-[11px] font-semibold text-[#2d4f3d] transition hover:bg-[#e4e9df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  >
                    Gerir catálogo{" "}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                {selectedProvider !== "website" && (
                  <div className="mb-4 flex items-start gap-2.5 border border-[#e8e4da] bg-[#f8f7f1] p-3 text-[11px] leading-5 text-[#687168]">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9a805d]"
                    />
                    <p>
                      Este é o catálogo central da Vendora. O estado de
                      sincronização individual por produto não está disponível
                      para esta plataforma.
                    </p>
                  </div>
                )}

                <label className="mb-4 flex h-10 items-center gap-2 border border-[#e4e0d7] bg-[#fffdf9] px-3 focus-within:border-[#9eae9b]">
                  <Search
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-[#858c83]"
                  />
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Pesquisar produtos..."
                    aria-label="Pesquisar produtos do catálogo"
                    className="min-w-0 flex-1 bg-transparent text-xs text-[#202522] outline-none placeholder:text-[#9a9e96]"
                  />
                </label>

                {loading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse overflow-hidden border border-[#eeeae2]"
                      >
                        <div className="aspect-[4/3] bg-[#f0efe9]" />
                        <div className="space-y-2 p-3.5">
                          <div className="h-3 w-2/3 bg-[#f0efe9]" />
                          <div className="h-3 w-1/3 bg-[#f0efe9]" />
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
                      className="mb-3 h-6 w-6 text-[#a7ada2]"
                    />
                    <p className="text-sm font-medium text-[#525c54]">
                      {products.length === 0
                        ? "Ainda não há produtos"
                        : "Nenhum produto encontrado"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#858c83]">
                      {products.length === 0
                        ? "Adicione produtos ao catálogo Vendora para os acompanhar aqui."
                        : "Tente outro termo de pesquisa."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5"
              >
                <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#ece8df] pb-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7f897e]">
                      Origem / {selectedChannel.label}
                    </p>
                    <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522] sm:text-xl">
                      Pedidos deste canal
                    </h2>
                  </div>
                  <Link
                    to="/admin/pedidos"
                    className="group inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#687168] hover:text-[#202522]"
                  >
                    Ver todos{" "}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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
                        className="h-12 animate-pulse bg-[#f0efe9]"
                      />
                    ))}
                  </div>
                ) : ordersError ? (
                  <DataError
                    message="Não foi possível carregar os pedidos deste canal. Tente novamente."
                    onRetry={() => setRefreshKey((current) => current + 1)}
                  />
                ) : orders.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                    <ShoppingBag
                      aria-hidden="true"
                      className="mb-3 h-5 w-5 text-[#a7ada2]"
                    />
                    <p className="text-sm font-medium text-[#525c54]">
                      Sem pedidos para mostrar
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#858c83]">
                      Os pedidos registados para {selectedChannel.label}{" "}
                      aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#eeeae2]">
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
                className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5"
              >
                <div className="mb-4 border-b border-[#ece8df] pb-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7f897e]">
                    Sistema / Ligação
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522] sm:text-xl">
                    Estado da plataforma
                  </h2>
                </div>
                {selectedProvider === "website" ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e9eee9] text-[#2c6457]">
                      <Check aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#202522]">
                        Loja pública da Vendora
                      </p>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-[#737a72]">
                        A loja utiliza a própria infraestrutura Vendora. Não
                        depende de uma conta social nem de uma sincronização
                        OAuth externa.
                      </p>
                      <a
                        href={`/loja/${company?.slug ?? ""}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#2c6457] hover:text-[#202522]"
                      >
                        Abrir loja pública{" "}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
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
                      <InfoCell
                        label="Última sincronização"
                        value={
                          selectedConnection.last_synced_at
                            ? formatSync(selectedConnection.last_synced_at)
                            : "Ainda sem sincronização"
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-[#eeeae2] pt-4 sm:flex-row sm:items-center">
                      <p className="max-w-lg text-[11px] leading-5 text-[#737a72]">
                        A ligação e a data de sincronização são apresentadas a
                        partir do registo atual da plataforma.
                      </p>
                      <button
                        type="button"
                        onClick={() => void disconnect(selectedConnection)}
                        disabled={disconnecting === selectedConnection.id}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 border border-[#ead7ca] bg-[#fff9f4] px-3 text-[11px] font-semibold text-[#a44d2e] transition hover:bg-[#f8eee6] disabled:cursor-not-allowed disabled:opacity-60"
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
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                    <CircleAlert
                      aria-hidden="true"
                      className="mb-3 h-5 w-5 text-[#a98b69]"
                    />
                    <p className="text-sm font-medium text-[#525c54]">
                      Integração ainda não disponível
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-[#858c83]">
                      O sistema ainda não oferece uma ligação OAuth para{" "}
                      {selectedChannel.label}. Não apresentamos uma conta nem
                      uma sincronização simulada.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7f897e]">
                  Pedidos / Registo
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-medium",
                    selectedPlatformIsActive === true
                      ? "text-[#2c6457]"
                      : selectedPlatformIsActive === false
                        ? "text-[#858c83]"
                        : "text-[#a44d2e]",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selectedPlatformIsActive === true
                        ? "bg-[#477b55]"
                        : selectedPlatformIsActive === false
                          ? "bg-[#aaa99f]"
                          : "bg-[#bd592f]",
                    )}
                  />
                  {selectedPlatformIsActive === null
                    ? "Estado indisponível"
                    : selectedPlatformIsActive
                      ? "Canal ativo"
                      : "Canal não ligado"}
                </span>
              </div>
              <h2 className="mt-2 font-serif text-lg font-semibold tracking-[-0.03em] text-[#202522]">
                Pedidos registados
              </h2>
              <div className="mt-4 border-y border-[#ece8df] py-4">
                {ordersLoading ? (
                  <div className="h-9 w-16 animate-pulse bg-[#f0efe9]" />
                ) : ordersError ? (
                  <p className="font-serif text-[32px] font-medium leading-none text-[#92978e]">
                    —
                  </p>
                ) : (
                  <p className="font-serif text-[32px] font-medium leading-none text-[#202522]">
                    {orderCount}
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-4 text-[#858c83]">
                  Guardados com origem {selectedChannel.label}
                </p>
              </div>
              <Link
                to="/admin/pedidos"
                className="group mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#687168] hover:text-[#202522]"
              >
                Abrir pedidos{" "}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </section>

            {activeTab !== "orders" && (
              <section className="rounded-[5px] border border-[#e4e0d7] bg-[#fffdf9] p-4 shadow-[0_2px_10px_rgba(32,37,34,0.025)] sm:p-5">
                <div className="mb-3 flex items-end justify-between gap-2 border-b border-[#ece8df] pb-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7f897e]">
                      Atividade / Loja
                    </p>
                    <h2 className="mt-1 font-serif text-base font-semibold tracking-[-0.03em] text-[#202522]">
                      Pedidos recentes
                    </h2>
                  </div>
                  <Link
                    to="/admin/pedidos"
                    aria-label="Ver todos os pedidos"
                    className="grid h-7 w-7 shrink-0 place-items-center text-[#687168] hover:bg-[#f1eee7] hover:text-[#202522]"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {ordersLoading ? (
                  <div
                    className="space-y-3 py-2"
                    aria-label="A carregar pedidos recentes"
                  >
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-12 animate-pulse bg-[#f0efe9]"
                      />
                    ))}
                  </div>
                ) : ordersError ? (
                  <p className="py-5 text-xs leading-5 text-[#a44d2e]">
                    Não foi possível consultar os pedidos desta plataforma.
                  </p>
                ) : orders.length === 0 ? (
                  <p className="py-5 text-xs leading-5 text-[#858c83]">
                    Ainda não há pedidos associados a esta origem.
                  </p>
                ) : (
                  <div className="divide-y divide-[#eeeae2]">
                    {orders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-start gap-2.5 py-3 first:pt-1 last:pb-1"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#f1f0e9] text-[#6c776a]">
                          <ShoppingBag
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold text-[#202522]">
                              #{order.id.slice(0, 6).toUpperCase()}
                            </span>
                            <OrderStatus status={order.status} />
                          </div>
                          <p className="mt-1 truncate text-[10px] text-[#687168]">
                            {order.customer_name || "Cliente"} ·{" "}
                            {formatMoney(Number(order.total), currency)}
                          </p>
                          <time className="mt-0.5 block text-[9px] text-[#92978e]">
                            {formatDate(order.created_at)}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-[5px] border border-[#e4e0d7] bg-[#f8f7f1] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9eee9] text-[#526755]">
                  <Globe2 aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-sm font-semibold text-[#202522]">
                    Cresça a partir daqui
                  </h2>
                  <p className="mt-1 text-[10px] leading-4 text-[#737a72]">
                    As ligações externas surgirão aqui quando forem suportadas
                    pelo sistema.
                  </p>
                  <Link
                    to="/admin/config"
                    className="group mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#687168] hover:text-[#202522]"
                  >
                    Ver definições{" "}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </section>
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
      <CircleAlert aria-hidden="true" className="mb-3 h-5 w-5 text-[#a44d2e]" />
      <p className="max-w-md text-xs leading-5 text-[#687168]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-[11px] font-semibold text-[#2c6457] underline decoration-[#bbc5b7] underline-offset-4 hover:text-[#202522]"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#ece8df] bg-[#faf9f4] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858c83]">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-[#39423a]">
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
      <span className="grid h-9 w-9 place-items-center bg-[#f1f0e9] text-[#6c776a]">
        <ShoppingBag aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[#202522]">
          {order.customer_name || "Cliente"}
        </p>
        <p className="mt-1 truncate text-[10px] text-[#858c83]">
          #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
        </p>
      </div>
      <div className="hidden text-[10px] text-[#687168] sm:block">
        {items} {items === 1 ? "artigo" : "artigos"}
      </div>
      <div className="text-right">
        <p className="font-serif text-sm font-semibold text-[#202522]">
          {formatMoney(Number(order.total), currency)}
        </p>
        <div className="mt-1 flex justify-end">
          <OrderStatus status={order.status} />
        </div>
      </div>
    </div>
  );
}
