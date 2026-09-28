import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/format";
import { toast } from "sonner";

export default function CompanySettings() {
  const { company, reload } = useCompany();
  const [form, setForm] = useState({ name: "", currency: "AOA", description: "", whatsapp: "" });
  useEffect(() => { if (company) setForm({ name: company.name, currency: company.currency, description: company.description ?? "", whatsapp: company.whatsapp ?? "" }); }, [company]);

  const save = async () => {
    if (!company || !form.name.trim()) return;
    const { error } = await supabase.from("companies").update({ name: form.name.trim(), currency: form.currency, description: form.description || null, whatsapp: form.whatsapp || null }).eq("id", company.id);
    if (error) return toast.error(error.message);
    toast.success("Guardado"); reload();
  };

  return (
    <AdminLayout title="Configurações">
      <div className="glass-card rounded-2xl p-5 max-w-xl space-y-4">
        <div className="space-y-1"><Label>Nome da empresa</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></div>
        <div className="space-y-1"><Label>Moeda</Label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1"><Label>WhatsApp da loja</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+244 9xx xxx xxx" maxLength={30} /></div>
        <div className="space-y-1"><Label>Sobre o negócio (usado pelos agentes)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
        <p className="text-sm text-muted-foreground">Endereço da loja: <a className="text-primary" href={`/loja/${company?.slug}`} target="_blank" rel="noreferrer">/loja/{company?.slug}</a></p>
        <div className="flex gap-2"><Button onClick={save}>Guardar</Button><Button variant="outline" asChild><Link to="/onboarding">Criar outra empresa</Link></Button></div>
      </div>
    </AdminLayout>
  );
}
