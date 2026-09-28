import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format";
import { ShoppingCart, Minus, Plus, ImageOff, Store as StoreIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Company = { id: string; name: string; slug: string; currency: string; description: string | null; whatsapp: string | null };
type Product = { id: string; name: string; description: string | null; category: string | null; price: number; promo_price: number | null; stock: number; images: string[] };

export default function Store() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`cart.${slug}`) || "{}"); } catch { return {}; }
  });
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", notes: "" });
  const [placing, setPlacing] = useState(false);

  const load = async () => {
    const { data: c } = await supabase.from("companies").select("id,name,slug,currency,description,whatsapp").eq("slug", slug).maybeSingle();
    setCompany(c as Company | null);
    if (c) {
      const { data } = await supabase.from("products").select("id,name,description,category,price,promo_price,stock,images").eq("company_id", c.id).eq("active", true).order("created_at", { ascending: false });
      setProducts((data as Product[]) ?? []);
    }
  };
  useEffect(() => { load(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCart = (next: Record<string, number>) => { setCart(next); localStorage.setItem(`cart.${slug}`, JSON.stringify(next)); };
  const add = (p: Product, d: number) => {
    const q = Math.max(0, Math.min(p.stock, (cart[p.id] ?? 0) + d));
    const next = { ...cart }; if (q === 0) delete next[p.id]; else next[p.id] = q;
    if (d > 0 && q === (cart[p.id] ?? 0)) toast.error("Sem mais stock disponível");
    updateCart(next);
  };

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))], [products]);
  const lines = Object.entries(cart).map(([id, q]) => ({ p: products.find((x) => x.id === id), q })).filter((l) => l.p) as { p: Product; q: number }[];
  const unit = (p: Product) => Number(p.promo_price ?? p.price);
  const total = lines.reduce((a, l) => a + unit(l.p) * l.q, 0);
  const count = lines.reduce((a, l) => a + l.q, 0);

  const checkout = async () => {
    if (!customer.name.trim()) return toast.error("Indique o seu nome");
    if (!customer.phone.trim() && !customer.email.trim()) return toast.error("Indique telefone ou email");
    setPlacing(true);
    const { data, error } = await supabase.rpc("place_order", {
      _company_slug: slug, _customer_name: customer.name, _customer_phone: customer.phone, _customer_email: customer.email, _notes: customer.notes,
      _items: lines.map((l) => ({ product_id: l.p.id, quantity: l.q })),
    });
    setPlacing(false);
    if (error) { toast.error(error.message); load(); return; }
    updateCart({});
    navigate(`/loja/${slug}/pedido/${data}`);
  };

  if (company === undefined) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (company === null) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loja não encontrada.</div>;
  const cur = company.currency;
  const shown = cat === "Todos" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0"><div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shrink-0"><StoreIcon className="w-5 h-5 text-primary-foreground" /></div><span className="font-display font-bold text-lg truncate">{company.name}</span></div>
          <Button variant="secondary" onClick={() => setOpen(true)} className="relative"><ShoppingCart className="w-4 h-4" />Carrinho{count > 0 && <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2">{count}</span>}</Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {company.description && <p className="text-muted-foreground mb-4">{company.description}</p>}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categories.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{c}</button>)}
        </div>
        {shown.length === 0 ? <p className="text-center text-muted-foreground py-20">Sem produtos disponíveis.</p> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {shown.map((p) => (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                <button onClick={() => setDetail(p)} className="aspect-square bg-secondary grid place-items-center relative">
                  {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <ImageOff className="w-6 h-6 text-muted-foreground" />}
                  {p.promo_price != null && <span className="absolute top-2 left-2 rounded-full bg-accent text-accent-foreground text-xs px-2 py-0.5">-{Math.round((1 - Number(p.promo_price) / Number(p.price)) * 100)}%</span>}
                </button>
                <div className="p-3 flex flex-col flex-1">
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                  <div className="mt-1">
                    <span className="font-display font-bold">{formatMoney(unit(p), cur)}</span>
                    {p.promo_price != null && <s className="ml-2 text-xs text-muted-foreground">{formatMoney(p.price, cur)}</s>}
                  </div>
                  <p className={`text-xs mt-1 ${p.stock === 0 ? "text-destructive" : "text-muted-foreground"}`}>{p.stock === 0 ? "Esgotado" : `${p.stock} disponíveis`}</p>
                  <Button size="sm" className="mt-auto pt-2" disabled={p.stock === 0} onClick={() => add(p, 1)}>Adicionar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {detail && <>
            <SheetHeader><SheetTitle>{detail.name}</SheetTitle></SheetHeader>
            <div className="flex gap-2 overflow-x-auto my-4">{detail.images.map((i) => <img key={i} src={i} alt={detail.name} className="h-48 rounded-xl object-cover" />)}</div>
            <p className="font-display text-xl font-bold">{formatMoney(unit(detail), cur)}</p>
            {detail.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{detail.description}</p>}
            <Button className="mt-4 w-full" disabled={detail.stock === 0} onClick={() => { add(detail, 1); setDetail(null); }}>Adicionar ao carrinho</Button>
          </>}
        </SheetContent>
      </Sheet>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>O seu carrinho</SheetTitle></SheetHeader>
          {lines.length === 0 ? <p className="text-muted-foreground mt-6">Carrinho vazio.</p> : <>
            <ul className="space-y-3 my-4">
              {lines.map(({ p, q }) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0"><p className="text-sm truncate">{p.name}</p><p className="text-xs text-muted-foreground">{formatMoney(unit(p), cur)}</p></div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => add(p, -1)}><Minus className="w-3 h-3" /></Button>
                    <span className="w-6 text-center text-sm">{q}</span>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => add(p, 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="flex justify-between font-display text-lg font-bold border-t border-border pt-3 mb-4"><span>Total</span><span>{formatMoney(total, cur)}</span></p>
            <div className="space-y-2">
              <Input placeholder="Nome" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} maxLength={120} />
              <Input placeholder="Telefone / WhatsApp" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} maxLength={40} />
              <Input placeholder="Email (opcional)" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} maxLength={160} />
              <Textarea placeholder="Observações / morada" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} maxLength={1000} />
              <Button className="w-full" onClick={checkout} disabled={placing}>{placing ? "A enviar…" : "Fazer pedido"}</Button>
              <p className="text-xs text-muted-foreground text-center">Pagamento combinado com a loja após confirmação.</p>
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
