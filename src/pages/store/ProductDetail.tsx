import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  ImageOff,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

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
      ? value as Record<string, number>
      : {};
  } catch {
    return {};
  }
};

export default function ProductDetail() {
  const { slug = "", productId = "" } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<StoreCompany | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [tab, setTab] = useState<"description" | "details">("description");
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
  const cartCount = Object.values(cart).reduce((total, count) => total + Math.max(0, Number(count) || 0), 0);
  const productPrice = product ? Number(product.promo_price ?? product.price) : 0;
  const discount = product?.promo_price != null && product.price > 0
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0;
  const whatsappNumber = company?.whatsapp?.replace(/\D/g, "") ?? "";

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
    setCart(next);

    if (openCheckout) {
      navigate(`/loja/${slug}?cart=1&checkout=1`);
      return;
    }

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
        <div className="product-detail-not-found__mark"><ImageOff className="h-6 w-6" /></div>
        <p>PRODUTO INDISPONÍVEL</p>
        <h1>Não encontrámos este produto.</h1>
        <span>O artigo pode ter sido removido ou já não estar disponível nesta loja.</span>
        <button type="button" onClick={() => goToStore()}><ArrowLeft className="h-4 w-4" /> Voltar à loja</button>
      </main>
    );
  }

  const currentImage = images[activeImage];

  return (
    <div className="storefront product-detail-page">
      <div className="product-trustbar">
        <div className="product-trustbar__inner">
          <span><ShieldCheck aria-hidden="true" /> Stock confirmado ao finalizar o pedido</span>
          <span className="product-trustbar__right">{company.name} <i /> Compra simples e segura</span>
        </div>
      </div>

      <header className="store-header product-detail-header">
        <div className="store-header__bar">
          <button type="button" onClick={() => goToStore()} aria-label={`Ir para ${company.name}`} className="store-brand">
            <span className="store-brand__mark">{company.name.charAt(0).toUpperCase()}</span>
            <span className="store-brand__name">{company.name}</span>
          </button>

          <nav aria-label="Navegação principal" className="store-nav">
            <button type="button" onClick={() => goToStore("inicio")}>Início</button>
            <button type="button" className="store-nav__active" onClick={() => goToStore("produtos")}>Produtos</button>
            <button type="button" onClick={() => goToStore("categorias")}>Categorias</button>
            <button type="button" onClick={() => goToStore("sobre")}>Sobre</button>
            <button type="button" onClick={() => goToStore("contacto")}>Contacto</button>
          </nav>

          <div className="store-header__actions">
            <form className="store-search store-search--desktop" onSubmit={searchProducts}>
              <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produtos..." aria-label="Pesquisar produtos" />
            </form>
            <span className="store-header__divider" aria-hidden="true" />
            <button type="button" onClick={openStoreCart} aria-label={cartCount ? `Abrir carrinho com ${cartCount} artigos` : "Abrir carrinho"} className="store-cart-icon">
              <ShoppingCart className="h-[19px] w-[19px]" />
              {cartCount > 0 && <span className="store-cart-count">{cartCount}</span>}
            </button>
            <button type="button" onClick={openStoreCart} className="store-cart-button">
              Carrinho{cartCount > 0 && <span className="store-cart-button__count">{cartCount}</span>}
            </button>
          </div>
        </div>
        <form className="store-search store-search--mobile product-detail-mobile-search" onSubmit={searchProducts}>
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produtos..." aria-label="Pesquisar produtos" />
        </form>
      </header>

      <main className="product-detail-main">
        <nav className="product-breadcrumb" aria-label="Percurso">
          <button type="button" onClick={() => goToStore()} aria-label="Voltar à loja"><ArrowLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => goToStore("produtos")}>Produtos</button>
          <ChevronRight aria-hidden="true" />
          {product.category && <><button type="button" onClick={() => goToStore("categorias")}>{product.category}</button><ChevronRight aria-hidden="true" /></>}
          <span aria-current="page">{product.name}</span>
        </nav>

        <section className="product-detail-layout" aria-label={`Detalhes de ${product.name}`}>
          <div className={`product-gallery${images.length > 1 ? " has-thumbs" : ""}`}>
            {images.length > 1 && (
              <div className="product-gallery__thumbs" aria-label="Imagens do produto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={activeImage === index ? "is-active" : ""}
                    aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                    aria-pressed={activeImage === index}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="product-gallery__hero">
              {currentImage && !imageFailed ? (
                <img key={currentImage} src={currentImage} alt={product.name} onError={() => setImageFailed(true)} />
              ) : (
                <div className="product-gallery__empty"><ImageOff aria-hidden="true" /><span>Imagem não disponível</span></div>
              )}
              <span className="product-gallery__badge">{product.stock > 0 ? "Disponível" : "Esgotado"}</span>
              <button type="button" className={`product-gallery__favorite${favorite ? " is-active" : ""}`} onClick={() => setFavorite((value) => !value)} aria-label={favorite ? "Remover dos favoritos" : "Guardar nos favoritos"} aria-pressed={favorite}>
                <Heart aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
              </button>
              {images.length > 1 && (
                <>
                  <span className="product-gallery__count">{activeImage + 1} / {images.length}</span>
                  <div className="product-gallery__controls">
                    <button type="button" onClick={() => setActiveImage((index) => (index - 1 + images.length) % images.length)} aria-label="Imagem anterior"><ArrowLeft aria-hidden="true" /></button>
                    <button type="button" onClick={() => setActiveImage((index) => (index + 1) % images.length)} aria-label="Próxima imagem"><ArrowRight aria-hidden="true" /></button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="product-detail-info">
            {product.category && <p className="product-detail-info__category">{product.category}</p>}
            <h1>{product.name}</h1>
            <div className="product-detail-info__price-row">
              <strong>{formatMoney(productPrice, company.currency)}</strong>
              {discount > 0 && <><del>{formatMoney(product.price, company.currency)}</del><span className="product-detail-info__discount">-{discount}%</span></>}
            </div>
            {product.description && <p className="product-detail-info__description">{product.description}</p>}

            <div className="product-detail-stock">
              <span>Disponibilidade</span>
              <strong className={product.stock > 0 ? "is-available" : "is-unavailable"}>
                {product.stock > 0 ? `${product.stock} ${product.stock === 1 ? "unidade disponível" : "unidades disponíveis"}` : "Esgotado"}
              </strong>
            </div>

            <div className="product-detail-buyrow">
              <div className="product-quantity" aria-label="Quantidade">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade" disabled={quantity <= 1}><Minus aria-hidden="true" /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} aria-label="Aumentar quantidade" disabled={quantity >= product.stock}><Plus aria-hidden="true" /></button>
              </div>
              <button type="button" className="product-detail-add" onClick={() => saveCart(false)} disabled={product.stock <= 0}>
                <ShoppingCart aria-hidden="true" /> Adicionar ao carrinho
              </button>
            </div>
            <button type="button" className="product-detail-buy-now" onClick={() => saveCart(true)} disabled={product.stock <= 0}>
              <Check aria-hidden="true" /> Comprar agora
            </button>
            {product.stock > 0 && product.stock <= 3 && <p className="product-detail-low-stock">Poucas unidades disponíveis — a quantidade é atualizada no checkout.</p>}
          </div>

          <aside className="product-trust-panel" aria-label="Informações da compra">
            <div><ShieldCheck aria-hidden="true" /><p><strong>Stock confirmado</strong><span>A disponibilidade é validada ao finalizar o pedido.</span></p></div>
            <div><PackageCheck aria-hidden="true" /><p><strong>Pedido simples</strong><span>Adicione o artigo e conclua os dados no carrinho.</span></p></div>
            {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><Truck aria-hidden="true" /><p><strong>Fale com a loja</strong><span>Esclareça dúvidas diretamente com {company.name}.</span></p></a>}
          </aside>
        </section>

        <section className="product-detail-lower">
          <div className="product-tabs">
            <div className="product-tabs__list" role="tablist" aria-label="Informações do produto">
              <button type="button" role="tab" aria-selected={tab === "description"} className={tab === "description" ? "is-active" : ""} onClick={() => setTab("description")}>Descrição</button>
              <button type="button" role="tab" aria-selected={tab === "details"} className={tab === "details" ? "is-active" : ""} onClick={() => setTab("details")}>Detalhes</button>
            </div>
            {tab === "description" ? (
              <div className="product-tabs__content" role="tabpanel">
                {product.description ? <p>{product.description}</p> : <p>Esta loja ainda não adicionou uma descrição para o produto.</p>}
              </div>
            ) : (
              <div className="product-tabs__content" role="tabpanel">
                {product.category && <p><span>Categoria</span><strong>{product.category}</strong></p>}
                {product.sku && <p><span>Referência</span><strong>{product.sku}</strong></p>}
                <p><span>Disponibilidade</span><strong>{product.stock > 0 ? "Em stock" : "Esgotado"}</strong></p>
              </div>
            )}
          </div>

          {relatedProducts.length > 0 && (
            <section className="product-related" aria-label="Outros produtos da loja">
              <div className="product-related__heading"><h2>Outros produtos da loja</h2><button type="button" onClick={() => goToStore("produtos")}>Ver todos <ArrowRight aria-hidden="true" /></button></div>
              <div className="product-related__grid">
                {relatedProducts.map((related) => (
                  <button key={related.id} type="button" className="product-related-card" onClick={() => navigate(`/loja/${slug}/produto/${related.id}`)}>
                    <span className="product-related-card__image">{related.images?.[0] ? <img src={related.images[0]} alt="" loading="lazy" /> : <ImageOff aria-hidden="true" />}</span>
                    <span className="product-related-card__name">{related.name}</span>
                    <strong>{formatMoney(Number(related.promo_price ?? related.price), company.currency)}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      <footer className="product-detail-footer">
        <button type="button" onClick={() => goToStore()}><span className="store-brand__mark">{company.name.charAt(0).toUpperCase()}</span><span>{company.name}</span></button>
        <span>Produto e disponibilidade sujeitos à confirmação no pedido.</span>
      </footer>
    </div>
  );
}
