import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FileText, Image as ImageIcon, Loader2, MessageSquare, Pencil, Plus, RefreshCw, Send, Trash2, Upload, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

type Component = { type: string; format?: string; text?: string; example?: any; buttons?: { type: string; text: string; url?: string; phone_number?: string }[] };
type Template = { id: string; name: string; status: string; category: string; language: string; components?: Component[]; quality_score?: { score?: string } };
type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";
type Screen = "list" | "detail" | "editor";

const statusText: Record<string, string> = { APPROVED: "Aprovado", PENDING: "Em análise", REJECTED: "Rejeitado", PAUSED: "Em pausa", DISABLED: "Desativado", IN_APPEAL: "Em recurso" };
const statusVariant = (status: string) => status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "secondary";
const mediaAccept: Record<string, string> = { IMAGE: "image/jpeg,image/png", VIDEO: "video/mp4", DOCUMENT: "application/pdf" };

function MessagePreview({ components = [], name, mediaPreviewUrl, mediaName, variableExamples = "" }: { components?: Component[]; name?: string; mediaPreviewUrl?: string; mediaName?: string; variableExamples?: string }) {
  const header = components.find(c => c.type === "HEADER");
  const body = components.find(c => c.type === "BODY");
  const footer = components.find(c => c.type === "FOOTER");
  const buttons = components.find(c => c.type === "BUTTONS")?.buttons ?? [];
  const examples = variableExamples.split("|").map(value => value.trim());
  const previewBody = (body?.text || "O texto da tua mensagem aparecerá aqui.").replace(/\{\{(\d+)\}\}/g, (match, index) => examples[Number(index) - 1] || `{{${index}}}`);
  return <div className="mx-auto w-full max-w-[310px] rounded-[28px] border-[7px] border-slate-800 bg-[#efeae2] p-2 shadow-xl">
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#075e54] px-3 py-3 text-white"><div className="grid h-8 w-8 place-items-center rounded-full bg-white/20"><MessageSquare className="h-4 w-4" /></div><div><p className="text-xs font-semibold">WhatsApp Business</p><p className="text-[10px] opacity-75">pré-visualização</p></div></div>
    <div className="min-h-[250px] rounded-xl bg-[#efeae2] p-2">
      <div className="ml-auto max-w-[95%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-3 text-[13px] text-slate-800 shadow-sm">
        {header && <div className="mb-2 overflow-hidden rounded-lg bg-slate-200">
          {header.format === "TEXT" ? <p className="font-bold">{header.text || "Cabeçalho"}</p> : mediaPreviewUrl && header.format === "IMAGE" ? <img src={mediaPreviewUrl} alt="Pré-visualização do cabeçalho" className="max-h-44 w-full object-cover" /> : mediaPreviewUrl && header.format === "VIDEO" ? <video src={mediaPreviewUrl} controls className="max-h-44 w-full bg-black object-contain" /> : header.format === "DOCUMENT" && mediaName ? <div className="flex items-center gap-3 bg-white p-3"><div className="grid h-10 w-10 place-items-center rounded bg-red-50 text-red-600"><FileText className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{mediaName}</p><p className="text-[10px] text-slate-500">Documento PDF</p></div></div> : <div className="grid h-28 place-items-center gap-1 text-slate-500"><ImageIcon className="h-8 w-8" /><span className="text-[10px]">{header.format === "VIDEO" ? "Pré-visualização de vídeo" : header.format === "DOCUMENT" ? "Documento PDF" : "Imagem do cabeçalho"}</span><span className="text-[9px]">Carrega um ficheiro para visualizar</span></div>}
        </div>}
        <p className="whitespace-pre-wrap">{previewBody}</p>
        {footer?.text && <p className="mt-2 text-[10px] text-slate-500">{footer.text}</p>}
        <p className="mt-1 text-right text-[9px] text-slate-400">Agora ✓✓</p>
      </div>
      {buttons.map((button, i) => <div key={i} className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-center text-xs font-medium text-[#087e70] shadow-sm">{button.type === "URL" ? <><span>↗</span><span>{button.text || "Abrir website"}</span></> : button.type === "PHONE_NUMBER" ? <><span>☎</span><span>{button.text || "Ligar"}</span></> : <><span>↩</span><span>{button.text || "Resposta rápida"}</span></>}</div>)}
    </div>
    <p className="truncate px-2 pb-1 text-center text-[9px] text-slate-400">{name || "Nome do modelo"} · exemplo visual</p>
  </div>;
}

export default function WhatsAppTemplates() {
  const { company } = useCompany();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaName, setMediaName] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  useEffect(() => () => { if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl); }, [mediaPreviewUrl]);
  const [screen, setScreen] = useState<Screen>("list");
  const [selected, setSelected] = useState<Template | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [name, setName] = useState("confirmacao_pedido");
  const [language, setLanguage] = useState("pt_PT");
  const [category, setCategory] = useState<Category>("UTILITY");
  const [headerType, setHeaderType] = useState("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerHandle, setHeaderHandle] = useState("");
  const [body, setBody] = useState("Olá {{1}}! O teu pedido {{2}} foi recebido com sucesso. Obrigado por comprares connosco!");
  const [bodyExamples, setBodyExamples] = useState("Ana | PED-0001");
  const [footer, setFooter] = useState("");
  const [buttonType, setButtonType] = useState("NONE");
  const [buttonText, setButtonText] = useState("Acompanhar pedido");
  const [buttonUrl, setButtonUrl] = useState("https://");
  const [buttonPhone, setButtonPhone] = useState("");

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

  const uploadMedia = async (file?: File) => {
    if (!file || !company?.id) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("company_id", company.id);
      form.append("file", file);
      const { data, error } = await supabase.functions.invoke("whatsapp-template-media-upload", { body: form });
      if (error) {
        const context = (error as { context?: Response }).context;
        const details = context ? await context.json().catch(() => null) : null;
        throw new Error(details?.error ?? "Não foi possível carregar o ficheiro");
      }
      if (!data?.header_handle) throw new Error(data?.error ?? "A Meta não devolveu o identificador do ficheiro");
      setHeaderHandle(data.header_handle);
      setMediaName(file.name);
      setMediaPreviewUrl(URL.createObjectURL(file));
      toast.success("Ficheiro carregado para a Meta");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no upload"); }
    finally { setUploading(false); }
  };

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try { const result = await invoke({ action: "list" }); setTemplates((result.data ?? []) as Template[]); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar modelos"); }
    finally { setLoading(false); }
  }, [company?.id, invoke]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => templates.filter(t => (filterStatus === "all" || t.status === filterStatus) && (t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))), [templates, filterStatus, search]);
  const counts = useMemo(() => ({ all: templates.length, approved: templates.filter(t => t.status === "APPROVED").length, pending: templates.filter(t => t.status === "PENDING").length, rejected: templates.filter(t => t.status === "REJECTED").length }), [templates]);

  function openCreate() {
    setSelected(null); setName("novo_modelo"); setLanguage("pt_PT"); setCategory("UTILITY"); setHeaderType("NONE"); setHeaderText(""); setHeaderHandle(""); setMediaName(""); setMediaPreviewUrl(""); setBody("Olá {{1}}! Temos uma atualização sobre o teu pedido {{2}}."); setBodyExamples("Ana | PED-0001"); setFooter(""); setButtonType("NONE"); setScreen("editor");
  }
  function openDetail(template: Template) { setSelected(template); setScreen("detail"); }
  function startEdit(template: Template) {
    setSelected(template);
    const components = template.components ?? [];
    const h = components.find(c => c.type === "HEADER");
    setName(`${template.name}_v2`); setLanguage(template.language); setCategory(template.category as Category);
    setHeaderType(h?.format ?? "NONE"); setHeaderText(h?.text ?? ""); setHeaderHandle(h?.example?.header_handle?.[0] ?? ""); setMediaName(""); setMediaPreviewUrl("");
    setBody(components.find(c => c.type === "BODY")?.text ?? "");
    setBodyExamples(""); setFooter(components.find(c => c.type === "FOOTER")?.text ?? "");
    const buttons = components.find(c => c.type === "BUTTONS")?.buttons ?? [];
    const first = buttons[0]; setButtonType(first?.type ?? "NONE"); setButtonText(first?.text ?? ""); setButtonUrl(first?.url ?? "https://"); setButtonPhone(first?.phone_number ?? "");
    setScreen("editor");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const components: Component[] = [];
      if (headerType !== "NONE") {
        if (headerType === "TEXT") components.push({ type: "HEADER", format: "TEXT", text: headerText });
        else components.push({ type: "HEADER", format: headerType, example: { header_handle: [headerHandle.trim()] } });
      }
      const variables = [...body.matchAll(/\{\{(\d+)\}\}/g)].map(m => Number(m[1]));
      const examples = bodyExamples.split("|").map(v => v.trim()).filter(Boolean);
      const bodyComponent: Component = { type: "BODY", text: body };
      if (variables.length) bodyComponent.example = { body_text: [examples] };
      components.push(bodyComponent);
      if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });
      if (buttonType !== "NONE") {
        const button = buttonType === "URL" ? { type: "URL", text: buttonText, url: buttonUrl } : buttonType === "PHONE_NUMBER" ? { type: "PHONE_NUMBER", text: buttonText, phone_number: buttonPhone } : { type: "QUICK_REPLY", text: buttonText };
        components.push({ type: "BUTTONS", buttons: [button] });
      }
      await invoke({ action: "create", name: name.trim().toLowerCase(), language, category, components, allow_category_change: true });
      toast.success("Modelo submetido à análise da Meta"); await load(); setScreen("list");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível submeter o modelo"); }
    finally { setSaving(false); }
  }
  async function remove(template: Template) {
    if (!window.confirm(`Eliminar o modelo "${template.name}" desta conta WhatsApp?`)) return;
    try { await invoke({ action: "delete", name: template.name }); toast.success("Pedido de eliminação enviado"); setScreen("list"); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível eliminar"); }
  }

  const editorComponents: Component[] = [
    ...(headerType === "NONE" ? [] : [{ type: "HEADER", format: headerType, text: headerType === "TEXT" ? headerText : undefined }]),
    { type: "BODY", text: body }, ...(footer ? [{ type: "FOOTER", text: footer }] : []),
    ...(buttonType === "NONE" ? [] : [{ type: "BUTTONS", buttons: [{ type: buttonType, text: buttonText, ...(buttonType === "URL" ? { url: buttonUrl } : {}), ...(buttonType === "PHONE_NUMBER" ? { phone_number: buttonPhone } : {}) }] }]),
  ];

  return <AdminLayout title="Modelos WhatsApp" actions={<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>}>
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      {screen !== "list" && <Button variant="ghost" className="-ml-3" onClick={() => setScreen(screen === "editor" && selected ? "detail" : "list")}><ArrowLeft className="mr-2 h-4 w-4" />{screen === "editor" && selected ? "Voltar aos detalhes" : "Voltar aos modelos"}</Button>}

      {screen === "list" && <>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-700">WhatsApp Business Platform</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Modelos de mensagem</h1><p className="mt-1 text-sm text-muted-foreground">Cria, organiza e acompanha os modelos utilizados nas conversas da tua loja.</p></div><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Criar modelo</Button></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:"Total de modelos",value:counts.all},{label:"Aprovados",value:counts.approved},{label:"Em análise",value:counts.pending},{label:"Rejeitados",value:counts.rejected}].map(item => <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{item.value}</p></CardContent></Card>)}</div>
        <Card><CardContent className="p-4"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Pesquisar modelos..." value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Todos os estados" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os estados</SelectItem><SelectItem value="APPROVED">Aprovados</SelectItem><SelectItem value="PENDING">Em análise</SelectItem><SelectItem value="REJECTED">Rejeitados</SelectItem><SelectItem value="PAUSED">Em pausa</SelectItem></SelectContent></Select></div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardTitle>Os teus modelos</CardTitle><p className="mt-1 text-xs text-muted-foreground">{filtered.length} modelo(s) encontrados</p></div><Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Sincronizar</Button></CardHeader><CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center py-16 text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />A sincronizar com a Meta...</div> : templates.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText className="h-7 w-7" /></div><h3 className="mt-4 font-semibold">Ainda não tens modelos</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Cria o primeiro modelo para iniciar conversas ou enviar atualizações através do WhatsApp.</p><Button className="mt-5" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Criar primeiro modelo</Button></div> : filtered.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">Nenhum modelo corresponde à pesquisa.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>{["Nome do modelo","Categoria","Idioma","Estado","Qualidade","Atualizado",""].map((h,i)=><th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y">{filtered.map(t=><tr key={t.id} onClick={()=>openDetail(t)} className="cursor-pointer transition-colors hover:bg-muted/40"><td className="px-4 py-4"><p className="font-semibold">{t.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">ID: {t.id}</p></td><td className="px-4 py-4"><Badge variant="outline">{t.category}</Badge></td><td className="px-4 py-4">{t.language}</td><td className="px-4 py-4"><Badge variant={statusVariant(t.status)}>{statusText[t.status] ?? t.status}</Badge></td><td className="px-4 py-4 text-muted-foreground">{t.quality_score?.score ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">—</td><td className="px-4 py-4 text-right"><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></td></tr>)}</tbody></table></div>}
        </CardContent></Card>
        <p className="text-xs text-muted-foreground">Os estados e a qualidade são fornecidos pela Meta. A aprovação dos modelos é feita exclusivamente pela Meta.</p>
      </>}

      {screen === "detail" && selected && <><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes do modelo</p><h1 className="mt-1 break-all text-2xl font-bold">{selected.name}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant={statusVariant(selected.status)}>{statusText[selected.status] ?? selected.status}</Badge><Badge variant="outline">{selected.category}</Badge><span className="text-xs text-muted-foreground">{selected.language}</span></div><p className="mt-2 text-xs text-muted-foreground">Identificação: {selected.id}</p></div><div className="flex gap-2"><Button variant="outline" onClick={()=>void remove(selected)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button><Button onClick={()=>startEdit(selected)}><Pencil className="mr-2 h-4 w-4" />Usar como base</Button></div></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-4"><Card><CardHeader><CardTitle>Informações do modelo</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Categoria</p><p className="mt-1 font-medium">{selected.category}</p></div><div><p className="text-xs text-muted-foreground">Idioma</p><p className="mt-1 font-medium">{selected.language}</p></div><div><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 font-medium">{statusText[selected.status] ?? selected.status}</p></div><div><p className="text-xs text-muted-foreground">Qualidade</p><p className="mt-1 font-medium">{selected.quality_score?.score ?? "Ainda sem dados"}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Componentes da mensagem</CardTitle></CardHeader><CardContent className="space-y-4">{(selected.components ?? []).map((c,i)=><div key={i}><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.type}{c.format ? " · "+c.format : ""}</p></div><p className="whitespace-pre-wrap text-sm">{c.text ?? (c.buttons ? c.buttons.map(b=>b.text).join(" · ") : "Conteúdo multimédia")}</p>{i < (selected.components?.length ?? 0)-1 && <Separator className="mt-4" />}</div>)}</CardContent></Card></div><Card><CardHeader><CardTitle>Pré-visualização</CardTitle></CardHeader><CardContent><MessagePreview components={selected.components} name={selected.name} /></CardContent></Card></div>
      </>}

      {screen === "editor" && <><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Editor de modelos</p><h1 className="mt-1 text-2xl font-bold">{selected ? "Criar nova versão" : "Criar modelo"}</h1><p className="mt-1 text-sm text-muted-foreground">Configura cada componente e acompanha a pré-visualização antes de submeter à Meta.</p></div><form onSubmit={submit}><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5">
          <Card><CardHeader><CardTitle>1. Identificação</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nome técnico</Label><Input value={name} onChange={e=>setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"_"))} pattern="[a-z0-9_]+" maxLength={512} required /><p className="text-xs text-muted-foreground">Minúsculas, números e underscore.</p></div><div className="space-y-2"><Label>Idioma</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pt_PT">Português (Portugal)</SelectItem><SelectItem value="pt_BR">Português (Brasil)</SelectItem><SelectItem value="en_US">English (US)</SelectItem><SelectItem value="es_ES">Español</SelectItem></SelectContent></Select></div><div className="space-y-2 sm:col-span-2"><Label>Categoria</Label><Select value={category} onValueChange={v=>setCategory(v as Category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UTILITY">Utility · Transacional</SelectItem><SelectItem value="MARKETING">Marketing · Promoções</SelectItem><SelectItem value="AUTHENTICATION">Authentication · Códigos</SelectItem></SelectContent></Select></div></CardContent></Card>
          <Card><CardHeader><CardTitle>2. Cabeçalho (opcional)</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Tipo de cabeçalho</Label><Select value={headerType} onValueChange={v=>{setHeaderType(v);setHeaderHandle("");setMediaName("");setMediaPreviewUrl("");}}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sem cabeçalho</SelectItem><SelectItem value="TEXT">Texto</SelectItem><SelectItem value="IMAGE">Imagem</SelectItem><SelectItem value="VIDEO">Vídeo</SelectItem><SelectItem value="DOCUMENT">Documento</SelectItem></SelectContent></Select></div>{headerType==="TEXT" && <div className="space-y-2"><Label>Texto do cabeçalho</Label><Input value={headerText} onChange={e=>setHeaderText(e.target.value)} maxLength={60} placeholder="Ex.: Atualização do pedido" /></div>}{["IMAGE","VIDEO","DOCUMENT"].includes(headerType) && <div className="space-y-3 rounded-lg border border-dashed p-4"><div className="flex items-center gap-2"><Upload className="h-4 w-4 text-muted-foreground" /><Label>Ficheiro de exemplo</Label></div><Input type="file" accept={mediaAccept[headerType]} disabled={uploading} onChange={e=>{void uploadMedia(e.target.files?.[0]);e.currentTarget.value="";}} />{uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />A carregar ficheiro para a Meta...</div>}{headerHandle && <div className="flex items-center justify-between gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><div className="min-w-0"><p className="font-medium">Ficheiro carregado</p><p className="truncate text-xs">{mediaName || "Media handle existente"}</p></div><Button type="button" variant="ghost" size="icon" onClick={()=>{setHeaderHandle("");setMediaName("");setMediaPreviewUrl("");}} aria-label="Remover ficheiro"><X className="h-4 w-4" /></Button></div>}<p className="text-xs text-muted-foreground">JPG/PNG até 5 MB, MP4 até 16 MB e PDF até 100 MB. O ficheiro é enviado diretamente para a Meta; a Vendora guarda apenas o identificador.</p></div>}</CardContent></Card>
          <Card><CardHeader><CardTitle>3. Corpo da mensagem</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} maxLength={1024} required /><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Variáveis posicionais: {"{{1}}"}, {"{{2}}"}…</span><span>{body.length}/1024</span></div>{/\{\{\d+\}\}/.test(body) && <div className="space-y-2"><Label>Exemplos das variáveis (separados por |)</Label><Input value={bodyExamples} onChange={e=>setBodyExamples(e.target.value)} placeholder="Ana | PED-0001" /><p className="text-xs text-muted-foreground">Um exemplo para cada variável, pela ordem em que aparecem.</p></div>}</CardContent></Card>
          <Card><CardHeader><CardTitle>4. Rodapé (opcional)</CardTitle></CardHeader><CardContent><Input value={footer} onChange={e=>setFooter(e.target.value)} maxLength={60} placeholder="Ex.: Vendora · Estamos aqui para ajudar" /></CardContent></Card>
          <Card><CardHeader><CardTitle>5. Botão (opcional)</CardTitle></CardHeader><CardContent className="space-y-4"><Select value={buttonType} onValueChange={setButtonType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sem botão</SelectItem><SelectItem value="QUICK_REPLY">Resposta rápida</SelectItem><SelectItem value="URL">Abrir website (URL)</SelectItem><SelectItem value="PHONE_NUMBER">Ligar (telefone)</SelectItem></SelectContent></Select>{buttonType!=="NONE" && <><div className="space-y-2"><Label>Texto do botão</Label><Input value={buttonText} onChange={e=>setButtonText(e.target.value)} maxLength={25} required /></div>{buttonType==="URL" && <div className="space-y-2"><Label>URL de destino</Label><Input type="url" value={buttonUrl} onChange={e=>setButtonUrl(e.target.value)} placeholder="https://..." required /></div>}{buttonType==="PHONE_NUMBER" && <div className="space-y-2"><Label>Número internacional</Label><Input value={buttonPhone} onChange={e=>setButtonPhone(e.target.value)} placeholder="+244..." required /></div>}</>}</CardContent></Card>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || uploading || !body.trim() || (["IMAGE","VIDEO","DOCUMENT"].includes(headerType) && !headerHandle)}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Submeter à Meta</Button><Button type="button" variant="outline" onClick={()=>setScreen(selected?"detail":"list")}>Cancelar</Button></div>
        </div><div className="space-y-4 xl:sticky xl:top-20"><Card><CardHeader><CardTitle>Pré-visualização em tempo real</CardTitle><p className="text-xs text-muted-foreground">Representação aproximada da mensagem no WhatsApp.</p></CardHeader><CardContent><MessagePreview components={editorComponents} name={name} mediaPreviewUrl={mediaPreviewUrl} mediaName={mediaName} variableExamples={bodyExamples} /></CardContent></Card><div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground"><p className="font-semibold text-foreground">Antes de submeter</p><ul className="mt-2 list-disc space-y-1 pl-4"><li>A Meta analisa todos os modelos.</li><li>O cabeçalho multimédia requer um media handle válido.</li><li>Botões e variáveis têm limites e regras próprias.</li><li>Editar um modelo existente pode exigir uma nova submissão; esta ação cria um novo modelo.</li></ul></div></div></div></form></>}
    </div>
  </AdminLayout>;
}
