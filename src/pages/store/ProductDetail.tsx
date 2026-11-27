import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Headphones,
  Heart,
  Home,
  ImageOff,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useStoreTheme } from "@/hooks/useStoreTheme";

type StoreCompany = {
  id: string;
  name: string;
  slug: string;
  currency: string;
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
  sku: string | null;
};

const readCart = (slug: string): Record<string, number> => {
  try {
    const value = JSON.parse(localStorage.getItem(`cart.${slug}`) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, number>)
      : {};
  } catch {
    return {};
  }
};

export default function ProductDetail() {
  const { slug = "", productId = "" } = useParams();
  const navigate = useNavigate();
  const theme = useStoreTheme(slug);
  const [company, setCompany] = useState<StoreCompany | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tab, setTab] = useState<"description" | "details" | "reviews">("description");
  const [selectedColor, setSelectedColor] = useState<string>("branco");
  const [selectedSize, setSelectedSize] = useState<number>(42);
  const [isAdded, setIsAdded] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>(() => readCart(slug));
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCart(readCart(slug));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setCompany(null);
      setProduct(null);
      setRelatedProducts([]);

      const { data: store, error: storeError } = await supabase
        .from("companies")
        .select("id,name,slug,currency,whatsapp")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;
      if (storeError || !store) {
        setLoading(false);
        return;
      }

      const productQuery = supabase
        .from("products")
        .select("id,name,description,category,price,promo_price,stock,images,sku")
        .eq("company_id", store.id)
        .eq("id", productId)
        .eq("active", true)
        .maybeSingle();

      const relatedQuery = supabase
        .from("products")
        .select("id,name,description,category,price,promo_price,stock,images,sku")
        .eq("company_id", store.id)
        .eq("active", true)
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(4);

      const [productResult, relatedResult] = await Promise.all([productQuery, relatedQuery]);
      if (cancelled) return;

      if (productResult.data && !productResult.error) {
        setCompany(store as StoreCompany);
        setProduct(productResult.data as Product);
        setRelatedProducts((relatedResult.data as Product[] | null) ?? []);
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, productId]);

  useEffect(() => {
    if (!company || !product) return;
    const originalTitle = document.title;
    document.title = `${product.name} | ${company.name}`;
    return () => {
      document.title = originalTitle;
    };
  }, [company, product]);

  const images = useMemo(
    () => (product?.images ?? []).filter((image) => /^https?:\/\//i.test(image)),
    [product?.images],
  );

  useEffect(() => {
    setImageFailed(false);
  }, [activeImage, productId]);

  const cartCount = Object.values(cart).reduce(
    (total, count) => total + Math.max(0, Number(count) || 0),
    0,
  );

  const productPrice = product ? Number(product.promo_price ?? product.price) : 0;
  const discount =
    product?.promo_price != null && product.price > 0
      ? Math.round(((product.price - product.promo_price) / product.price) * 100)
      : 0;

  const goToStore = (section?: string) => {
    navigate(`/loja/${slug}${section ? `#${section}` : ""}`);
  };

  const openStoreCart = () => {
    navigate(`/loja/${slug}?cart=1`);
  };

  const searchProducts = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(`/loja/${slug}${query ? `?q=${encodeURIComponent(query)}` : "#produtos"}`);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const saveCart = (openCheckout: boolean) => {
    if (!product || product.stock <= 0) {
      toast.error("Este produto está esgotado.");
      return;
    }

    const current = readCart(slug);
    const currentQuantity = Math.max(0, Number(current[product.id]) || 0);
    const nextQuantity = Math.min(product.stock, currentQuantity + quantity);

    if (nextQuantity === currentQuantity) {
      toast.error("A quantidade máxima disponível já está no carrinho.");
      return;
    }

    const next = { ...current, [product.id]: nextQuantity };
    localStorage.setItem(`cart.${slug}`, JSON.stringify(next));

    // Also persist variant details for the cart display
    try {
      const variantKey = `cart_variants.${slug}`;
      const savedVariants = JSON.parse(localStorage.getItem(variantKey) || "{}");
      savedVariants[product.id] = {
        color: selectedColor === "branco" ? "Branco" : selectedColor === "preto" ? "Preto" : "Cinza",
        size: selectedSize,
      };
      localStorage.setItem(variantKey, JSON.stringify(savedVariants));
    } catch {
      // ignore
    }

    setCart(next);

    if (openCheckout) {
      navigate(`/loja/${slug}?cart=1&checkout=1`);
      return;
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
    toast.success(`${product.name} adicionado ao carrinho.`);
  };

  if (loading) {
    return (
      <div className="product-detail-loading" role="status" aria-label="A carregar produto">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!company || !product) {
    return (
      <main className="product-detail-not-found">
        <div className="product-detail-not-found__mark">
          <ImageOff className="h-6 w-6" />
        </div>
        <p>PRODUTO INDISPONÍVEL</p>
        <h1>Não encontrámos este produto.</h1>
        <span>O artigo pode ter sido removido ou já não estar disponível nesta loja.</span>
        <button type="button" onClick={() => goToStore()}>
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </button>
      </main>
    );
  }

  const currentImage = images[activeImage] || images[0];
  const displayImages = images.length > 0 ? images : [];

  return (
    <div className="storefront storefront--themed product-detail-page min-h-screen" style={theme.cssVars}>
      {/* 1. TOP ANNOUNCEMENT BAR (matches reference exactly) */}
      <div className="bg-[#0b0c0e] text-white/90 text-xs py-2 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Entrega para todo Angola
          </span>
          <span className="opacity-40">•</span>
          <span>Compra segura e confiável</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] sm:text-xs text-white/70">
          <button type="button" onClick={() => goToStore("sobre")} className="hover:text-white transition">
            Ajuda
          </button>
          <span className="opacity-40">|</span>
          <button type="button" onClick={() => goToStore("sobre")} className="hover:text-white transition">
            Trocas e Devoluções
          </button>
          <span className="opacity-40">|</span>
          <button type="button" onClick={() => goToStore("contacto")} className="hover:text-white transition">
            Contacto
          </button>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="store-header product-detail-header">
        <div className="store-header__bar">
          <button
            type="button"
            onClick={() => goToStore()}
            aria-label={`Ir para ${company.name}`}
            className="store-brand"
          >
            <span className="store-brand__mark">{company.name.charAt(0).toUpperCase()}</span>
            <span className="store-brand__name">{company.name}</span>
          </button>

          <nav aria-label="Navegação principal" className="store-nav">
            <button type="button" onClick={() => goToStore("inicio")}>
              Início
            </button>
            <button type="button" className="store-nav__active" onClick={() => goToStore("produtos")}>
              Produtos
            </button>
            <button type="button" onClick={() => goToStore("categorias")}>
              Categorias
            </button>
            <button type="button" onClick={() => goToStore("sobre")}>
              Sobre
            </button>
            <button type="button" onClick={() => goToStore("contacto")}>
              Contacto
            </button>
          </nav>

          <div className="store-header__actions">
            <form className="store-search store-search--desktop" onSubmit={searchProducts}>
              <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar produtos..."
                aria-label="Pesquisar produtos"
              />
            </form>
            <span className="store-header__divider" aria-hidden="true" />
            <motion.button
              type="button"
              onClick={openStoreCart}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              aria-label={cartCount ? `Abrir carrinho com ${cartCount} artigos` : "Abrir carrinho"}
              className="relative inline-flex items-center justify-center gap-2.5 h-[42px] px-3.5 sm:px-5 rounded-full bg-[#050506] text-white hover:bg-[#252529] shadow-sm transition-colors cursor-pointer select-none"
            >
              <ShoppingCart className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-[13px] font-bold tracking-tight">Carrinho</span>
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-black text-[#111] bg-white rounded-full leading-none shadow-xs"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
        <form className="store-search store-search--mobile product-detail-mobile-search" onSubmit={searchProducts}>
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar produtos..."
            aria-label="Pesquisar produtos"
          />
        </form>
      </header>

      {/* 3. MAIN BODY */}
      <main className="product-detail-main">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground my-4" aria-label="Percurso">
          <button type="button" onClick={() => goToStore()} className="hover:text-foreground transition flex items-center">
            <Home className="h-3.5 w-3.5" />
          </button>
          <span className="opacity-50">&gt;</span>
          <button type="button" onClick={() => goToStore("produtos")} className="hover:underline">
            Produtos
          </button>
          <span className="opacity-50">&gt;</span>
          <span className="hover:underline cursor-pointer" onClick={() => goToStore("categorias")}>
            {product.category || "Sneakers"}
          </span>
          <span className="opacity-50">&gt;</span>
          <span className="text-foreground font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* 3-Column Layout: Gallery | Product Info | Trust Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: GALLERY (approx 5 cols) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3">
            {/* Thumbnails list */}
            <div className="flex sm:flex-col gap-2 order-2 sm:order-1 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0">
              {displayImages.map((image, index) => (
                <motion.button
                  key={`${image}-${index}`}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveImage(index);
                    setImageFailed(false);
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#f1f2f5] border-2 transition shrink-0 cursor-pointer ${
                    activeImage === index ? "border-[#101114] shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}

              {/* Video Thumbnail placeholder if desired */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#15161a] border-2 border-transparent text-white flex items-center justify-center relative shrink-0 opacity-80 hover:opacity-100 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 fill-white text-white ml-0.5" />
                </div>
              </motion.button>
            </div>

            {/* Main Hero Photo Container */}
            <div className="relative flex-1 aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#f1f2f5] border border-neutral-100 order-1 sm:order-2">
              <AnimatePresence mode="wait">
                {currentImage && !imageFailed ? (
                  <motion.img
                    key={currentImage}
                    src={currentImage}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onError={() => setImageFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-400">
                    <ImageOff className="h-8 w-8" />
                    <span className="text-xs">Imagem indisponível</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Novo Badge */}
              <span className="absolute top-4 left-4 bg-[#101114] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Novo
              </span>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={() => setFavorite((v) => !v)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-neutral-800 shadow-md transition"
                aria-label="Guardar nos favoritos"
              >
                <Heart className={`h-4 w-4 ${favorite ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>

              {/* Bottom Image Count & Controls */}
              <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {displayImages.length > 0 ? `${activeImage + 1} / ${displayImages.length}` : "1 / 1"}
              </span>

              {displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveImage((idx) => (idx - 1 + displayImages.length) % displayImages.length)}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((idx) => (idx + 1) % displayImages.length)}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: PRODUCT DETAILS (approx 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#73757b]">
                {product.category || "NIKE"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111216] mt-1">
                {product.name}
              </h1>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-[#111216]">4.8</span>
              <span className="text-xs text-[#73757b]">(124 avaliações)</span>
            </div>

            {/* Price & Discount */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#111216]">
                {formatMoney(productPrice, company.currency)}
              </span>
              {product.promo_price != null && (
                <del className="text-sm font-medium text-[#73757b]">
                  {formatMoney(product.price, company.currency)}
                </del>
              )}
              {discount > 0 ? (
                <span className="px-2 py-0.5 text-xs font-bold text-rose-500 bg-rose-50 rounded-full">
                  -{discount}%
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-bold text-rose-500 bg-rose-50 rounded-full">
                  -33%
                </span>
              )}
            </div>

            {/* Subtitle / Tagline */}
            <p className="text-xs sm:text-sm text-[#5f625d] leading-relaxed">
              Estilo, conforto e qualidade num só lugar.
              <br />
              O clássico que nunca sai de moda.
            </p>

            {/* Color Swatches */}
            <div className="pt-2">
              <span className="text-xs font-bold text-[#111216] block mb-2">Cor:</span>
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor("branco")}
                  className={`w-7 h-7 rounded-full bg-white border-2 transition cursor-pointer ${
                    selectedColor === "branco"
                      ? "border-[#101114] ring-2 ring-[#101114]/20"
                      : "border-neutral-300"
                  }`}
                  aria-label="Branco"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor("preto")}
                  className={`w-7 h-7 rounded-full bg-black border-2 transition cursor-pointer ${
                    selectedColor === "preto"
                      ? "border-[#101114] ring-2 ring-[#101114]/20"
                      : "border-transparent"
                  }`}
                  aria-label="Preto"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor("cinza")}
                  className={`w-7 h-7 rounded-full bg-neutral-400 border-2 transition cursor-pointer ${
                    selectedColor === "cinza"
                      ? "border-[#101114] ring-2 ring-[#101114]/20"
                      : "border-transparent"
                  }`}
                  aria-label="Cinza"
                />
              </div>
            </div>

            {/* Size Options */}
            <div className="pt-2">
              <span className="text-xs font-bold text-[#111216] block mb-2">Tamanho:</span>
              <div className="flex flex-wrap items-center gap-2">
                {[40, 41, 42, 43, 44, 45].map((size) => (
                  <motion.button
                    key={size}
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-10 h-9 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                      selectedSize === size
                        ? "bg-[#101114] text-white shadow-xs"
                        : "bg-[#f1f2f5] text-[#111216] hover:bg-[#e4e6eb]"
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart Row */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex items-center justify-between border border-[#e0e1e5] rounded-full h-12 px-3 w-28 shrink-0 bg-white">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-neutral-500 hover:text-black transition p-1 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </motion.button>
                <span className="text-xs font-bold tabular-nums">{quantity}</span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="text-neutral-500 hover:text-black transition p-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </motion.button>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => saveCart(false)}
                className={`flex-1 h-12 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-sm transition-colors duration-200 cursor-pointer ${
                  isAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-[#101114] hover:bg-black text-white"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isAdded ? (
                    <motion.span
                      key="added"
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.75, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      Adicionado com Sucesso!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Adicionar ao Carrinho
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Direct Comprar Agora */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => saveCart(true)}
              className="w-full h-12 border border-[#e0e1e5] hover:border-neutral-400 bg-white text-[#111216] font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              Comprar Agora
            </motion.button>
          </div>

          {/* RIGHT: TRUST PANEL (approx 2 cols) */}
          <div className="lg:col-span-2">
            <aside className="bg-[#f8f9fb] rounded-2xl p-5 space-y-6 border border-[#eceef1]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#111216] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#111216]">Compra Segura</h4>
                  <p className="text-[11px] text-[#73757b]">Seus dados protegidos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-[#111216] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#111216]">Entrega Rápida</h4>
                  <p className="text-[11px] text-[#73757b]">Em todo Angola</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCcw className="h-5 w-5 text-[#111216] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#111216]">Trocas Facilitadas</h4>
                  <p className="text-[11px] text-[#73757b]">Em até 7 dias</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Headphones className="h-5 w-5 text-[#111216] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#111216]">Suporte 24/7</h4>
                  <p className="text-[11px] text-[#73757b]">Estamos sempre aqui</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* 4. LOWER SECTION: TABS ON LEFT, RELATED PRODUCTS ON RIGHT */}
        <section className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-8 border-t border-neutral-200">
          {/* Tabs Column (approx 5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-6 border-b border-neutral-200 pb-1">
              <button
                type="button"
                onClick={() => setTab("description")}
                className={`pb-2.5 text-sm font-bold transition relative cursor-pointer ${
                  tab === "description" ? "text-[#111216]" : "text-[#73757b] hover:text-[#111216]"
                }`}
              >
                Descrição
                {tab === "description" && (
                  <motion.div
                    layoutId="productTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#101114]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab("details")}
                className={`pb-2.5 text-sm font-bold transition relative cursor-pointer ${
                  tab === "details" ? "text-[#111216]" : "text-[#73757b] hover:text-[#111216]"
                }`}
              >
                Especificações
                {tab === "details" && (
                  <motion.div
                    layoutId="productTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#101114]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab("reviews")}
                className={`pb-2.5 text-sm font-bold transition relative cursor-pointer ${
                  tab === "reviews" ? "text-[#111216]" : "text-[#73757b] hover:text-[#111216]"
                }`}
              >
                Avaliações (124)
                {tab === "reviews" && (
                  <motion.div
                    layoutId="productTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#101114]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "description" && (
                  <div className="space-y-4 text-xs sm:text-sm text-[#5f625d] leading-relaxed">
                    <p>
                      {product.description ||
                        "O Nike Air Force 1 é um ícone do estilo urbano, combinando design clássico, conforto incomparável e durabilidade. Perfeito para todas as ocasiões."}
                    </p>
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center gap-2.5 text-[#111216] font-medium text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Material premium</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#111216] font-medium text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Sola de borracha resistente</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#111216] font-medium text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Design icónico</span>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "details" && (
                  <div className="space-y-2 text-xs sm:text-sm text-[#5f625d]">
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-[#73757b]">Categoria</span>
                      <span className="font-semibold text-[#111216]">{product.category || "Sneakers"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-[#73757b]">Referência</span>
                      <span className="font-semibold text-[#111216]">{product.sku || "AF1-001"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-[#73757b]">Disponibilidade</span>
                      <span className="font-semibold text-emerald-600">Em stock</span>
                    </div>
                  </div>
                )}

                {tab === "reviews" && (
                  <div className="space-y-3 text-xs sm:text-sm text-[#5f625d]">
                    <div className="p-3.5 bg-[#f8f9fb] rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111216]">Manuel D.</span>
                        <div className="flex text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <Star className="h-3 w-3 fill-amber-400" />
                          <Star className="h-3 w-3 fill-amber-400" />
                          <Star className="h-3 w-3 fill-amber-400" />
                          <Star className="h-3 w-3 fill-amber-400" />
                        </div>
                      </div>
                      <p className="text-xs text-[#73757b]">
                        Excelente qualidade, calça muito bem e a entrega foi super rápida.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Related Products Column (approx 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#111216]">Produtos Relacionados</h3>
              <button
                type="button"
                onClick={() => goToStore("produtos")}
                className="text-xs font-semibold text-[#73757b] hover:text-[#111216] flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.slice(0, 4).map((related) => {
                const isRelFav = favorites.includes(related.id);
                return (
                  <motion.div
                    key={related.id}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative rounded-2xl border border-[#eceef1] bg-[#f8f9fb] p-2 text-left hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(related.id);
                      }}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-neutral-700 shadow-sm transition"
                      aria-label="Favorito"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${isRelFav ? "fill-rose-500 text-rose-500" : ""}`}
                      />
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => navigate(`/loja/${slug}/produto/${related.id}`)}
                      className="w-full text-left"
                    >
                      <div className="aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center mb-2">
                        {related.images?.[0] ? (
                          <img
                            src={related.images[0]}
                            alt={related.name}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#111216] truncate">{related.name}</h4>
                      <p className="text-xs font-extrabold text-[#111216] mt-0.5">
                        {formatMoney(Number(related.promo_price ?? related.price), company.currency)}
                      </p>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <StoreFooter
        company={company}
        onNavigateSection={(sectionId) => goToStore(sectionId)}
      />
    </div>
  );
}
