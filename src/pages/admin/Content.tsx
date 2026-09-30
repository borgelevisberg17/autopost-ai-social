import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Loader2, RefreshCw } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ContentItem = {
  id: string;
  content_type: string;
  platform: string;
  topic: string | null;
  generated_content: string;
  status: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  publish_attempts: number;
  publish_error: string | null;
  external_post_id: string | null;
  created_at: string;
};

type FilterValue = "all" | string;

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
  pending: "Pendente",
  blocked: "Bloqueado",
};

function date(value: string | null) {
  if (!value) return "Não registado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function statusKey(status: string | null) {
  return status?.trim().toLowerCase() || "__empty__";
}

function statusLabel(status: string | null) {
  const value = status?.trim();
  if (!value) return "Sem estado registado";
  if (value.toLowerCase() === "default") return "Estado predefinido (registado)";
  return STATUS_LABELS[value.toLowerCase()] ?? `Estado não reconhecido · ${value}`;
}

function statusClass(status: string | null) {
  const value = statusKey(status);
  if (value === "published") return "border-[#b8cbbd] bg-[#e9eee9] text-[#2c6457]";
  if (value === "failed") return "border-[#e7c3b8] bg-[#f8e9e4] text-[#9e412c]";
  if (value === "scheduled") return "border-[#d7c9ae] bg-[#f5efe3] text-[#795d31]";
  if (value === "draft") return "border-[#ded9d0] bg-[#f1eee7] text-[#5f625d]";
  return "border-[#ded9d0] bg-[#fffdf9] text-[#747b73]";
}

function platformLabel(platform: string | null) {
  if (!platform?.trim()) return "Canal não registado";
  const known: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    twitter: "X / Twitter",
  };
  return known[platform.toLowerCase()] ?? `Canal não reconhecido · ${platform}`;
}

export default function Content() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [platformFilter, setPlatformFilter] = useState<FilterValue>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("content_history")
      .select(
        "id,content_type,platform,topic,generated_content,status,scheduled_at,published_at,publish_attempts,publish_error,external_post_id,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (queryError) {
      setError("Não foi possível carregar o histórico de conteúdo.");
      setItems([]);
    } else {
      setItems((data as ContentItem[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusOptions = useMemo(
    () => Array.from(new Set(items.map((item) => statusKey(item.status)))),
    [items],
  );
  const platformOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.platform).filter(Boolean))),
    [items],
  );
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (statusFilter === "all" || statusKey(item.status) === statusFilter) &&
          (platformFilter === "all" || item.platform === platformFilter),
      ),
    [items, platformFilter, statusFilter],
  );

  return (
    <AdminLayout title="Conteúdo">
      <div className="space-y-6">
        <section className="pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">
            Automação / Arquivo editorial
          </p>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">
            Conteúdo
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#747b73]">
            Conteúdo registado para esta conta, ordenado pelo momento de criação. Esta leitura usa o histórico real e não cria ações de publicação ou agendamento.
          </p>
        </section>

        <div className="flex flex-col gap-3 border border-[#ded9d0] bg-[#fffdf9] p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#202522]">Fila e histórico</p>
            <p className="mt-1 text-xs text-[#747b73]">Até 100 registos recentes. Os filtros atuam apenas sobre este conjunto carregado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="content-status-filter">Filtrar por estado</label>
            <select id="content-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 min-w-36 border border-[#ded9d0] bg-[#fffdf9] px-2.5 text-xs text-[#5f625d] outline-none focus:border-[#2c6457]">
              <option value="all">Todos os estados</option>
              {statusOptions.map((value) => <option key={value} value={value}>{value === "__empty__" ? "Sem estado registado" : statusLabel(value)}</option>)}
            </select>
            <label className="sr-only" htmlFor="content-platform-filter">Filtrar por canal</label>
            <select id="content-platform-filter" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)} className="h-9 min-w-36 border border-[#ded9d0] bg-[#fffdf9] px-2.5 text-xs text-[#5f625d] outline-none focus:border-[#2c6457]">
              <option value="all">Todos os canais</option>
              {platformOptions.map((value) => <option key={value} value={value}>{platformLabel(value)}</option>)}
            </select>
            <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 border border-[#ded9d0] bg-[#f1eee7] px-3 text-xs font-semibold text-[#5f625d] transition hover:bg-[#e9eee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]" aria-label="Atualizar conteúdo">
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[300px] place-items-center border border-[#ded9d0] bg-[#fffdf9]">
            <div className="flex items-center gap-3 text-sm text-[#747b73]"><Loader2 className="h-4 w-4 animate-spin" />A carregar histórico...</div>
          </div>
        ) : error ? (
          <section className="border border-[#e7c3b8] bg-[#fff8f5] p-6">
            <p className="text-sm font-semibold text-[#9e412c]">Não foi possível mostrar o conteúdo</p>
            <p className="mt-2 text-sm leading-6 text-[#747b73]">{error} Verifique a sessão e tente novamente.</p>
            <button type="button" onClick={() => void load()} className="mt-4 inline-flex h-9 items-center gap-2 bg-[#202522] px-3 text-xs font-semibold text-white hover:bg-[#2c6457]"><RefreshCw className="h-3.5 w-3.5" />Tentar novamente</button>
          </section>
        ) : filteredItems.length === 0 ? (
          <section className="border border-dashed border-[#cfc9bd] bg-[#fffdf9] p-10 text-center">
            <FileText className="mx-auto h-5 w-5 text-[#9aa198]" />
            <p className="mt-4 font-serif text-xl text-[#202522]">Nenhum conteúdo neste recorte</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#747b73]">Não há registos que correspondam aos filtros atuais. A publicação e o agendamento não são feitos por esta página.</p>
          </section>
        ) : (
          <section className="overflow-hidden border border-[#ded9d0] bg-[#fffdf9]">
            {filteredItems.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <article key={item.id} className="border-b border-[#ebe7df] p-4 last:border-0 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#2c6457]">{platformLabel(item.platform)}</span>
                        <span className={cn("border px-2 py-1 text-[10px] font-semibold", statusClass(item.status))}>{statusLabel(item.status)}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#202522]">{item.topic || "Sem tema registado"}</p>
                      <p className="mt-1 text-xs text-[#858c83]">{item.content_type || "Tipo de conteúdo não registado"} · criado em {date(item.created_at)}</p>
                    </div>
                    <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} aria-expanded={expanded} className="inline-flex h-8 shrink-0 items-center gap-2 self-start border border-[#ded9d0] px-2.5 text-xs font-semibold text-[#5f625d] hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f]"><span>{expanded ? "Recolher texto" : "Ver texto"}</span>{expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-[#747b73] sm:grid-cols-3">
                    <p><span className="font-semibold text-[#5f625d]">Agendado:</span> {date(item.scheduled_at)}</p>
                    <p><span className="font-semibold text-[#5f625d]">Publicado:</span> {date(item.published_at)}</p>
                    <p><span className="font-semibold text-[#5f625d]">Tentativas:</span> {item.publish_attempts ?? 0}</p>
                  </div>
                  {item.publish_error && <p className="mt-3 border-l-2 border-[#bd592f] bg-[#fff8f5] px-3 py-2 text-xs leading-5 text-[#9e412c]">Falha registada: {item.publish_error}</p>}
                  {expanded && <div className="mt-4 whitespace-pre-wrap border-l-2 border-[#b8cbbd] bg-[#f5f6f1] px-4 py-3 text-sm leading-6 text-[#3f4840]">{item.generated_content || "Sem texto gerado."}</div>}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
