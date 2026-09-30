import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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

type CartStep = "cart" | "checkout" | "success";

export default function Store() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState<
    Company | null | undefined
  >(undefined);

  const [products, setProducts] = useState<Product[]>([]);

  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<Record<string, number>>(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(`cart.${slug}`) || "{}",
        );
      } catch {
        return {};
      }
    },
  );

  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] =
    useState<CartStep>("cart");

  const [productOpen, setProductOpen] =
    useState<Product | null>(null);

  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(
    null,
  );

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const loadStore = async () => {
    const { data: store, error: storeError } =
      await supabase
        .from("companies")
        .select(
          "id,name,slug,currency,description,whatsapp",
        )
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

    const {
      data: productData,
      error: productError,
    } = await supabase
      .from("products")
      .select(
        "id,name,description,category,price,promo_price,stock,images",
      )
      .eq("company_id", store.id)
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      });

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

  const updateCart = (
    next: Record<string, number>,
  ) => {
    setCart(next);
    localStorage.setItem(
      `cart.${slug}`,
      JSON.stringify(next),
    );
  };

  const changeQuantity = (
    product: Product,
    change: number,
  ) => {
    const current = cart[product.id] || 0;

    const nextQuantity = Math.max(
      0,
      Math.min(
        product.stock,
        current + change,
      ),
    );

    const next = {
      ...cart,
    };

    if (nextQuantity <= 0) {
      delete next[product.id];
    } else {
      next[product.id] = nextQuantity;
    }

    if (
      change > 0 &&
      nextQuantity === current
    ) {
      toast.error(
        "Quantidade máxima disponível atingida.",
      );
      return;
    }

    updateCart(next);
  };

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map(
            (product) => product.category,
          )
          .filter(Boolean),
      ),
    ) as string[];

    return ["Todos", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todos" ||
        product.category === category;

      const matchesSearch =
        !value ||
        product.name
          .toLowerCase()
          .includes(value) ||
        product.description
          ?.toLowerCase()
          .includes(value);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    products,
    category,
    search,
  ]);

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: products.find(
        (product) => product.id === id,
      ),
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
    Number(
      product.promo_price ??
        product.price,
    );

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum +
      priceOf(item.product) *
        item.quantity,
    0,
  );

  const cartCount = cartItems.reduce(
    (sum, item) =>
      sum + item.quantity,
    0,
  );

  const featuredProducts =
    products.slice(0, 4);

  const openCart = () => {
    setCartStep("cart");
    setOrderId(null);
    setCartOpen(true);
  };

  const closeCart = () => {
    setCartOpen(false);

    window.setTimeout(() => {
      setCartStep("cart");
      setOrderId(null);
    }, 180);
  };

  const goToCheckout = () => {
    if (!cartItems.length) {
      toast.error(
        "O carrinho está vazio.",
      );
      return;
    }

    setCartStep("checkout");
  };

  const goBackToCart = () => {
    if (placing) return;

    setCartStep("cart");
  };

  const checkout = async () => {
    if (!customer.name.trim()) {
      toast.error(
        "Indique o seu nome.",
      );
      return;
    }

    if (
      !customer.phone.trim() &&
      !customer.email.trim()
    ) {
      toast.error(
        "Indique o telefone ou email.",
      );
      return;
    }

    if (!cartItems.length) {
      toast.error(
        "O carrinho está vazio.",
      );
      return;
    }

    setPlacing(true);

    const {
      data,
      error,
    } = await supabase.rpc(
      "place_order",
      {
        _company_slug: slug,
        _customer_name:
          customer.name,
        _customer_phone:
          customer.phone,
        _customer_email:
          customer.email,
        _notes:
          customer.notes,
        _items:
          cartItems.map(
            (item) => ({
              product_id:
                item.product.id,
              quantity:
                item.quantity,
            }),
          ),
      },
    );

    setPlacing(false);

    if (error) {
      toast.error(
        error.message,
      );

      await loadStore();
      return;
    }

    updateCart({});

    setOrderId(
      String(data),
    );

    setCartStep("success");

    await loadStore();
  };

  const continueShopping = () => {
    closeCart();

    window.setTimeout(() => {
      document
        .getElementById("produtos")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 220);
  };

  if (company === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffdf9]">
        <Loader2 className="h-5 w-5 animate-spin text-black" />
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffdf9] px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[7px] bg-[#ebe7df]">
            <ShoppingBag className="h-6 w-6 text-[#5f625d]" />
          </div>

          <h1 className="mt-6 text-xl font-semibold tracking-tight text-[#202522]">
            Loja não encontrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#747b73]">
            Esta loja não está disponível neste momento.
          </p>
        </div>
      </div>
    );
  }

  const currency =
    company.currency;

  return (
    <div className="min-h-screen bg-[#fffdf9] text-[#202522]">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#ded9d0] bg-[#fffdf9]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            aria-label={`Ir para o início da loja ${company.name}`}
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] bg-black text-white">
              <span className="text-sm font-bold">
                {company.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>

            <span className="max-w-[160px] truncate text-sm font-semibold tracking-tight text-[#202522] sm:max-w-[220px]">
              {company.name}
            </span>
          </button>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-8 md:flex"
          >
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(
                    "produtos",
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="rounded-md px-1 py-2 text-sm font-medium text-[#5f625d] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
            >
              Produtos
            </button>

            {categories.length >
              1 && (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById(
                      "categorias",
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    })
                }
                className="rounded-md px-1 py-2 text-sm font-medium text-[#5f625d] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                Categorias
              </button>
            )}
          </nav>

          <button
            type="button"
            onClick={openCart}
            aria-label={
              cartCount > 0
                ? `Abrir carrinho com ${cartCount} produtos`
                : "Abrir carrinho"
            }
            className="flex min-h-10 items-center gap-2 rounded-[7px] border border-[#c9c3b8] px-3.5 py-2 text-sm font-semibold text-[#202522] transition hover:border-neutral-500 hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2 sm:px-4"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />

            <span className="hidden sm:block">
              Carrinho
            </span>

            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-[7px] bg-black px-1.5 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}

      <section className="border-b border-[#ded9d0] bg-[#f5f5f2]">
        <div className="mx-auto grid min-h-[520px] max-w-[1400px] lg:grid-cols-2">
          <div className="flex items-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
            <div className="max-w-xl">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#5f625d]">
                {company.name}
              </p>

              <h1 className="text-[2.75rem] font-bold leading-[0.98] tracking-[-0.055em] text-[#202522] sm:text-6xl lg:text-7xl">
                Produtos que
                <br />
                fazem sentido.
              </h1>

              {company.description && (
                <p className="mt-7 max-w-lg text-base font-normal leading-7 text-[#5f625d] sm:text-[17px]">
                  {
                    company.description
                  }
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    document
                      .getElementById(
                        "produtos",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="h-12 rounded-[7px] bg-black px-7 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                >
                  Explorar produtos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {cartCount >
                  0 && (
                  <button
                    type="button"
                    onClick={openCart}
                    className="h-12 rounded-[7px] px-5 text-sm font-semibold text-[#303732] transition hover:bg-[#fffdf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  >
                    Ver carrinho
                  </button>
                )}
              </div>

              <div className="mt-12 flex items-center gap-8 border-t border-[#c9c3b8] pt-6">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-[#202522]">
                    {products.length}
                  </p>

                  <p className="mt-1 text-xs font-medium text-[#747b73]">
                    produtos
                  </p>
                </div>

                <div className="h-8 w-px bg-neutral-300" />

                <div>
                  <p className="text-2xl font-bold tracking-tight text-[#202522]">
                    {
                      products.filter(
                        (product) =>
                          product.stock >
                          0,
                      ).length
                    }
                  </p>

                  <p className="mt-1 text-xs font-medium text-[#747b73]">
                    disponíveis
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] bg-[#e7e2d9] lg:min-h-full">
            {featuredProducts[0]
              ?.images?.[0] ? (
              <button
                type="button"
                onClick={() =>
                  setProductOpen(
                    featuredProducts[0],
                  )
                }
                aria-label={`Ver ${featuredProducts[0].name}`}
                className="group relative h-full w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e36c3f]"
              >
                <img
                  src={
                    featuredProducts[0]
                      .images[0]
                  }
                  alt={
                    featuredProducts[0]
                      .name
                  }
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/65 p-6 pt-28 text-left text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                    Destaque
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {
                      featuredProducts[0]
                        .name
                    }
                  </p>

                  <p className="mt-1 text-sm font-medium text-white/90">
                    Ver produto
                  </p>
                </div>
              </button>
            ) : (
              <div className="grid h-full place-items-center">
                <ImageOff className="h-10 w-10 text-[#747b73]" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      {categories.length >
        1 && (
        <section
          id="categorias"
          className="border-b border-[#ded9d0] bg-[#fffdf9]"
        >
          <div className="mx-auto max-w-[1400px] px-5 py-4 lg:px-8">
            <div
              className="flex items-center gap-1 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Categorias de produtos"
            >
              {categories.map(
                (item) => {
                  const active =
                    category ===
                    item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCategory(
                          item,
                        );

                        document
                          .getElementById(
                            "produtos",
                          )
                          ?.scrollIntoView(
                            {
                              behavior:
                                "smooth",
                            },
                          );
                      }}
                      role="tab"
                      aria-selected={
                        active
                      }
                      className={`min-h-10 whitespace-nowrap rounded-[7px] px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] ${
                        active
                          ? "bg-black text-white"
                          : "text-[#5f625d] hover:bg-[#ebe7df] hover:text-[#202522]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS */}

      <section
        id="produtos"
        className="mx-auto max-w-[1400px] px-5 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#747b73]">
              Catálogo
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#202522] sm:text-4xl">
              {category ===
              "Todos"
                ? "Todos os produtos"
                : category}
            </h2>

            <p className="mt-2 text-sm text-[#747b73]">
              {
                filteredProducts.length
              }{" "}
              {filteredProducts.length ===
              1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>
          </div>

          <div className="relative w-full md:w-[320px]">
            <Search
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f625d]"
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Pesquisar produtos..."
              aria-label="Pesquisar produtos"
              className="h-11 rounded-none border-0 border-b border-neutral-400 bg-transparent pl-7 pr-8 text-sm font-medium text-[#202522] placeholder:text-[#747b73] shadow-none focus-visible:border-black focus-visible:ring-0"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Limpar pesquisa"
                className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[7px] text-[#5f625d] transition hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length ===
        0 ? (
          <div className="rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] py-24 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-[#747b73]" />

            <p className="mt-5 text-base font-semibold text-[#202522]">
              Nenhum produto encontrado
            </p>

            <p className="mt-2 text-sm text-[#747b73]">
              Tente alterar a pesquisa ou selecionar outra categoria.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory(
                  "Todos",
                );
              }}
              className="mt-5 text-sm font-semibold text-[#202522] underline underline-offset-4 hover:text-[#747b73]"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-16">
            {filteredProducts.map(
              (product) => {
                const price =
                  priceOf(
                    product,
                  );

                const discount =
                  product.promo_price !=
                    null &&
                  product.price >
                    0
                    ? Math.round(
                        ((product.price -
                          product.promo_price) /
                          product.price) *
                          100,
                      )
                    : 0;

                const lowStock =
                  product.stock >
                    0 &&
                  product.stock <=
                    3;

                return (
                  <article
                    key={
                      product.id
                    }
                    className="group min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setProductOpen(
                          product,
                        )
                      }
                      aria-label={`Ver detalhes de ${product.name}`}
                      className="relative block aspect-[4/5] w-full overflow-hidden bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                    >
                      {product
                        .images?.[0] ? (
                        <img
                          src={
                            product
                              .images[0]
                          }
                          alt={
                            product.name
                          }
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <ImageOff className="h-7 w-7 text-[#747b73]" />
                        </div>
                      )}

                      {discount >
                        0 && (
                        <span className="absolute left-3 top-3 rounded-sm bg-[#fffdf9] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#202522] shadow-sm">
                          -{discount}%
                        </span>
                      )}

                      {product.stock ===
                        0 && (
                        <span className="absolute right-3 top-3 rounded-sm bg-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Esgotado
                        </span>
                      )}

                      {lowStock && (
                        <span className="absolute right-3 top-3 rounded-sm bg-[#fffdf9] px-2.5 py-1.5 text-[10px] font-bold text-[#202522] shadow-sm">
                          Últimas unidades
                        </span>
                      )}

                      {product.stock >
                        0 && (
                        <span className="absolute bottom-3 left-3 right-3 hidden translate-y-2 bg-[#fffdf9] px-4 py-3 text-center text-xs font-bold text-[#202522] opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
                          Ver produto
                        </span>
                      )}
                    </button>

                    <div className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {product.category && (
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#747b73]">
                              {
                                product.category
                              }
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setProductOpen(
                                product,
                              )
                            }
                            className="line-clamp-2 text-left text-sm font-semibold leading-5 text-[#202522] transition hover:text-[#747b73] focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
                          >
                            {
                              product.name
                            }
                          </button>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#202522]">
                          {formatMoney(
                            price,
                            currency,
                          )}
                        </p>
                      </div>

                      {product.promo_price !=
                        null && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-[#747b73] line-through">
                            {formatMoney(
                              product.price,
                              currency,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span
                          className={`text-xs font-medium ${
                            product.stock ===
                            0
                              ? "text-[#5f625d]"
                              : lowStock
                                ? "text-[#202522]"
                                : "text-[#747b73]"
                          }`}
                        >
                          {product.stock >
                          0
                            ? `${product.stock} em stock`
                            : "Sem stock"}
                        </span>

                        <button
                          type="button"
                          disabled={
                            product.stock ===
                            0
                          }
                          onClick={() =>
                            changeQuantity(
                              product,
                              1,
                            )
                          }
                          className="min-h-9 rounded-md px-1 text-xs font-bold text-[#202522] underline underline-offset-4 transition hover:text-[#747b73] disabled:cursor-not-allowed disabled:text-[#a7aaa2] disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* PRODUCT DETAIL */}

      <Sheet
        open={!!productOpen}
        onOpenChange={(open) => {
          if (!open) {
            setProductOpen(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="h-[100dvh] w-full overflow-y-auto border-l border-[#ded9d0] bg-[#fffdf9] p-0 sm:max-w-xl"
        >
          {productOpen && (
            <div>
              <div className="relative aspect-[4/5] bg-[#ebe7df]">
                {productOpen
                  .images?.[0] ? (
                  <img
                    src={
                      productOpen
                        .images[0]
                    }
                    alt={
                      productOpen.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ImageOff className="h-10 w-10 text-[#747b73]" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setProductOpen(
                      null,
                    )
                  }
                  aria-label="Fechar detalhes do produto"
                  className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-[7px] bg-[#fffdf9] text-[#202522] shadow-md transition hover:bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <SheetHeader className="space-y-3 text-left">
                  {productOpen.category && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5f625d]">
                      {
                        productOpen.category
                      }
                    </p>
                  )}

                  <SheetTitle className="text-2xl font-bold tracking-tight text-[#202522] sm:text-3xl">
                    {
                      productOpen.name
                    }
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl font-bold text-[#202522]">
                    {formatMoney(
                      priceOf(
                        productOpen,
                      ),
                      currency,
                    )}
                  </span>

                  {productOpen.promo_price !=
                    null && (
                    <span className="text-sm font-medium text-[#747b73] line-through">
                      {formatMoney(
                        productOpen.price,
                        currency,
                      )}
                    </span>
                  )}
                </div>

                {productOpen.description && (
                  <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-[#5f625d]">
                    {
                      productOpen.description
                    }
                  </p>
                )}

                <div className="mt-7 border-y border-[#ded9d0] py-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#5f625d]">
                      Disponibilidade
                    </span>

                    <span
                      className={`text-sm font-bold ${
                        productOpen.stock >
                        0
                          ? "text-[#202522]"
                          : "text-[#5f625d]"
                      }`}
                    >
                      {productOpen.stock >
                      0
                        ? `${productOpen.stock} unidades disponíveis`
                        : "Esgotado"}
                    </span>
                  </div>
                </div>

                <Button
                  disabled={
                    productOpen.stock ===
                    0
                  }
                  onClick={() => {
                    changeQuantity(
                      productOpen,
                      1,
                    );

                    setProductOpen(
                      null,
                    );
                  }}
                  className="mt-6 h-12 w-full rounded-[7px] bg-black text-sm font-bold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                >
                  {productOpen.stock >
                  0
                    ? "Adicionar ao carrinho"
                    : "Produto esgotado"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setProductOpen(
                      null,
                    );
                    openCart();
                  }}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#5f625d] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                >
                  Ver carrinho
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CART / CHECKOUT / SUCCESS */}

      <Sheet
        open={cartOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCart();
          } else {
            openCart();
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden border-l border-[#ded9d0] bg-[#fffdf9] p-0 sm:max-w-lg"
        >
          {/* HEADER */}

          <div className="shrink-0 border-b border-[#ded9d0] bg-[#fffdf9] px-5 py-5 sm:px-6">
            <SheetHeader>
              <div className="flex items-center gap-3">
                {cartStep ===
                  "checkout" && (
                  <button
                    type="button"
                    onClick={
                      goBackToCart
                    }
                    aria-label="Voltar ao carrinho"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] border border-[#ded9d0] text-[#303732] transition hover:bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                <div className="min-w-0">
                  <SheetTitle className="text-xl font-bold tracking-tight text-[#202522]">
                    {cartStep ===
                    "cart"
                      ? "Carrinho"
                      : cartStep ===
                          "checkout"
                        ? "Finalizar pedido"
                        : "Pedido confirmado"}
                  </SheetTitle>

                  {cartStep ===
                    "cart" &&
                    cartCount >
                      0 && (
                      <p className="mt-1 text-sm font-medium text-[#747b73]">
                        {cartCount}{" "}
                        {cartCount ===
                        1
                          ? "item"
                          : "itens"}
                      </p>
                    )}

                  {cartStep ===
                    "checkout" && (
                    <p className="mt-1 text-sm font-medium text-[#747b73]">
                      Dados para contacto
                    </p>
                  )}
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* EMPTY CART */}

          {cartItems.length ===
            0 &&
          cartStep ===
            "cart" ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-[7px] bg-[#ebe7df]">
                <ShoppingCart className="h-6 w-6 text-[#5f625d]" />
              </div>

              <h3 className="mt-6 text-base font-bold text-[#202522]">
                O seu carrinho está vazio
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-[#747b73]">
                Adicione produtos para continuar.
              </p>

              <Button
                type="button"
                onClick={
                  continueShopping
                }
                className="mt-7 h-11 rounded-[7px] bg-black px-6 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Ver produtos
              </Button>
            </div>
          ) : (
            <>
              {/* SINGLE SCROLL AREA */}

              {cartStep !==
                "success" && (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {cartStep ===
                    "cart" && (
                    <div className="px-5 sm:px-6">
                      <div className="divide-y divide-neutral-200">
                        {cartItems.map(
                          ({
                            product,
                            quantity,
                          }) => {
                            const unitPrice =
                              priceOf(
                                product,
                              );

                            const itemTotal =
                              unitPrice *
                              quantity;

                            return (
                              <div
                                key={
                                  product.id
                                }
                                className="py-5"
                              >
                                <div className="flex gap-4">
                                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#ebe7df] sm:h-28 sm:w-24">
                                    {product
                                      .images?.[0] ? (
                                      <img
                                        src={
                                          product
                                            .images[0]
                                        }
                                        alt={
                                          product.name
                                        }
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="grid h-full place-items-center">
                                        <ImageOff className="h-5 w-5 text-[#747b73]" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        {product.category && (
                                          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#747b73]">
                                            {
                                              product.category
                                            }
                                          </p>
                                        )}

                                        <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#202522]">
                                          {
                                            product.name
                                          }
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next =
                                            {
                                              ...cart,
                                            };

                                          delete next[
                                            product.id
                                          ];

                                          updateCart(
                                            next,
                                          );
                                        }}
                                        aria-label={`Remover ${product.name}`}
                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] text-[#747b73] transition hover:bg-[#ebe7df] hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <p className="mt-2 text-sm font-bold text-[#202522]">
                                      {formatMoney(
                                        itemTotal,
                                        currency,
                                      )}
                                    </p>

                                    <div className="mt-4">
                                      <div className="inline-flex h-9 items-center rounded-[7px] border border-[#c9c3b8]">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            changeQuantity(
                                              product,
                                              -1,
                                            )
                                          }
                                          aria-label={`Diminuir quantidade de ${product.name}`}
                                          className="grid h-9 w-9 place-items-center rounded-[7px] text-[#303732] transition hover:bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                                        >
                                          <Minus className="h-3.5 w-3.5" />
                                        </button>

                                        <span className="w-7 text-center text-sm font-bold text-[#202522]">
                                          {
                                            quantity
                                          }
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            changeQuantity(
                                              product,
                                              1,
                                            )
                                          }
                                          aria-label={`Aumentar quantidade de ${product.name}`}
                                          className="grid h-9 w-9 place-items-center rounded-[7px] text-[#303732] transition hover:bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {cartStep ===
                    "checkout" && (
                    <div className="px-5 py-6 sm:px-6">
                      <div className="mb-7">
                        <p className="text-2xl font-bold tracking-tight text-[#202522]">
                          Quase concluído.
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#747b73]">
                          Preencha os seus dados para receber o contacto da loja.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="customer-name"
                            className="mb-2 block text-sm font-semibold text-[#202522]"
                          >
                            Nome completo
                          </label>

                          <Input
                            id="customer-name"
                            value={
                              customer.name
                            }
                            onChange={(
                              event,
                            ) =>
                              setCustomer(
                                {
                                  ...customer,
                                  name: event
                                    .target
                                    .value,
                                },
                              )
                            }
                            placeholder="O seu nome"
                            className="h-12 rounded-[7px] border-[#c9c3b8] bg-[#fffdf9] text-sm font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                            maxLength={
                              120
                            }
                            autoComplete="name"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="customer-phone"
                            className="mb-2 block text-sm font-semibold text-[#202522]"
                          >
                            Telefone / WhatsApp
                          </label>

                          <Input
                            id="customer-phone"
                            value={
                              customer.phone
                            }
                            onChange={(
                              event,
                            ) =>
                              setCustomer(
                                {
                                  ...customer,
                                  phone: event
                                    .target
                                    .value,
                                },
                              )
                            }
                            placeholder="+244 9xx xxx xxx"
                            className="h-12 rounded-[7px] border-[#c9c3b8] bg-[#fffdf9] text-sm font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                            maxLength={
                              40
                            }
                            autoComplete="tel"
                            inputMode="tel"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="customer-email"
                            className="mb-2 block text-sm font-semibold text-[#202522]"
                          >
                            Email
                            <span className="ml-1 font-normal text-[#747b73]">
                              opcional
                            </span>
                          </label>

                          <Input
                            id="customer-email"
                            value={
                              customer.email
                            }
                            onChange={(
                              event,
                            ) =>
                              setCustomer(
                                {
                                  ...customer,
                                  email: event
                                    .target
                                    .value,
                                },
                              )
                            }
                            placeholder="seu@email.com"
                            type="email"
                            className="h-12 rounded-[7px] border-[#c9c3b8] bg-[#fffdf9] text-sm font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                            maxLength={
                              160
                            }
                            autoComplete="email"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="customer-notes"
                            className="mb-2 block text-sm font-semibold text-[#202522]"
                          >
                            Morada / observações
                            <span className="ml-1 font-normal text-[#747b73]">
                              opcional
                            </span>
                          </label>

                          <Textarea
                            id="customer-notes"
                            value={
                              customer.notes
                            }
                            onChange={(
                              event,
                            ) =>
                              setCustomer(
                                {
                                  ...customer,
                                  notes: event
                                    .target
                                    .value,
                                },
                              )
                            }
                            placeholder="Morada, referência ou alguma observação"
                            className="min-h-[110px] resize-none rounded-[7px] border-[#c9c3b8] bg-[#fffdf9] text-sm font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                            maxLength={
                              1000
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUCCESS */}

              {cartStep ===
                "success" && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="flex min-h-full flex-col items-center justify-center px-7 py-12 text-center sm:px-10">
                    <div className="grid h-20 w-20 place-items-center rounded-[7px] bg-black text-white">
                      <Check className="h-9 w-9 stroke-[2.5]" />
                    </div>

                    <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#747b73]">
                      Pedido recebido
                    </p>

                    <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#202522]">
                      Tudo certo.
                    </h2>

                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#747b73]">
                      O seu pedido foi registado com sucesso. A loja poderá entrar em contacto consigo para combinar os próximos passos.
                    </p>

                    {orderId && (
                      <div className="mt-7 rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#747b73]">
                          Pedido
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-[#202522]">
                          #{orderId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FIXED FOOTER */}

              {cartStep ===
                "cart" && (
                <div className="shrink-0 border-t border-[#ded9d0] bg-[#fffdf9] px-5 py-5 sm:px-6">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-xs font-medium text-[#747b73]">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-bold tracking-tight text-[#202522]">
                        {formatMoney(
                          cartTotal,
                          currency,
                        )}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={
                        goToCheckout
                      }
                      className="h-12 rounded-[7px] bg-black px-5 text-sm font-bold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                    >
                      Finalizar pedido
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {cartStep ===
                "checkout" && (
                <div className="shrink-0 border-t border-[#ded9d0] bg-[#fffdf9] px-5 py-5 sm:px-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#747b73]">
                      Total
                    </span>

                    <span className="text-lg font-bold text-[#202522]">
                      {formatMoney(
                        cartTotal,
                        currency,
                      )}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={
                      checkout
                    }
                    disabled={
                      placing
                    }
                    className="h-12 w-full rounded-[7px] bg-black text-sm font-bold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar pedido...
                      </>
                    ) : (
                      <>
                        Confirmar pedido
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {cartStep ===
                "success" && (
                <div className="shrink-0 border-t border-[#ded9d0] bg-[#fffdf9] px-5 py-5 sm:px-6">
                  <Button
                    type="button"
                    onClick={() => {
                      if (
                        orderId
                      ) {
                        closeCart();

                        window.setTimeout(
                          () => {
                            navigate(
                              `/loja/${slug}/pedido/${orderId}`,
                            );
                          },
                          180,
                        );
                      }
                    }}
                    className="h-12 w-full rounded-[7px] bg-black text-sm font-bold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[#e36c3f] focus-visible:ring-offset-2"
                  >
                    Ver pedido
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    onClick={
                      continueShopping
                    }
                    className="mt-3 flex min-h-10 w-full items-center justify-center text-sm font-semibold text-[#5f625d] transition hover:text-[#202522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  >
                    Continuar a comprar
                  </button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* MOBILE CART */}

      {cartCount > 0 &&
        !cartOpen && (
          <button
            type="button"
            onClick={
              openCart
            }
            aria-label={`Abrir carrinho. Total ${formatMoney(
              cartTotal,
              currency,
            )}`}
            className="fixed bottom-4 left-1/2 z-40 flex min-h-12 -translate-x-1/2 items-center gap-3 rounded-[7px] bg-black px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:bottom-5 md:hidden"
          >
            <ShoppingBag className="h-4 w-4" />

            <span>
              Ver carrinho
            </span>

            <span className="h-4 w-px bg-[#fffdf9]/40" />

            <span>
              {formatMoney(
                cartTotal,
                currency,
              )}
            </span>
          </button>
        )}

      {/* FOOTER */}

      <footer className="border-t border-[#ded9d0] bg-[#f5f5f2]">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-bold tracking-tight text-[#202522]">
                {company.name}
              </p>

              {company.description && (
                <p className="mt-2 max-w-md text-sm leading-6 text-[#5f625d]">
                  {
                    company.description
                  }
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5f625d]">
                Loja online
              </p>

              <p className="mt-2 text-sm font-medium text-[#747b73]">
                ©{" "}
                {new Date().getFullYear()}{" "}
                {company.name}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
