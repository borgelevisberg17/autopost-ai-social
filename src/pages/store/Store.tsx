import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  ImageOff,
  Info,
  Loader2,
  Minus,
  Plus,
  Play,
  Search,
  ShoppingBag,
  ShoppingCart,
  Lock,
  Tag,
  Trash2,
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
import { rememberOrder } from "@/lib/myOrders";
import { MyOrders } from "@/components/store/MyOrders";
import { StoreFooter } from "@/components/store/StoreFooter";

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


const DEFAULT_CATEGORIES = [
  { name: "Sneakers", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=300&q=80" },
  { name: "Casual", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=300&q=80" },
  { name: "Sociais", image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=300&q=80" },
  { name: "Chinelos", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=300&q=80" },
  { name: "Acessórios", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80" },
];

type CartStep = "cart" | "checkout" | "success";

export default function Store() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [company, setCompany] = useState<
    Company | null | undefined
  >(undefined);

  const [products, setProducts] = useState<Product[]>([]);
  const [storeLoaded, setStoreLoaded] = useState(false);

  const [category, setCategory] = useState("Todos");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") || "",
  );

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

  const [cartVariants] = useState<Record<string, { color?: string; size?: number }>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cart_variants.${slug}`) || "{}");
    } catch {
      return {};
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] =
    useState<CartStep>("cart");

  const [productOpen, setProductOpen] =
    useState<Product | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

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

  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);
  const checkoutTitleRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!cartOpen) return;

    const focusTarget =
      cartStep === "checkout"
        ? window.matchMedia("(max-width: 639px)").matches
          ? checkoutTitleRef.current
          : customerNameRef.current
        : cartStep === "success"
          ? successHeadingRef.current
          : null;

    if (!focusTarget) return;

    const frame = window.requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [cartOpen, cartStep]);

  const loadStore = async () => {
    setStoreLoaded(false);
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
      setStoreLoaded(true);
      return;
    }

    if (!store) {
      setCompany(null);
      setStoreLoaded(true);
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
      setStoreLoaded(true);
      return;
    }

    setProducts((productData as Product[]) ?? []);
    setStoreLoaded(true);
  };

  useEffect(() => {
    loadStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!storeLoaded || searchParams.get("cart") !== "1") return;

    setCartStep(searchParams.get("checkout") === "1" ? "checkout" : "cart");
    setCartOpen(true);
  }, [searchParams, storeLoaded]);

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

  const isUnfilteredProductView =
    category === "Todos" && !search.trim();
  const displayedProducts = useMemo(() => {
    if (!isUnfilteredProductView || showAllProducts) {
      return filteredProducts;
    }

    return filteredProducts.slice(0, 5);
  }, [filteredProducts, isUnfilteredProductView, showAllProducts]);

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
    products.slice(0, 3);

  const categoryItems = useMemo(() => {
    const rawCategories = categories.filter((c) => c !== "Todos");
    const result: { name: string; image?: string }[] = [];

    rawCategories.forEach((name) => {
      const p = products.find((prod) => prod.category === name && prod.images?.[0]);
      const def = DEFAULT_CATEGORIES.find((d) => d.name.toLowerCase() === name.toLowerCase());
      result.push({
        name,
        image: p?.images?.[0] || def?.image,
      });
    });

    DEFAULT_CATEGORIES.forEach((def) => {
      if (result.length < 5 && !result.some((r) => r.name.toLowerCase() === def.name.toLowerCase())) {
        result.push({ name: def.name, image: def.image });
      }
    });

    return result.slice(0, 5);
  }, [categories, products]);

  const toggleFavorite = (productId: string) => {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

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
      customerNameRef.current?.focus();
      return;
    }

    if (
      !customer.phone.trim() &&
      !customer.email.trim()
    ) {
      toast.error(
        "Indique o telefone ou email.",
      );
      customerPhoneRef.current?.focus();
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

    rememberOrder(slug, String(data));
    closeCart();
    navigate(`/loja/${slug}/pedido/${String(data)}`);

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

  const currentHeroIndex = Math.min(heroIndex, Math.max(featuredProducts.length - 1, 0));
  const heroProduct = featuredProducts[currentHeroIndex];
  const heroImage = heroProduct?.images?.[0];
  const changeHero = (direction: number) => {
    if (featuredProducts.length < 2) return;
    setHeroIndex((current) => (current + direction + featuredProducts.length) % featuredProducts.length);
  };
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="storefront min-h-screen bg-white text-[#111214]">
      {/* Top Announcement Bar */}
      <div className="bg-[#0b0c0e] text-white/90 text-xs py-2 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Entrega para todo Angola
          </span>
          <span className="opacity-40">•</span>
          <span>Compra segura e confiável</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] sm:text-xs text-white/70">
          <button type="button" onClick={() => scrollTo("sobre")} className="hover:text-white transition">
            Ajuda
          </button>
          <span className="opacity-40">|</span>
          <button type="button" onClick={() => scrollTo("sobre")} className="hover:text-white transition">
            Trocas e Devoluções
          </button>
          <span className="opacity-40">|</span>
          <button type="button" onClick={() => scrollTo("contacto")} className="hover:text-white transition">
            Contacto
          </button>
        </div>
      </div>
      <header className="store-header">
        <div className="store-header__bar">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={`Ir para o início da loja ${company.name}`}
            className="store-brand"
          >
            <span className="store-brand__mark">{company.name.charAt(0).toUpperCase()}</span>
            <span className="store-brand__name">{company.name}</span>
          </button>

          <nav aria-label="Navegação principal" className="store-nav">
            <button type="button" className="store-nav__active" onClick={() => scrollTo("inicio")}>Início</button>
            <button type="button" onClick={() => scrollTo("produtos")}>Produtos</button>
            {categoryItems.length > 0 && <button type="button" onClick={() => scrollTo("categorias")}>Categorias</button>}
            <button type="button" onClick={() => scrollTo("sobre")}>Sobre</button>
            <button type="button" onClick={() => scrollTo("contacto")}>Contacto</button>
          </nav>

          <div className="store-header__actions">
            <label className="store-search store-search--desktop">
              <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") scrollTo("produtos"); }}
                placeholder="Pesquisar produtos..."
                aria-label="Pesquisar produtos"
              />
              {search && <button type="button" aria-label="Limpar pesquisa" onClick={() => setSearch("")}><X className="h-4 w-4" /></button>}
            </label>
            <span className="store-header__divider" aria-hidden="true" />
            <button type="button" onClick={openCart} aria-label={cartCount ? `Abrir carrinho com ${cartCount} itens` : "Abrir carrinho"} className="store-cart-icon">
              <ShoppingCart className="h-[19px] w-[19px]" />
              {cartCount > 0 && <span className="store-cart-count">{cartCount}</span>}
            </button>
            <button type="button" onClick={openCart} className="store-cart-button">
              Carrinho{cartCount > 0 && <span className="store-cart-button__count">{cartCount}</span>}
            </button>
          </div>
        </div>
        <label className="store-search store-search--mobile">
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produtos..." aria-label="Pesquisar produtos" />
          {search && <button type="button" aria-label="Limpar pesquisa" onClick={() => setSearch("")}><X className="h-4 w-4" /></button>}
        </label>
        <nav aria-label="Navegação da loja" className="store-mobile-nav">
          <button type="button" className="store-mobile-nav__active" onClick={() => scrollTo("inicio")}>Início</button>
          <button type="button" onClick={() => scrollTo("produtos")}>Produtos</button>
          {categoryItems.length > 0 && <button type="button" onClick={() => scrollTo("categorias")}>Categorias</button>}
          <button type="button" onClick={() => scrollTo("sobre")}>Sobre</button>
          <button type="button" onClick={() => scrollTo("contacto")}>Contacto</button>
        </nav>
      </header>

      <main>
        <section id="inicio" className="store-hero" aria-label={`Destaques de ${company.name}`}>
          <div className="store-hero__visual" aria-hidden={!heroImage}>
            {heroImage ? (
              <img
                key={heroProduct?.id}
                src={heroImage}
                alt={heroProduct?.name ?? ""}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div className="store-hero__fallback">
                <span className="store-hero__fallback-orbit store-hero__fallback-orbit--one" />
                <span className="store-hero__fallback-orbit store-hero__fallback-orbit--two" />
                <span className="store-hero__fallback-mark">{company.name.charAt(0).toUpperCase()}</span>
                <span className="store-hero__fallback-caption">{company.name}</span>
              </div>
            )}
          </div>
          <div className="store-hero__shade" />
          <div className="store-hero__content">
            <p className="store-hero__eyebrow"><span>{company.name}</span><i /></p>
            <h1><span className="store-hero__headline-line">Produtos que</span><span className="store-hero__headline-line store-hero__headline-line--final">fazem sentido</span></h1>
            <p className="store-hero__copy">
              {company.description || "Estilo, qualidade e escolhas feitas para si."}
              <span> Descubra a coleção e encontre os seus favoritos.</span>
            </p>
            <div className="store-hero__actions">
              <Button onClick={() => scrollTo("produtos")} className="store-hero__primary">
                Explorar produtos <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <button type="button" onClick={() => { setCategory("Todos"); setShowAllProducts(true); scrollTo("produtos"); }} className="store-hero__secondary">
                <span className="store-hero__play" aria-hidden="true"><Play className="h-4 w-4" fill="currentColor" /></span>
                Ver coleção
              </button>
            </div>
          </div>
          <div className="store-hero__side-note" aria-hidden="true">
            <span>{String(currentHeroIndex + 1).padStart(2, "0")}</span><i /><span>{String(Math.max(featuredProducts.length, 1)).padStart(2, "0")}</span>
          </div>
          <div className="store-hero__bottom-note" aria-hidden="true">CURADORIA · {company.name.toUpperCase()}</div>
          <div className="store-hero__controls" aria-label="Navegar pelos destaques">
            <button type="button" onClick={() => changeHero(-1)} disabled={featuredProducts.length < 2} aria-label="Destaque anterior"><ArrowLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => changeHero(1)} disabled={featuredProducts.length < 2} aria-label="Próximo destaque"><ArrowRight className="h-5 w-5" /></button>
          </div>
        </section>

        {categoryItems.length > 0 && (
          <section id="categorias" className="store-category-rail" aria-label="Explorar categorias">
            <div className="store-category-rail__track">
              {categoryItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={category === item.name}
                  onClick={() => { setCategory(item.name); scrollTo("produtos"); }}
                  className={`store-category-card${category === item.name ? " is-active" : ""}`}
                >
                  <span className="store-category-card__image">
                    {item.image ? <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ShoppingBag aria-hidden="true" className="h-7 w-7" />}
                  </span>
                  <span className="store-category-card__text"><strong>{item.name}</strong></span>
                  <ArrowRight aria-hidden="true" className="store-category-card__arrow h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </section>
        )}

        <MyOrders slug={slug} />

        <section id="produtos" className="store-products">
          <div className="store-products__heading">
            <div>
              <h2><span aria-hidden="true" />{search.trim() ? "Resultados da pesquisa" : category !== "Todos" ? category : showAllProducts ? "Todos os produtos" : "Produtos em Destaque"}</h2>
              {(search.trim() || category !== "Todos") && <p className="store-products__count">{filteredProducts.length} {filteredProducts.length === 1 ? "produto disponível" : "produtos disponíveis"}</p>}
            </div>
            <div className="store-products__heading-actions">
              {category !== "Todos" && <button type="button" onClick={() => setCategory("Todos")} className="store-filter-reset">Todas as categorias</button>}
              {((isUnfilteredProductView && filteredProducts.length > 5) || !isUnfilteredProductView) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isUnfilteredProductView && showAllProducts) {
                      setShowAllProducts(false);
                      return;
                    }
                    setCategory("Todos");
                    setSearch("");
                    setShowAllProducts(true);
                  }}
                  className="store-view-all"
                >
                  {isUnfilteredProductView && showAllProducts ? "Ver destaques" : "Ver todos os produtos"}
                  {isUnfilteredProductView && showAllProducts ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="store-empty">
              <div className="store-empty__icon"><ShoppingBag className="h-6 w-6" /></div>
              <p className="store-empty__eyebrow">{products.length === 0 ? "NOVA COLEÇÃO EM PREPARAÇÃO" : "NÃO ENCONTRÁMOS RESULTADOS"}</p>
              <h3>{products.length === 0 ? "Algo especial está a caminho." : "Experimente outra pesquisa."}</h3>
              <p>{products.length === 0 ? "Estamos a preparar a seleção desta loja. Volte em breve para descobrir novidades." : "Ajuste os filtros ou veja novamente todos os produtos da loja."}</p>
              {(search || category !== "Todos") && <button type="button" onClick={() => { setSearch(""); setCategory("Todos"); }} className="store-empty__reset">Limpar filtros <ArrowRight className="h-4 w-4" /></button>}
            </div>
          ) : (
            <div className={`store-product-grid${displayedProducts.length === 1 ? " store-product-grid--single" : ""}`}>
              {displayedProducts.map((product, index) => {
                const price = priceOf(product);
                const discount = product.promo_price != null && product.price > 0 ? Math.round(((product.price - product.promo_price) / product.price) * 100) : 0;
                const isFavorite = favorites.includes(product.id);
                return (
                  <article key={product.id} className="store-product-card">
                    <div className="store-product-card__media">
                      <button type="button" onClick={() => navigate(`/loja/${slug}/produto/${product.id}`)} aria-label={`Ver detalhes de ${product.name}`} className="store-product-card__image-button">
                        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="store-product-card__placeholder"><ImageOff className="h-7 w-7" /></span>}
                      </button>
                      {discount > 0 ? <span className="store-product-card__badge">-{discount}%</span> : index === 0 ? <span className="store-product-card__badge store-product-card__badge--new">Novo</span> : null}
                      <button type="button" onClick={() => toggleFavorite(product.id)} aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Guardar ${product.name} nos favoritos`} aria-pressed={isFavorite} className={`store-product-card__favorite${isFavorite ? " is-active" : ""}`}>
                        <Heart className="h-[18px] w-[18px]" fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button type="button" onClick={() => navigate(`/loja/${slug}/produto/${product.id}`)} className="store-product-card__quick-view">Ver produto <ArrowRight className="h-4 w-4" /></button>
                    </div>
                    <div className="store-product-card__details">
                      {product.category && <p className="store-product-card__category">{product.category}</p>}
                      <button type="button" onClick={() => navigate(`/loja/${slug}/produto/${product.id}`)} className="store-product-card__name">{product.name}</button>
                      <div className="store-product-card__footer">
                        <div className="store-product-card__price-block">
                          <strong>{formatMoney(price, currency)}</strong>
                          {product.promo_price != null && <del>{formatMoney(product.price, currency)}</del>}
                        </div>
                        <button type="button" aria-label={`Adicionar ${product.name} ao carrinho`} disabled={product.stock === 0} onClick={() => changeQuantity(product, 1)} className="store-product-card__add"><ShoppingCart className="h-4 w-4" />Adicionar</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="sobre" className="store-marketing-banner" aria-label="Destaque da coleção">
          <div className="store-marketing-banner__content">
            <h2 className="store-marketing-banner__title">
              Estilo em<br />
              cada passo.
            </h2>
            <p className="store-marketing-banner__subtitle">
              Qualidade, conforto e muito mais.
            </p>
            <button
              type="button"
              onClick={() => scrollTo("produtos")}
              className="store-marketing-banner__cta"
            >
              Explorar produtos <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="store-marketing-banner__visual">
            <img
              src={
                heroImage ||
                "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80"
              }
              alt={company.name}
            />
            <div className="store-marketing-banner__gradient" />
          </div>
        </section>
      </main>

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
              <div className="relative aspect-[4/5] bg-[#f1f2f5]">
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
                    className="h-full w-full object-contain p-6"
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
                  className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-[#202522] shadow-md transition hover:bg-[#f1f2f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169f5]"
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
                  className="mt-6 h-12 w-full rounded-full bg-[#155eef] text-sm font-bold text-white shadow-sm hover:bg-[#0e4fd1] focus-visible:ring-2 focus-visible:ring-[#4169f5] focus-visible:ring-offset-2"
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
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="store-cart-sheet flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden border-l border-[#e3e5e8] bg-white p-0 max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[92dvh] max-sm:max-h-[92dvh] max-sm:w-full max-sm:rounded-t-[28px] max-sm:rounded-b-none max-sm:border-l-0 max-sm:border-t sm:max-w-xl sm:rounded-l-2xl"
        >
          {/* HEADER */}

          <div className="shrink-0 border-b border-[#e3e5e8] bg-white px-6 py-5 sm:px-8 sm:py-7">
            <SheetHeader>
              <div className="flex items-center gap-4 sm:gap-6">
                {cartStep !== "checkout" && (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f1f2f5] text-[#111216] sm:h-20 sm:w-20">
                    {cartStep === "success" ? <Check className="h-8 w-8" /> : <ShoppingCart className="h-8 w-8 sm:h-9 sm:w-9" />}
                  </span>
                )}
                {cartStep ===
                  "checkout" && (
                  <button
                    type="button"
                    onClick={
                      goBackToCart
                    }
                    aria-label="Voltar ao carrinho"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#ded9d0] text-[#303732] transition hover:bg-[#ebe7df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                <div className="min-w-0">
                  <SheetTitle
                    ref={checkoutTitleRef}
                    tabIndex={-1}
                    className="text-2xl font-bold tracking-tight text-[#111216] focus:outline-none sm:text-[30px]"
                  >
                    {cartStep ===
                    "cart"
                      ? "Carrinho"
                      : cartStep ===
                          "checkout"
                        ? "Finalizar pedido"
                        : "Pedido confirmado"}
                  </SheetTitle>

                  {cartStep === "cart" && (
                    <p className="mt-1 text-sm font-medium text-[#73757b] sm:text-base">
                      Seu carrinho de compras
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
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#f1f2f5]">
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
                className="mt-7 h-11 rounded-full bg-[#155eef] px-6 text-sm font-bold text-white hover:bg-[#0e4fd1]"
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
                    <div className="px-6 sm:px-8">
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
                                className="py-6"
                              >
                                <div className="flex gap-4 sm:gap-6">
                                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f1f2f5] sm:h-36 sm:w-36">
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
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                      <p className="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-6 text-[#111216] sm:text-lg">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-[#73757b] mt-0.5 font-medium">
                                        Tamanho: {cartVariants[product.id]?.size || 42} • Cor: {cartVariants[product.id]?.color || "Branco"}
                                      </p>
                                      <p className="shrink-0 text-sm font-bold tabular-nums text-[#111216] sm:text-lg">
                                        {formatMoney(itemTotal, currency)}
                                      </p>
                                    </div>

                                    <div className="mt-7 flex items-center justify-between gap-3">
                                      <div className="inline-flex h-12 items-center overflow-hidden rounded-full border border-[#e3e5e8]">
                                        <button
                                          type="button"
                                          onClick={() => changeQuantity(product, -1)}
                                          aria-label={`Diminuir quantidade de ${product.name}`}
                                          className="grid h-12 w-12 place-items-center text-[#202226] transition hover:bg-[#f1f2f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4169f5]"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="grid h-12 w-14 place-items-center bg-[#f1f2f5] text-base font-bold tabular-nums text-[#111216]">
                                          {quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => changeQuantity(product, 1)}
                                          aria-label={`Aumentar quantidade de ${product.name}`}
                                          className="grid h-12 w-12 place-items-center text-[#202226] transition hover:bg-[#f1f2f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4169f5]"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...cart };
                                          delete next[product.id];
                                          updateCart(next);
                                        }}
                                        aria-label={`Remover ${product.name}`}
                                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1f2f5] text-[#111216] transition hover:bg-[#e7e9ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169f5]"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                      {/* Coupon / Discount Code */}
                      <div className="cart-discount-row mx-6 sm:mx-8 my-4">
                        <span className="cart-discount-row__icon"><Tag className="h-4 w-4" /></span>
                        <input type="text" placeholder="Código de desconto" />
                        <button type="button" onClick={() => toast.info("Nenhum cupom ativo no momento.")}>Aplicar</button>
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
                            ref={customerNameRef}
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
                            className="h-12 rounded-xl border-[#c9c3b8] bg-[#fffdf9] text-base font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:text-sm"
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
                            ref={customerPhoneRef}
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
                            className="h-12 rounded-xl border-[#c9c3b8] bg-[#fffdf9] text-base font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:text-sm"
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
                            className="h-12 rounded-xl border-[#c9c3b8] bg-[#fffdf9] text-base font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:text-sm"
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
                            className="min-h-[110px] resize-none rounded-xl border-[#c9c3b8] bg-[#fffdf9] text-base font-medium text-[#202522] placeholder:text-[#747b73] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#e36c3f] sm:text-sm"
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
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-black text-white">
                      <Check className="h-9 w-9 stroke-[2.5]" />
                    </div>

                    <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#747b73]">
                      Pedido recebido
                    </p>

                    <h2
                      ref={successHeadingRef}
                      tabIndex={-1}
                      className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#202522] focus:outline-none"
                    >
                      Tudo certo.
                    </h2>

                    <p className="mt-4 max-w-sm text-sm leading-6 text-[#747b73]">
                      O seu pedido foi registado com sucesso. A loja poderá entrar em contacto consigo para combinar os próximos passos.
                    </p>

                    {orderId && (
                      <div className="mt-7 rounded-xl border border-[#ded9d0] bg-[#f1eee7] px-5 py-4">
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
                <div className="shrink-0 border-t border-[#e3e5e8] bg-white px-6 py-5 shadow-[0_-8px_24px_-24px_rgba(0,0,0,.4)] sm:px-8 sm:pb-24">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-[#747b73]">Subtotal</span>
                      <span className="font-semibold tabular-nums text-[#202522]">{formatMoney(cartTotal, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-[#747b73]">Entrega <Info className="h-4 w-4 text-[#92949b]" /></span>
                      <span className="text-xs font-bold text-blue-600">Grátis</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-[#ded9d0] pt-3">
                      <span className="text-lg font-bold text-[#202522]">Total</span>
                      <span className="text-2xl font-bold tracking-tight tabular-nums text-[#202522]">{formatMoney(cartTotal, currency)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#747b73]">O valor e os detalhes da entrega serão combinados diretamente com a loja.</p>
                  <Button
                    type="button"
                    onClick={goToCheckout}
                    className="mt-4 h-14 w-full rounded-full bg-[#155eef] text-sm font-bold text-white shadow-md hover:bg-[#0e4fd1] focus-visible:ring-2 focus-visible:ring-[#4169f5] focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Finalizar Compra
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={continueShopping}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-blue-600 bg-white text-sm font-bold text-[#111216] transition hover:bg-blue-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Continuar Comprando
                  </button>
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
                    className="h-12 w-full rounded-full bg-[#155eef] text-sm font-bold text-white hover:bg-[#0e4fd1] focus-visible:ring-2 focus-visible:ring-[#4169f5] focus-visible:ring-offset-2"
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
                      if (!orderId) return;
                      closeCart();
                      window.setTimeout(
                        () => navigate(`/loja/${slug}/pedido/${orderId}`),
                        180,
                      );
                    }}
                    className="h-12 w-full rounded-full bg-[#155eef] text-sm font-bold text-white hover:bg-[#0e4fd1] focus-visible:ring-2 focus-visible:ring-[#4169f5] focus-visible:ring-offset-2"
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
            className="fixed bottom-4 left-1/2 z-40 flex min-h-12 -translate-x-1/2 items-center gap-3 rounded-full bg-[#155eef] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0e4fd1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#155eef] sm:bottom-5 md:hidden"
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

      <StoreFooter
        company={company}
        categories={categoryItems}
        onCategoryClick={(catName) => {
          setCategory(catName);
          scrollTo("produtos");
        }}
        onNavigateSection={(sectionId) => scrollTo(sectionId)}
      />
    </div>
  );
}
