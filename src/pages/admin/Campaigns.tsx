import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;
type Step = Tables<"campaign_steps">;
const CHANNELS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp (contactos)" },
  { id: "email", label: "Email (newsletter)" },
] as const;
const STATUS: Record<string, string> = {
  draft: "Rascunho", scheduled: "Agendada", running: "A correr", paused: "Pausada", completed: "Concluída",
  pending: "Pendente", awaiting_approval: "Aguarda aprovação", awaiting_connection: "Aguarda ligação do canal",
  sending: "A enviar", sent: "Enviado", failed: "Falhou", skipped: "Ignorado",
};

async function dispatch(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("campaign-dispatch", { body });
  if (error || data?.error) throw new Error(data?.error ?? "Não foi possível processar a campanha");
  return data;
}

export default function Campaigns() {
  const { company } = useCompany();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [audience, setAudience] = useState({ whatsapp: 0, newsletter: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [social, setSocial] = useState({ page_id: "", ig_user_id: "", page_token: "" });

  const load = useCallback(async () => {
    if (!company?.id) return;
    const [c, s, w, n] = await Promise.all([
      supabase.from("campaigns").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("campaign_steps").select("*").eq("company_id", company.id).order("position"),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", company.id).not("phone", "is", null),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("status", "active"),
    ]);
    setCampaigns(c.data ?? []); setSteps(s.data ?? []);
    setAudience({ whatsapp: w.count ?? 0, newsletter: n.count ?? 0 });
  }, [company?.id]);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!company?.id || !name.trim()) return;
    const { data, error } = await supabase.from("campaigns").insert({ company_id: company.id, name: name.trim().slice(0, 120) }).select().single();
    if (error) return toast.error("Não foi possível criar a campanha");
    setName(""); setSelected(data.id); void load();
  }
  async function addStep(campaign: Campaign, channel: string) {
    const position = steps.filter(s => s.campaign_id === campaign.id).length;
    const { error } = await supabase.from("campaign_steps").insert({ company_id: campaign.company_id, campaign_id: campaign.id, channel, position, delay_minutes: position ? 60 : 0 });
    if (error) toast.error("Não foi possível adicionar a etapa"); void load();
  }
  async function updateStep(id: string, patch: Partial<Step>) {
    await supabase.from("campaign_steps").update(patch).eq("id", id); void load();
  }
  async function run(action: string, campaign_id: string, step_id?: string) {
    setBusy(true);
    try { await dispatch({ action, campaign_id, step_id }); toast.success("Campanha atualizada"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); void load(); }
  }
  async function saveSocial() {
    const { data, error } = await supabase.functions.invoke("integration-settings", { body: { action: "save", provider: "social", company_id: company?.id, credentials: social } });
    if (error || data?.error) return toast.error(data?.error ?? "Não foi possível guardar");
    setSocial({ page_id: "", ig_user_id: "", page_token: "" }); toast.success("Ligação guardada de forma segura");
  }

  return (
    <AdminLayout title="Campanhas">
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Contactos WhatsApp</p><p className="text-2xl font-semibold">{audience.whatsapp}</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Subscritores newsletter</p><p className="text-2xl font-semibold">{audience.newsletter}</p></div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Nova campanha</h2>
          <div className="flex gap-2"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Novidades da semana" maxLength={120} /><Button onClick={create}><Plus className="h-4 w-4" />Criar</Button></div>
        </section>

        {campaigns.map(c => {
          const own = steps.filter(s => s.campaign_id === c.id);
          const open = selected === c.id;
          return (
            <section key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <button className="flex w-full items-center justify-between text-left" onClick={() => setSelected(open ? null : c.id)}>
                <span className="font-semibold">{c.name}</span><span className="text-xs rounded bg-muted px-2 py-1">{STATUS[c.status]}</span>
              </button>
              {open && <>
                <label className="flex items-center gap-2 text-sm"><Switch checked={c.auto_products} onCheckedChange={v => supabase.from("campaigns").update({ auto_products: v }).eq("id", c.id).then(load)} />IA escolhe produtos (stock, novidades e vendas)</label>
                <ol className="space-y-3">
                  {own.map((s, i) => (
                    <li key={s.id} className="rounded-md border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{i + 1}. {CHANNELS.find(x => x.id === s.channel)?.label}</span>
                        <span className="text-xs text-muted-foreground">{STATUS[s.status]}{s.status === "pending" && s.due_at ? ` · a partir de ${new Date(s.due_at).toLocaleString("pt-PT")}, entre ${s.start_hour}h e ${s.end_hour}h` : ""}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <label>Atraso (min)<Input type="number" min={0} defaultValue={s.delay_minutes} onBlur={e => updateStep(s.id, { delay_minutes: Math.max(0, Number(e.target.value) || 0) })} /></label>
                        <label>Das (h)<Input type="number" min={0} max={23} defaultValue={s.start_hour} onBlur={e => updateStep(s.id, { start_hour: Number(e.target.value) })} /></label>
                        <label>Até (h)<Input type="number" min={1} max={24} defaultValue={s.end_hour} onBlur={e => updateStep(s.id, { end_hour: Number(e.target.value) })} /></label>
                      </div>
                      <label className="flex items-center gap-2 text-xs"><Switch checked={s.requires_approval} onCheckedChange={v => updateStep(s.id, { requires_approval: v })} />Exigir aprovação antes de enviar</label>
                      {s.content && <div className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">{s.content}
                        <Button size="sm" variant="ghost" className="mt-1" onClick={() => { void navigator.clipboard.writeText(s.content ?? ""); toast.success("Texto copiado"); }}><Copy className="h-3 w-3" />Copiar</Button></div>}
                      {s.result && typeof s.result === "object" && "message" in s.result && <p className="text-xs text-muted-foreground">{String((s.result as { message: unknown }).message)}</p>}
                      <div className="flex gap-2">
                        {s.status === "awaiting_approval" && <Button size="sm" onClick={() => run("approve", c.id, s.id)} disabled={busy}>Aprovar e enviar</Button>}
                        <Button size="sm" variant="ghost" onClick={() => supabase.from("campaign_steps").delete().eq("id", s.id).then(load)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-2">{CHANNELS.map(ch => <Button key={ch.id} size="sm" variant="outline" onClick={() => addStep(c, ch.id)}><Plus className="h-3 w-3" />{ch.label}</Button>)}</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => run("preview", c.id)} disabled={busy}>Pré-visualizar textos</Button>
                  {c.status === "running" ? <Button variant="outline" onClick={() => run("pause", c.id)} disabled={busy}><Pause className="h-4 w-4" />Pausar</Button>
                    : <Button onClick={() => run("launch", c.id)} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Iniciar pipeline</Button>}
                </div>
              </>}
            </section>
          );
        })}

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Ligação Facebook / Instagram</h2>
          <p className="text-sm text-muted-foreground">Guardado cifrado. Sem ligação, as etapas ficam prontas para copiar e publicar manualmente.</p>
          <Input placeholder="ID da Página Facebook" value={social.page_id} onChange={e => setSocial({ ...social, page_id: e.target.value })} />
          <Input placeholder="ID da conta Instagram Business" value={social.ig_user_id} onChange={e => setSocial({ ...social, ig_user_id: e.target.value })} />
          <Input type="password" placeholder="Token de acesso da Página" value={social.page_token} onChange={e => setSocial({ ...social, page_token: e.target.value })} />
          <Button onClick={saveSocial} disabled={!social.page_token}>Guardar ligação</Button>
        </section>
      </div>
    </AdminLayout>
  );
}
