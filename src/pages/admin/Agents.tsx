import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Copy, Loader2, ShieldCheck, Megaphone } from "lucide-react";
import { toast } from "sonner";

type Action = { id: string; agent: string; action: string; platform: string | null; content: string | null; status: string; reason: string | null; created_at: string; product_id: string | null };
const PLATFORMS = [{ id: "instagram", label: "Instagram" }, { id: "facebook", label: "Facebook" }, { id: "whatsapp", label: "WhatsApp" }];
const STATUS_STYLE: Record<string, string> = { DRAFT: "bg-primary/15 text-primary", BLOCKED: "bg-accent/15 text-accent", FAILED: "bg-destructive/15 text-destructive", PUBLISHED: "bg-secondary" };
const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", BLOCKED: "Bloqueado", FAILED: "Falhou", PUBLISHED: "Publicado" };

export default function Agents() {
  const { company } = useCompany();
  const [products, setProducts] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [productId, setProductId] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook", "whatsapp"]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<Action[]>([]);

  const loadLog = async () => {
    if (!company) return;
    const { data } = await supabase.from("agent_actions").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(100);
    setLog((data as Action[]) ?? []);
  };
  useEffect(() => {
    if (!company) return;
    supabase.from("products").select("id,name,stock").eq("company_id", company.id).order("name").then(({ data }) => setProducts(data ?? []));
    loadLog();
  }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? "—";

  const run = async () => {
    if (!productId) return toast.error("Escolha um produto");
    if (platforms.length === 0) return toast.error("Escolha pelo menos uma rede");
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("marketing-agent", { body: { product_id: productId, platforms } });
    setRunning(false);
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      toast.error(details?.error ?? "O agente falhou");
    } else if (data?.blocked) toast.warning(`Bloqueado pelas regras: ${data.reasons.join(", ")}`);
    else toast.success("Publicações criadas");
    loadLog();
  };

  return (
    <AdminLayout title="Agentes">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center"><Megaphone className="w-5 h-5 text-primary-foreground" /></div>
            <div><h2 className="font-display font-semibold">Agente de marketing</h2><p className="text-xs text-muted-foreground">Cria um texto diferente para cada rede, só com dados reais do produto.</p></div></div>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Escolha um produto…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
          </select>
          <div className="flex flex-wrap gap-4">
            {PLATFORMS.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={platforms.includes(p.id)} onCheckedChange={(v) => setPlatforms(v ? [...platforms, p.id] : platforms.filter((x) => x !== p.id))} />{p.label}
              </label>
            ))}
          </div>
          <Button onClick={run} disabled={running}>{running ? <><Loader2 className="w-4 h-4 animate-spin" />A gerar…</> : <><Bot className="w-4 h-4" />Gerar publicações</>}</Button>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display font-semibold flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-primary" />Regras antes de criar</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>O produto existe e está ativo</li><li>Stock maior que zero</li><li>Preço válido</li><li>Promoção menor que o preço</li><li>Só usa dados do sistema</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">Publicação direta nas redes da Meta chega numa próxima fase; por agora os textos ficam como rascunhos para copiar.</p>
        </div>
      </div>

      <h2 className="font-display font-semibold mb-3">Registo de ações da IA</h2>
      {log.length === 0 ? <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">Nenhuma ação ainda.</div> : (
        <div className="space-y-3">
          {log.map((a) => (
            <div key={a.id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-PT")}</span>
                <span className="font-mono">{a.agent}/{a.action}</span>
                <span className="capitalize">{a.platform}</span>
                <span className="text-muted-foreground">· {productName(a.product_id)}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 ${STATUS_STYLE[a.status] ?? "bg-secondary"}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
              </div>
              {a.content && <p className="text-sm whitespace-pre-wrap">{a.content}</p>}
              {a.reason && <p className="text-sm text-muted-foreground">Motivo: {a.reason}</p>}
              {a.content && <Button size="sm" variant="ghost" className="mt-2" onClick={() => { navigator.clipboard.writeText(a.content!); toast.success("Copiado"); }}><Copy className="w-3 h-3" />Copiar</Button>}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
