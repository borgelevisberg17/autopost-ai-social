import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Truck,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  description: string | null;
  whatsapp: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  promo_price: number | null;
  stock: number;
  images: string[];
};

export default function Store() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null | undefined>(
    undefined,
  );
  const [products, setProducts] = useState<Product[]>([]);

  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");

  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cart.${slug}`) || "{}");
    } catch {
      return {};
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [placing, setPlacing] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const load = async () => {
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select(
        "id,name,slug,currency,description,whatsapp",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (companyError) {
      toast.error("Não foi possível carregar a loja.");
      setCompany(null);
      return;
    }

    setCompany(companyData as Company | null);

    if (!companyData) {
      setProducts([]);
      return;
    }

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id,name,description,category,price,promo_price,stock,images",
      )
      .eq("company_id", companyData.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (productError) {
      toast.error("Não foi possível carregar os produtos.");
      setProducts([]);
      return;
    }

    setProducts((productData as Product[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const updateCart = (next: Record<string, number>) => {
    setCart(next);
    localStorage.setItem(`cart.${slug}`, JSON.stringify(next));
  };

  const add = (product: Product, delta: number) => {
    const current = cart[product.id] ?? 0;

    const quantity = Math.max(
      0,
      Math.min(product.stock, current + delta),
    );

    const next = { ...cart };

    if (quantity === 0) {
      delete next[product.id];
    } else {
      next[product.id] = quantity;
    }

    if (delta > 0 && quantity === current) {
      toast.error("Sem mais stock disponível.");
      return;
    }

    updateCart(next);
  };

  const categories = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter(Boolean) as string[],
        ),
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch =
        category === "Todos" || product.category === category;

      const searchMatch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description?.toLowerCase().includes(normalizedQuery);

      return categoryMatch && searchMatch;
    });
  }, [products, category, query]);

  const cartLines = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: products.find((product) => product.id === id),
      quantity,
    }))
    .filter(
      (
        line,
      ): line is {
        product: Product;
        quantity: number;
      } => Boolean(line.product),
    );

  const getUnitPrice = (product: Product) =>
    Number(product.promo_price ?? product.price);

  const cartTotal = cartLines.reduce(
    (total, line) =>
      total + getUnitPrice(line.product) * line.quantity,
    0,
  );

  const cartCount = cartLines.reduce(
    (total, line) => total + line.quantity,
    0,
  );

  const promotionCount = products.filter(
    (product) => product.promo_price != null,
  ).length;

  const availableCount = products.filter(
    (product) => product.stock > 0,
  ).length;

  const checkout = async () => {
    if (!customer.name.trim()) {
      toast.error("Indique o seu nome.");
      return;
    }

    if (!customer.phone.trim() && !customer.email.trim()) {
      toast.error("Indique o telefone ou email.");
      return;
    }

    if (cartLines.length === 0) {
      toast.error("O carrinho está vazio.");
      return;
    }

    setPlacing(true);

    const { data, error } = await supabase.rpc("place_order", {
      _company_slug: slug,
      _customer_name: customer.name,
      _customer_phone: customer.phone,
      _customer_email: customer.email,
      _notes: customer.notes,
      _items: cartLines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
      })),
    });

    setPlacing(false);

    if (error) {
      toast.error(error.message);
      await load();
      return;
    }

    updateCart({});
    setCartOpen(false);

    navigate(`/loja/${slug}/pedido/${data}`);
  };

  if (company === undefined) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6 text-center">
        <div>
          <StoreIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h1 className="mt-4 font-display text-xl font-semibold">
            Loja não encontrada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A loja que procura não está disponível.
          </p>
        </div>
      </div>
    );
  }

  const currency = company.currency;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <StoreIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-display font-semibold">
                {company.name}
              </p>

              <p className="text-xs text-muted-foreground">
                Loja online
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setCartOpen(true)}
            className="rounded-full px-4"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />

            <span className="hidden sm:inline">
              Carrinho
            </span>

            {cartCount > 0 && (
              <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/60 bg-background">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Coleção disponível online
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Tudo o que procura,
                <span className="block text-primary">
                  num só lugar.
                </span>
              </h1>

              {company.description && (
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {company.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-6"
                  onClick={() =>
                    document
                      .getElementById("catalogo")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  Explorar produtos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Ver carrinho
                </Button>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
                <p className="font-display text-2xl font-bold">
                  {products.length}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Produtos
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
                <p className="font-display text-2xl font-bold">
                  {promotionCount}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Em promoção
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
                <p className="font-display text-2xl font-bold">
                  {availableCount}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Disponíveis
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG */}
        <section
          id="catalogo"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
        >
          <div className="mb-7 flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-primary">
                Catálogo
              </p>

              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl text-primary">
                Produtos em destaque
              </h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* SEARCH */}
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Pesquisar produtos..."
                  className="h-11 rounded-full bg-background pl-10 pr-10"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* CATEGORIES */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      category === item
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background px-6 py-20 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/60" />

              <p className="mt-4 font-medium">
                Nenhum produto encontrado
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tente outra pesquisa ou categoria.
              </p>
            </div>
          ) : (
            /* PRODUCTS */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const discount =
                  product.promo_price != null
                    ? Math.max(
                        0,
                        Math.round(
                          (1 -
                            Number(product.promo_price) /
                              Number(product.price)) *
                            100,
                        ),
                      )
                    : 0;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-border/80 bg-background shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    <button
                      type="button"
                      onClick={() => setDetail(product)}
                      className="relative block aspect-square w-full overflow-hidden bg-muted"
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImageOff className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                      )}

                      {discount > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm">
                          -{discount}%
                        </span>
                      )}

                      {product.stock === 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-background">
                          Esgotado
                        </span>
                      )}
                    </button>

                    {/* INFO */}
                    <div className="flex min-h-[176px] flex-col p-4">
                      {product.category && (
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {product.category}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setDetail(product)}
                        className="line-clamp-2 text-left text-sm font-semibold leading-5 hover:text-primary"
                      >
                        {product.name}
                      </button>

                      <div className="mt-2">
                        <span className="font-display text-lg font-bold">
                          {formatMoney(
                            getUnitPrice(product),
                            currency,
                          )}
                        </span>

                        {product.promo_price != null && (
                          <s className="ml-2 text-xs text-muted-foreground">
                            {formatMoney(
                              product.price,
                              currency,
                            )}
                          </s>
                        )}
                      </div>

                      <p
                        className={`mb-3 mt-2 text-xs ${
                          product.stock === 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {product.stock === 0
                          ? "Sem stock"
                          : `${product.stock} disponíveis`}
                      </p>

                      <Button
                        size="sm"
                        disabled={product.stock === 0}
                        className="mt-auto w-full rounded-xl"
                        onClick={() => add(product, 1)}
                      >
                        Adicionar ao carrinho
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* BENEFITS */}
        <section className="border-y border-border/70 bg-background">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 sm:grid-cols-3">
            <div className="flex gap-4 rounded-2xl p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Compra simples
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Escolha os produtos, ajuste as quantidades e
                  envie o pedido.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                <Truck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Stock atualizado
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  As quantidades disponíveis são verificadas no
                  momento da compra.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Experiência rápida
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Pesquisa, categorias e carrinho num fluxo
                  pensado para mobile e desktop.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-display font-semibold">
              {company.name}
            </p>

            <p className="mt-1 text-xs text-background/60">
              Loja online
            </p>
          </div>

          <p className="text-xs text-background/50">
            Catálogo e pedidos online
          </p>
        </div>
      </footer>

      {/* PRODUCT DETAIL */}
      <Sheet
        open={!!detail}
        onOpenChange={(value) => {
          if (!value) {
            setDetail(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-3xl"
        >
          {detail && (
            <div className="mx-auto w-full max-w-5xl">
              <SheetHeader>
                <SheetTitle className="text-left font-display text-2xl">
                  {detail.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {/* IMAGES */}
                <div className="flex gap-3 overflow-x-auto">
                  {detail.images?.length ? (
                    detail.images.map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt={detail.name}
                        className="h-72 w-72 shrink-0 rounded-2xl object-cover sm:h-96 sm:w-96"
                      />
                    ))
                  ) : (
                    <div className="grid h-72 w-full place-items-center rounded-2xl bg-muted">
                      <ImageOff className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex flex-col justify-center">
                  {detail.category && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {detail.category}
                    </p>
                  )}

                  <p className="mt-2 font-display text-3xl font-bold">
                    {formatMoney(
                      getUnitPrice(detail),
                      currency,
                    )}
                  </p>

                  {detail.promo_price != null && (
                    <s className="mt-1 text-sm text-muted-foreground">
                      {formatMoney(detail.price, currency)}
                    </s>
                  )}

                  {detail.description && (
                    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {detail.description}
                    </p>
                  )}

                  <p className="mt-5 text-sm text-muted-foreground">
                    {detail.stock === 0
                      ? "Produto esgotado"
                      : `${detail.stock} unidades disponíveis`}
                  </p>

                  <Button
                    className="mt-6 h-12 rounded-xl"
                    disabled={detail.stock === 0}
                    onClick={() => {
                      add(detail, 1);
                      setDetail(null);
                    }}
                  >
                    Adicionar ao carrinho
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CART */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">
              O seu carrinho
            </SheetTitle>
          </SheetHeader>

          {cartLines.length === 0 ? (
            <div className="mt-12 text-center">
              <ShoppingCart className="mx-auto h-9 w-9 text-muted-foreground/50" />

              <p className="mt-4 font-medium">
                O carrinho está vazio
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Adicione produtos para continuar.
              </p>
            </div>
          ) : (
            <>
              {/* CART ITEMS */}
              <ul className="my-6 space-y-4">
                {cartLines.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 border-b border-border/60 pb-4"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatMoney(
                          getUnitPrice(product),
                          currency,
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-full border border-border p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full"
                        onClick={() => add(product, -1)}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>

                      <span className="w-6 text-center text-sm">
                        {quantity}
                      </span>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full"
                        onClick={() => add(product, 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* CHECKOUT */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total
                  </span>

                  <span className="font-display text-xl font-bold">
                    {formatMoney(cartTotal, currency)}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <Input
                    placeholder="Nome"
                    value={customer.name}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        name: event.target.value,
                      })
                    }
                    maxLength={120}
                  />

                  <Input
                    placeholder="Telefone / WhatsApp"
                    value={customer.phone}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        phone: event.target.value,
                      })
                    }
                    maxLength={40}
                  />

                  <Input
                    placeholder="Email (opcional)"
                    type="email"
                    value={customer.email}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        email: event.target.value,
                      })
                    }
                    maxLength={160}
                  />

                  <Textarea
                    placeholder="Observações / morada"
                    value={customer.notes}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        notes: event.target.value,
                      })
                    }
                    maxLength={1000}
                  />

                  <Button
                    className="h-12 w-full rounded-xl"
                    onClick={checkout}
                    disabled={placing}
                  >
                    {placing ? "A enviar…" : "Fazer pedido"}
                  </Button>

                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    Pagamento combinado com a loja após
                    confirmação.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
