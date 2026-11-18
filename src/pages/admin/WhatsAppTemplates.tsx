import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Plus, RefreshCw, Trash2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Template = { id: string; name: string; status: string; category: string; language: string; components?: { type: string; text?: string }[] };
type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";

export default function WhatsAppTemplates() {
  const { company } = useCompany();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("confirmacao_pedido");
  const [language, setLanguage] = useState("pt_PT");
  const [category, setCategory] = useState<Category>("UTILITY");
  const [body, setBody] = useState("Olá {{1}}! O teu pedido {{2}} foi recebido com sucesso. Obrigado por comprares connosco!");

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-templates", { body: { ...payload, company_id: company?.id } });
    if (error) {
      const context = (error as { context?: Response }).context;
      const details = context ? await context.json().catch(() => null) : null;
      throw new Error(details?.error ?? "Não foi possível comunicar com a Meta");
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }, [company?.id]);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const result = await invoke({ action: "list" });
      setTemplates((result.data ?? []) as Template[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar modelos");
    } finally { setLoading(false); }
  }, [company?.id, invoke]);

  useEffect(() => { void load(); }, [load]);

  async function createTemplate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await invoke({ action: "create", name: name.trim().toLowerCase(), language, category, body, allow_category_change: true });
      toast.success(`Modelo submetido à Meta. Estado inicial: ${result.status ?? "PENDING"}`);
      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o modelo");
    } finally { setSaving(false); }
  }

  async function deleteTemplate(templateName: string) {
    if (!window.confirm(`Remover o modelo "${templateName}" desta conta WhatsApp?`)) return;
    try {
      await invoke({ action: "delete", name: templateName });
      toast.success("Pedido de remoção concluído");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o modelo");
    }
  }

  const statusLabel = (status: string) => ({ APPROVED: "Aprovado", PENDING: "Pendente", REJECTED: "Rejeitado", PAUSED: "Em pausa", DISABLED: "Desativado" }[status] ?? status);

  return <AdminLayout title="Modelos WhatsApp" actions={<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>}>
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold tracking-tight">Modelos de mensagens</h1><p className="mt-1 text-sm text-muted-foreground">Cria e acompanha modelos diretamente na WhatsApp Business Account desta loja.</p></div>
        <Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" />Novo modelo</Button>
      </div>

      {showForm && <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5" />Novo modelo WhatsApp</CardTitle></CardHeader><CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createTemplate}>
          <div className="space-y-2"><Label htmlFor="template-name">Nome técnico</Label><Input id="template-name" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} pattern="[a-z0-9_]+" maxLength={512} required /><p className="text-xs text-muted-foreground">Use letras minúsculas, números e underscore.</p></div>
          <div className="space-y-2"><Label>Idioma</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pt_PT">Português (Portugal)</SelectItem><SelectItem value="pt_BR">Português (Brasil)</SelectItem><SelectItem value="en_US">English (US)</SelectItem><SelectItem value="es_ES">Español</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={v => setCategory(v as Category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UTILITY">Utility · Transacional</SelectItem><SelectItem value="MARKETING">Marketing · Promoções</SelectItem><SelectItem value="AUTHENTICATION">Authentication · Códigos</SelectItem></SelectContent></Select></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="template-body">Corpo da mensagem</Label><Textarea id="template-body" value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={1024} required /><p className="text-xs text-muted-foreground">Variáveis posicionais: {"{{1}}"}, {"{{2}}"}, etc. A Meta pode exigir exemplos para modelos com variáveis.</p></div>
          <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="submit" disabled={saving || !body.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Submeter à Meta</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
        </form>
      </CardContent></Card>}

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Modelos da conta</CardTitle></CardHeader><CardContent>
        {loading ? <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />A consultar a Meta…</div>
          : templates.length === 0 ? <div className="py-12 text-center"><FileText className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">Nenhum modelo encontrado</p><p className="mt-1 text-sm text-muted-foreground">Cria o primeiro modelo para esta loja.</p></div>
          : <div className="divide-y">{templates.map(template => <div key={template.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start"><div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{template.name}</span><Badge variant={template.status === "APPROVED" ? "default" : template.status === "REJECTED" ? "destructive" : "secondary"}>{statusLabel(template.status)}</Badge><Badge variant="outline">{template.category}</Badge></div><p className="text-xs text-muted-foreground">{template.language} · ID: {template.id}</p><p className="max-w-3xl whitespace-pre-wrap text-sm">{template.components?.find(c => c.type === "BODY")?.text ?? "Sem pré-visualização"}</p></div><Button variant="ghost" size="icon" aria-label={`Remover ${template.name}`} onClick={() => void deleteTemplate(template.name)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
      </CardContent></Card>
      <p className="text-xs text-muted-foreground">Os modelos são consultados diretamente na Meta. A criação submete o conteúdo à análise da Meta; a Vendora não aprova modelos. Para enviar mensagens fora da janela de atendimento de 24 horas, utiliza apenas modelos com estado APPROVED.</p>
    </div>
  </AdminLayout>;
}
