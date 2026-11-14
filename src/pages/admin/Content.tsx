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
  if (value === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "failed" || value === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "scheduled") return "border-amber-200 bg-amber-50 text-amber-800";
  if (value === "draft") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function platformLabel(platform: string | null) {
  if (!platform?.trim()) return "Canal geral";
  const known: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    twitter: "X / Twitter",
  };
  return known[platform.toLowerCase()] ?? `Canal · ${platform}`;
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
        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              MARKETING & PUBLICAÇÕES
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Arquivo de Conteúdo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Histórico de textos, posts sociais e conteúdos gerados pelos agentes da loja.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {filteredItems.length} publicações filtradas
          </span>
        </section>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Filtros de Publicação</p>
            <p className="mt-0.5 text-xs text-slate-400">Filtre por canal ou estado de publicação.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="all">Todos os estados</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value === "__empty__" ? "Sem estado" : statusLabel(value)}
                </option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="all">Todos os canais</option>
              {platformOptions.map((value) => (
                <option key={value} value={value}>
                  {platformLabel(value)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              A carregar histórico...
            </div>
          </div>
        ) : error ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-center">
            <p className="text-sm font-bold text-rose-800">Não foi possível carregar o conteúdo</p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </section>
        ) : filteredItems.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-sans text-base font-bold text-slate-900">Nenhum conteúdo encontrado</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Quando os agentes de marketing gerarem legendas ou publicações, o histórico aparecerá aqui.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <article key={item.id} className="p-4 sm:p-5 transition hover:bg-slate-50/60">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {platformLabel(item.platform)}
                        </span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusClass(item.status))}>
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      <p className="mt-2 font-sans text-sm font-bold text-slate-900">
                        {item.topic || "Post Promocional"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.content_type || "Geral"} · criado a {date(item.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-expanded={expanded}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                    >
                      <span>{expanded ? "Recolher texto" : "Ver texto completo"}</span>
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-3">
                    <p className="text-slate-600"><span className="font-semibold text-slate-900">Agendado:</span> {date(item.scheduled_at)}</p>
                    <p className="text-slate-600"><span className="font-semibold text-slate-900">Publicado:</span> {date(item.published_at)}</p>
                    <p className="text-slate-600"><span className="font-semibold text-slate-900">Tentativas:</span> {item.publish_attempts ?? 0}</p>
                  </div>
                  {item.publish_error && (
                    <p className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
                      <strong>Falha:</strong> {item.publish_error}
                    </p>
                  )}
                  {expanded && (
                    <div className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-800">
                      {item.generated_content || "Sem texto gerado."}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
