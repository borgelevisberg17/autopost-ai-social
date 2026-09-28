import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, slugify } from "@/lib/format";
import { toast } from "sonner";
import { Store } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { reload, select } = useCompany();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("AOA");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const s = slugify(slug || name);
    if (!name.trim() || !s) return toast.error("Indique o nome da empresa");
    setSaving(true);
    const { data, error } = await supabase.from("companies").insert({ name: name.trim(), slug: s, currency, description: description || null, created_by: user.id }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Esse endereço da loja já existe" : error.message);
    select(data.id);
    await reload();
    toast.success("Empresa criada");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <form onSubmit={submit} className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-lg space-y-5">
        <div className="w-12 h-12 rounded-2xl gradient-primary grid place-items-center"><Store className="w-6 h-6 text-primary-foreground" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold">Criar a sua empresa</h1>
          <p className="text-muted-foreground text-sm">Cada empresa tem o seu catálogo, pedidos e agentes.</p>
        </div>
        <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} placeholder="Ex: Sapataria Luanda" maxLength={80} /></div>
        <div className="space-y-2"><Label>Endereço da loja</Label>
          <div className="flex items-center gap-1 text-sm"><span className="text-muted-foreground">/loja/</span><Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></div>
        </div>
        <div className="space-y-2"><Label>Moeda</Label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Sobre o negócio</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que vende, para quem, estilo da marca…" maxLength={500} /></div>
        <Button type="submit" className="w-full" disabled={saving}>{saving ? "A criar…" : "Criar empresa"}</Button>
      </form>
    </div>
  );
}
