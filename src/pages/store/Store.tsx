import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
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
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cart.${slug}`) || "{}");
    } catch {
      return {};
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [productOpen, setProductOpen] = useState<Product | null>(null);
  const [placing, setPlacing] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const loadStore = async () => {
    const { data: store, error: storeError } = await supabase
      .from("companies")
      .select("id,name,slug,currency,description,whatsapp")
      .eq("slug", slug)
      .maybeSingle();

    if (storeError) {
      toast.error("Erro ao carregar a loja.");
      setCompany(null);
      return;
    }

    if (!store) {
      setCompany(null);
      return;
    }

    setCompany(store as Company);

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id,name,description,category,price,promo_price,stock,images",
      )
      .eq("company_id", store.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (productError) {
      toast.error("Erro ao carregar os produtos.");
      return;
    }

    setProducts((productData as Product[]) ?? []);
  };

  useEffect(() => {
    loadStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const updateCart = (next: Record<string, number>) => {
    setCart(next);
    localStorage.setItem(`cart.${slug}`, JSON.stringify(next));
  };

  const changeQuantity = (
    product: Product,
    change: number,
  ) => {
    const current = cart[product.id] || 0;

    const nextQuantity = Math.max(
      0,
      Math.min(product.stock, current + change),
    );

    const next = { ...cart };

    if (nextQuantity <= 0) {
      delete next[product.id];
    } else {
      next[product.id] = nextQuantity;
    }

    if (change > 0 && nextQuantity === current) {
      toast.error("Quantidade máxima disponível atingida.");
      return;
    }

    updateCart(next);
  };

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean),
      ),
    ) as string[];

    return ["Todos", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todos" ||
        product.category === category;

      const matchesSearch =
        !value ||
        product.name.toLowerCase().includes(value) ||
        product.description?.toLowerCase().includes(value);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: products.find((product) => product.id === id),
      quantity,
    }))
    .filter(
      (
        item,
      ): item is {
        product: Product;
        quantity: number;
      } => Boolean(item.product),
    );

  const priceOf = (product: Product) =>
    Number(product.promo_price ?? product.price);

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum + priceOf(item.product) * item.quantity,
    0,
  );

  const cartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const featuredProducts = products.slice(0, 4);

  const checkout = async () => {
    if (!customer.name.trim()) {
      toast.error("Indique o seu nome.");
      return;
    }

    if (!customer.phone.trim() && !customer.email.trim()) {
      toast.error("Indique o telefone ou email.");
      return;
    }

    if (!cartItems.length) {
      toast.error("O carrinho está vazio.");
      return;
    }

    setPlacing(true);

    const { data, error } = await supabase.rpc(
      "place_order",
      {
        _company_slug: slug,
        _customer_name: customer.name,
        _customer_phone: customer.phone,
        _customer_email: customer.email,
        _notes: customer.notes,
        _items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      },
    );

    setPlacing(false);

    if (error) {
      toast.error(error.message);
      await loadStore();
      return;
    }

    updateCart({});
    setCartOpen(false);

    navigate(`/loja/${slug}/pedido/${data}`);
  };

  if (company === undefined) {
    return (
      <div className="min-h-screen bg-white grid place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-black" />
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-6">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-neutral-300" />

          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            Loja não encontrada
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Esta loja não está disponível.
          </p>
        </div>
      </div>
    );
  }

  const currency = company.currency;

  return (
    <div className="min-h-screen bg-white text-neutral-950">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">

          <button
            type="button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="group flex items-center gap-3"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-white">
              <span className="text-sm font-semibold">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <span className="max-w-[180px] truncate text-sm font-semibold tracking-tight">
              {company.name}
            </span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("produtos")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="text-sm text-neutral-600 transition hover:text-black"
            >
              Produtos
            </button>

            {categories.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("categorias")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
                className="text-sm text-neutral-600 transition hover:text-black"
              >
                Categorias
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:border-neutral-400"
          >
            <ShoppingBag className="h-4 w-4" />

            <span className="hidden sm:block">
              Carrinho
            </span>

            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="border-b border-neutral-200 bg-[#f6f6f3]">
        <div className="mx-auto grid min-h-[520px] max-w-[1400px] lg:grid-cols-2">

          <div className="flex items-center px-5 py-16 lg:px-12 lg:py-24">
            <div className="max-w-xl">

              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                {company.name}
              </p>

              <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Produtos que
                <br />
                fazem sentido.
              </h1>

              {company.description && (
                <p className="mt-7 max-w-lg text-base leading-7 text-neutral-600">
                  {company.description}
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    document
                      .getElementById("produtos")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="h-12 rounded-full bg-black px-7 text-sm font-medium hover:bg-neutral-800"
                >
                  Explorar produtos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="h-12 rounded-full px-5 text-sm font-medium text-neutral-700 transition hover:bg-white"
                  >
                    Ver carrinho
                  </button>
                )}
              </div>

              <div className="mt-12 flex items-center gap-8 border-t border-neutral-200 pt-6">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {products.length}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    produtos
                  </p>
                </div>

                <div className="h-8 w-px bg-neutral-300" />

                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {products.filter(
                      (product) => product.stock > 0,
                    ).length}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    disponíveis
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HERO PRODUCT */}

          <div className="relative min-h-[420px] bg-neutral-200 lg:min-h-full">
            {featuredProducts[0]?.images?.[0] ? (
              <button
                type="button"
                onClick={() =>
                  setProductOpen(featuredProducts[0])
                }
                className="group relative h-full w-full overflow-hidden"
              >
                <img
                  src={featuredProducts[0].images[0]}
                  alt={featuredProducts[0].name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-24 text-left text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                    Destaque
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {featuredProducts[0].name}
                  </p>

                  <p className="mt-1 text-sm text-white/80">
                    Ver produto
                  </p>
                </div>
              </button>
            ) : (
              <div className="grid h-full place-items-center">
                <ImageOff className="h-10 w-10 text-neutral-400" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}

      {categories.length > 1 && (
        <section
          id="categorias"
          className="border-b border-neutral-200"
        >
          <div className="mx-auto max-w-[1400px] px-5 py-5 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);

                    document
                      .getElementById("produtos")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className={`whitespace-nowrap px-4 py-2 text-sm transition ${
                    category === item
                      ? "font-semibold text-black"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          PRODUCTS
      ========================================================= */}

      <section
        id="produtos"
        className="mx-auto max-w-[1400px] px-5 py-16 lg:px-8 lg:py-20"
      >

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Catálogo
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {category === "Todos"
                ? "Todos os produtos"
                : category}
            </h2>
          </div>

          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar..."
              className="h-10 rounded-none border-0 border-b border-neutral-300 bg-transparent pl-7 pr-7 text-sm shadow-none focus-visible:border-black focus-visible:ring-0"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-neutral-300" />

            <p className="mt-5 text-sm font-medium">
              Nenhum produto encontrado
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("Todos");
              }}
              className="mt-3 text-sm underline underline-offset-4"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-16">
            {filteredProducts.map((product) => {
              const price = priceOf(product);

              const discount =
                product.promo_price != null &&
                product.price > 0
                  ? Math.round(
                      ((product.price -
                        product.promo_price) /
                        product.price) *
                        100,
                    )
                  : 0;

              return (
                <article
                  key={product.id}
                  className="group min-w-0"
                >
                  {/* IMAGE */}

                  <button
                    type="button"
                    onClick={() =>
                      setProductOpen(product)
                    }
                    className="relative block aspect-[4/5] w-full overflow-hidden bg-[#f3f3f1]"
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <ImageOff className="h-7 w-7 text-neutral-300" />
                      </div>
                    )}

                    {discount > 0 && (
                      <span className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                        -{discount}%
                      </span>
                    )}

                    {product.stock === 0 && (
                      <span className="absolute right-3 top-3 bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                        Esgotado
                      </span>
                    )}

                    {product.stock > 0 && (
                      <span className="absolute bottom-3 left-3 right-3 translate-y-2 bg-white px-4 py-3 text-center text-xs font-semibold opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Ver produto
                      </span>
                    )}
                  </button>

                  {/* PRODUCT INFO */}

                  <div className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {product.category && (
                          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                            {product.category}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setProductOpen(product)
                          }
                          className="line-clamp-2 text-left text-sm font-medium leading-5 transition hover:text-neutral-500"
                        >
                          {product.name}
                        </button>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(price, currency)}
                      </p>
                    </div>

                    {product.promo_price != null && (
                      <div className="mt-1">
                        <span className="text-xs text-neutral-400 line-through">
                          {formatMoney(
                            product.price,
                            currency,
                          )}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">
                        {product.stock > 0
                          ? `${product.stock} em stock`
                          : "Sem stock"}
                      </span>

                      <button
                        type="button"
                        disabled={product.stock === 0}
                        onClick={() =>
                          changeQuantity(product, 1)
                        }
                        className="text-xs font-semibold underline underline-offset-4 transition hover:text-neutral-500 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================
          PRODUCT DETAIL
      ========================================================= */}

      <Sheet
        open={!!productOpen}
        onOpenChange={(open) => {
          if (!open) setProductOpen(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-neutral-200 bg-white p-0 sm:max-w-xl"
        >
          {productOpen && (
            <div>
              <div className="relative aspect-[4/5] bg-neutral-100">
                {productOpen.images?.[0] ? (
                  <img
                    src={productOpen.images[0]}
                    alt={productOpen.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ImageOff className="h-10 w-10 text-neutral-300" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setProductOpen(null)}
                  className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <SheetHeader className="space-y-3 text-left">
                  {productOpen.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      {productOpen.category}
                    </p>
                  )}

                  <SheetTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {productOpen.name}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-xl font-semibold">
                    {formatMoney(
                      priceOf(productOpen),
                      currency,
                    )}
                  </span>

                  {productOpen.promo_price != null && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatMoney(
                        productOpen.price,
                        currency,
                      )}
                    </span>
                  )}
                </div>

                {productOpen.description && (
                  <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-neutral-600">
                    {productOpen.description}
                  </p>
                )}

                <div className="mt-7 border-y border-neutral-200 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      Disponibilidade
                    </span>

                    <span className="text-sm font-medium">
                      {productOpen.stock > 0
                        ? `${productOpen.stock} unidades`
                        : "Esgotado"}
                    </span>
                  </div>
                </div>

                <Button
                  disabled={productOpen.stock === 0}
                  onClick={() => {
                    changeQuantity(productOpen, 1);
                    setProductOpen(null);
                  }}
                  className="mt-6 h-12 w-full rounded-none bg-black text-sm font-medium hover:bg-neutral-800"
                >
                  {productOpen.stock > 0
                    ? "Adicionar ao carrinho"
                    : "Produto esgotado"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setProductOpen(null);
                    setCartOpen(true);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-xs font-medium text-neutral-500 transition hover:text-black"
                >
                  Ver carrinho
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* =========================================================
          CART
      ========================================================= */}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l border-neutral-200 bg-white p-0 sm:max-w-lg"
        >
          {/* HEADER */}

          <div className="border-b border-neutral-200 px-6 py-5">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-xl font-semibold tracking-tight">
                    Seu carrinho
                  </SheetTitle>

                  {cartCount > 0 && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {cartCount}{" "}
                      {cartCount === 1
                        ? "produto"
                        : "produtos"}{" "}
                      selecionado
                      {cartCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>

                {cartCount > 0 && (
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100">
                    <ShoppingBag className="h-4 w-4 text-neutral-700" />
                  </div>
                )}
              </div>
            </SheetHeader>
          </div>

          {cartItems.length === 0 ? (
            /* EMPTY CART */

            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-neutral-100">
                <ShoppingCart className="h-6 w-6 text-neutral-400" />
              </div>

              <h3 className="mt-6 text-base font-semibold">
                O seu carrinho está vazio
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                Explore o catálogo e adicione os produtos
                que deseja comprar.
              </p>

              <Button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-7 h-11 rounded-full bg-black px-6 text-sm font-medium hover:bg-neutral-800"
              >
                Continuar a comprar
              </Button>
            </div>
          ) : (
            <>
              {/* PRODUCTS */}

              <div className="flex-1 overflow-y-auto">
                <div className="px-6">
                  <div className="divide-y divide-neutral-200">
                    {cartItems.map(
                      ({ product, quantity }) => {
                        const unitPrice =
                          priceOf(product);

                        const itemTotal =
                          unitPrice * quantity;

                        const nearStockLimit =
                          product.stock > 0 &&
                          quantity >= product.stock;

                        return (
                          <div
                            key={product.id}
                            className="group py-6"
                          >
                            <div className="flex gap-4">

                              {/* IMAGE */}

                              <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-neutral-100">
                                {product.images?.[0] ? (
                                  <img
                                    src={
                                      product.images[0]
                                    }
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full place-items-center">
                                    <ImageOff className="h-5 w-5 text-neutral-300" />
                                  </div>
                                )}

                                {product.promo_price !=
                                  null && (
                                  <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-wider">
                                    Promoção
                                  </span>
                                )}
                              </div>

                              {/* INFO */}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    {product.category && (
                                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                        {product.category}
                                      </p>
                                    )}

                                    <p className="line-clamp-2 text-sm font-medium leading-5">
                                      {product.name}
                                    </p>
                                  </div>

                                  {/* REMOVE */}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = {
                                        ...cart,
                                      };

                                      delete next[
                                        product.id
                                      ];

                                      updateCart(next);
                                    }}
                                    aria-label={`Remover ${product.name}`}
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {/* PRICE */}

                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-sm font-semibold">
                                    {formatMoney(
                                      itemTotal,
                                      currency,
                                    )}
                                  </span>

                                  {quantity > 1 && (
                                    <span className="text-[11px] text-neutral-400">
                                      {formatMoney(
                                        unitPrice,
                                        currency,
                                      )}{" "}
                                      / unidade
                                    </span>
                                  )}
                                </div>

                                {/* QUANTITY */}

                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex h-9 items-center rounded-full border border-neutral-200">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeQuantity(
                                          product,
                                          -1,
                                        )
                                      }
                                      aria-label="Diminuir quantidade"
                                      className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-neutral-100"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>

                                    <span className="w-8 text-center text-xs font-medium">
                                      {quantity}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeQuantity(
                                          product,
                                          1,
                                        )
                                      }
                                      aria-label="Aumentar quantidade"
                                      className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-neutral-100"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {nearStockLimit && (
                                    <span className="text-[10px] font-medium text-neutral-400">
                                      Últimas unidades
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* CONTINUE SHOPPING */}

                <div className="border-t border-neutral-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="flex items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-black"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Continuar a comprar
                  </button>
                </div>
              </div>

              {/* CHECKOUT */}

              <div className="border-t border-neutral-200 bg-[#fafafa]">
                <div className="px-6 py-5">

                  {/* SUMMARY */}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        Subtotal
                      </span>

                      <span className="font-medium">
                        {formatMoney(
                          cartTotal,
                          currency,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        Entrega
                      </span>

                      <span className="text-xs font-medium">
                        A combinar
                      </span>
                    </div>

                    <div className="my-4 h-px bg-neutral-200" />

                    <div className="flex items-end justify-between">
                      <span className="text-sm font-medium">
                        Total
                      </span>

                      <span className="text-2xl font-semibold tracking-tight">
                        {formatMoney(
                          cartTotal,
                          currency,
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] leading-5 text-neutral-400">
                    O pagamento e os custos de entrega
                    serão combinados com a loja após a
                    confirmação do pedido.
                  </p>

                  {/* CUSTOMER DETAILS */}

                  <div className="mt-6">
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Dados para o pedido
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <Input
                        value={customer.name}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            name: event.target.value,
                          })
                        }
                        placeholder="Nome completo"
                        className="h-11 rounded-xl border-neutral-200 bg-white focus-visible:ring-0"
                        maxLength={120}
                      />

                      <Input
                        value={customer.phone}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            phone: event.target.value,
                          })
                        }
                        placeholder="Telefone / WhatsApp"
                        className="h-11 rounded-xl border-neutral-200 bg-white focus-visible:ring-0"
                        maxLength={40}
                      />

                      <Input
                        value={customer.email}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            email: event.target.value,
                          })
                        }
                        placeholder="Email (opcional)"
                        type="email"
                        className="h-11 rounded-xl border-neutral-200 bg-white focus-visible:ring-0"
                        maxLength={160}
                      />

                      <Textarea
                        value={customer.notes}
                        onChange={(event) =>
                          setCustomer({
                            ...customer,
                            notes: event.target.value,
                          })
                        }
                        placeholder="Morada ou observações"
                        className="min-h-[78px] resize-none rounded-xl border-neutral-200 bg-white focus-visible:ring-0"
                        maxLength={1000}
                      />

                      <Button
                        onClick={checkout}
                        disabled={placing}
                        className="mt-2 h-12 w-full rounded-xl bg-black text-sm font-medium hover:bg-neutral-800"
                      >
                        {placing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A processar pedido...
                          </>
                        ) : (
                          <>
                            Finalizar pedido
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* =========================================================
          MOBILE CART FLOATING BUTTON
      ========================================================= */}

      {cartCount > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-2xl md:hidden"
        >
          <ShoppingBag className="h-4 w-4" />

          <span>
            Ver carrinho
          </span>

          <span className="h-4 w-px bg-white/30" />

          <span>
            {formatMoney(cartTotal, currency)}
          </span>
        </button>
      )}

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="border-t border-neutral-200 bg-[#f7f7f5]">
        <div className="mx-auto max-w-[1400px] px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight">
                {company.name}
              </p>

              {company.description && (
                <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                  {company.description}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-400">
                Loja online
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                © {new Date().getFullYear()}{" "}
                {company.name}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
