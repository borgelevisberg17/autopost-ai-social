import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, ExternalLink, Facebook, Globe2, Instagram, MessageCircle, RefreshCw, Unplug } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Provider = "website" | "instagram" | "facebook" | "whatsapp";
type Connection = { id: string; provider: Provider; account_id: string | null; account_name: string | null; status: string; last_synced_at: string | null };

type ChannelDefinition = { id: Provider; label: string; description: string; capabilities: string[]; icon: typeof Globe2; tone: string; available: boolean };

const CHANNELS: ChannelDefinition[] = [
  { id: "website", label: "Website", description: "A sua loja pública e checkout", capabilities: ["Catálogo", "Checkout", "Pedidos"], icon: Globe2, tone: "bg-[#e9eee9] text-[#2c6457]", available: true },
  { id: "instagram", label: "Instagram", description: "Conteúdo e descoberta de produtos", capabilities: ["Conteúdo", "Publicações", "Catálogo"], icon: Instagram, tone: "bg-[#f5e7e2] text-[#b94e37]", available: false },
  { id: "facebook", label: "Facebook", description: "Alcance e campanhas comerciais", capabilities: ["Conteúdo", "Campanhas", "Catálogo"], icon: Facebook, tone: "bg-[#e8edf2] text-[#385d78]", available: false },
  { id: "whatsapp", label: "WhatsApp", description: "Conversas e pedidos assistidos", capabilities: ["Conversas", "Atendimento", "Pedidos"], icon: MessageCircle, tone: "bg-[#e5efea] text-[#28725d]", available: false },
];

function formatSync(value: string | null) {
  if (!value) return "Ainda não sincronizado";
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Channels() {
  const { company } = useCompany();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const load = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase.from("social_connections").select("id,provider,account_id,account_name,status,last_synced_at").eq("company_id", company.id).order("provider");
    if (error) {
      toast.error("Não foi possível carregar os canais.");
      setConnections([]);
    } else {
      setConnections((data as Connection[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [company]);

  const connectionMap = useMemo(() => new Map(connections.map((connection) => [connection.provider, connection])), [connections]);

  const disconnect = async (connection: Connection) => {
    if (!company) return;
    setDisconnecting(connection.id);
    const { error } = await supabase.from("social_connections").delete().eq("id", connection.id).eq("company_id", company.id);
    setDisconnecting(null);
    if (error) {
      toast.error("Não foi possível desligar o canal.");
      return;
    }
    setConnections((current) => current.filter((item) => item.id !== connection.id));
    toast.success("Canal desligado.");
  };

  return (
    <AdminLayout title="Canais" actions={<button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-semibold text-[#5f625d] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"><RefreshCw className="h-3.5 w-3.5" />Atualizar</button>}>
      <div className="space-y-10">
        <section className="border-b border-[#ded9d0] pb-7"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#2c6457]">Distribuição</p><h2 className="text-3xl font-semibold tracking-[-0.06em] text-[#202522]">Os seus canais, com estado real.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">Veja o que está ligado, quando sincronizou pela última vez e quais integrações ainda aguardam suporte.</p></section>
        {loading ? <div className="grid min-h-[360px] place-items-center border-y border-[#ded9d0]"><div className="flex items-center gap-3 text-sm text-[#747b73]"><RefreshCw className="h-4 w-4 animate-spin" />A carregar canais...</div></div> : <div className="grid gap-4 lg:grid-cols-2">{CHANNELS.map((channel) => { const Icon = channel.icon; const connection = connectionMap.get(channel.id); const connected = Boolean(connection && connection.status === "connected"); return <article key={channel.id} className="border border-[#ded9d0] bg-[#fffdf9] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className={`grid h-11 w-11 place-items-center ${channel.tone}`}><Icon className="h-5 w-5" /></div>{connected ? <span className="inline-flex items-center gap-1.5 border border-[#b8d4c7] bg-[#e9eee9] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#2c6457]"><span className="h-1.5 w-1.5 rounded-full bg-[#2c6457]" />Ligado</span> : <span className="inline-flex items-center gap-1.5 border border-[#ded9d0] bg-[#f1eee7] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#747b73]"><CircleAlert className="h-3 w-3" />Não ligado</span>}</div><div className="mt-8"><h3 className="text-lg font-semibold tracking-[-0.04em] text-[#202522]">{channel.label}</h3><p className="mt-1 text-sm text-[#747b73]">{channel.description}</p><div className="mt-5 flex flex-wrap gap-2">{channel.capabilities.map((capability) => <span key={capability} className="border border-[#ebe7df] bg-[#f6f3ed] px-2 py-1 text-[10px] font-medium text-[#5f625d]">{capability}</span>)}</div></div><div className="mt-6 border-t border-[#ebe7df] pt-4">{connected && connection ? <><div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#747b73]">Conta</span><span className="truncate font-semibold text-[#202522]">{connection.account_name || connection.account_id || "Conta conectada"}</span></div><div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-[#747b73]">Última sincronização</span><span className="text-right font-medium text-[#5f625d]">{formatSync(connection.last_synced_at)}</span></div><button type="button" onClick={() => disconnect(connection)} disabled={disconnecting === connection.id} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#b94e37] transition hover:text-[#202522] disabled:opacity-50"><Unplug className="h-3.5 w-3.5" />{disconnecting === connection.id ? "A desligar..." : "Desligar canal"}</button></> : <div className="flex items-start gap-2.5 text-xs leading-5 text-[#747b73]"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b94e37]" /><span>{channel.available ? "A loja pública está pronta para receber pedidos." : "Esta integração ainda não está disponível neste ambiente. Não simulámos uma ligação OAuth."}</span></div>}</div></article>; })}</div>}
        <aside className="flex items-start gap-3 border border-[#ded9d0] bg-[#f1eee7] p-4 text-sm text-[#5f625d]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6457]" /><p>As ligações devem refletir o estado real do backend. Quando uma integração não existe, a Vendora mostra essa limitação claramente em vez de apresentar uma conta falsa.</p></aside>
      </div>
    </AdminLayout>
  );
}
