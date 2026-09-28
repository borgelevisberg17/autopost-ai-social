import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { Plus, Pencil, Trash2, Search, ImageOff } from "lucide-react";
import { toast } from "sonner";

export type Product = {
  id: string; company_id: string; name: string; description: string | null; sku: string | null; category: string | null;
  price: number; promo_price: number | null; stock: number; images: string[]; active: boolean;
};

const empty = { name: "", description: "", sku: "", category: "", price: "", promo_price: "", stock: "0", images: "", active: true };

export default function Products() {
  const { company } = useCompany();
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("products").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
  };
  useEffect(() => { load(); }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", sku: p.sku ?? "", category: p.category ?? "", price: String(p.price), promo_price: p.promo_price != null ? String(p.promo_price) : "", stock: String(p.stock), images: p.images.join("\n"), active: p.active });
    setOpen(true);
  };

  const save = async () => {
    if (!company) return;
    const price = Number(form.price), promo = form.promo_price ? Number(form.promo_price) : null, stock = parseInt(form.stock, 10);
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    if (!(price >= 0)) return toast.error("Preço inválido");
    if (promo != null && !(promo >= 0 && promo < price)) return toast.error("A promoção deve ser menor que o preço");
    if (!(stock >= 0)) return toast.error("Stock inválido");
    const images = form.images.split("\n").map((s) => s.trim()).filter((s) => /^https:\/\//.test(s)).slice(0, 8);
    const row = { company_id: company.id, name: form.name.trim(), description: form.description || null, sku: form.sku || null, category: form.category || null, price, promo_price: promo, stock, images, active: form.active };
    const { error } = editing ? await supabase.from("products").update(row).eq("id", editing.id) : await supabase.from("products").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Produto guardado"); setOpen(false); load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Apagar "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = items.filter((p) => `${p.name} ${p.sku ?? ""} ${p.category ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <AdminLayout title="Produtos" actions={<Button onClick={openNew} size="sm"><Plus className="w-4 h-4" />Novo</Button>}>
      <div className="relative mb-4 max-w-md"><Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" /><Input className="pl-9" placeholder="Pesquisar por nome, SKU ou categoria" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">Nenhum produto ainda. <button onClick={openNew} className="text-primary">Criar o primeiro</button></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl p-3 flex gap-3">
              <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden shrink-0 grid place-items-center">
                {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <ImageOff className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  {!p.active && <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5">Inativo</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.sku || "sem SKU"} · {p.category || "sem categoria"}</p>
                <p className="text-sm mt-1">
                  {p.promo_price != null ? <><span className="font-semibold text-accent">{formatMoney(p.promo_price, company?.currency)}</span> <s className="text-muted-foreground text-xs">{formatMoney(p.price, company?.currency)}</s></> : <span className="font-semibold">{formatMoney(p.price, company?.currency)}</span>}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-accent" : "text-muted-foreground"}`}>Stock: {p.stock}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)} aria-label="Editar"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(p)} aria-label="Apagar"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={set("name")} maxLength={120} /></div>
            <div className="space-y-1"><Label>Descrição</Label><Textarea value={form.description} onChange={set("description")} maxLength={2000} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>SKU</Label><Input value={form.sku} onChange={set("sku")} maxLength={40} /></div>
              <div className="space-y-1"><Label>Categoria</Label><Input value={form.category} onChange={set("category")} maxLength={60} /></div>
              <div className="space-y-1"><Label>Preço ({company?.currency})</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} /></div>
              <div className="space-y-1"><Label>Preço promocional</Label><Input type="number" min="0" step="0.01" value={form.promo_price} onChange={set("promo_price")} placeholder="opcional" /></div>
              <div className="space-y-1"><Label>Stock</Label><Input type="number" min="0" step="1" value={form.stock} onChange={set("stock")} /></div>
              <div className="flex items-end gap-2 pb-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label></div>
            </div>
            <div className="space-y-1"><Label>Imagens (um link https por linha)</Label><Textarea value={form.images} onChange={set("images")} placeholder="https://…" /></div>
            <Button className="w-full" onClick={save}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
