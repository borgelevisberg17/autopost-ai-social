import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: Profile | null;
};

function initials(profile: Profile | null | undefined, userId: string) {
  const value = profile?.full_name || profile?.email;
  if (!value) return userId.slice(0, 2).toUpperCase() || "ID";
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortId(userId: string) {
  return userId.length > 14 ? `${userId.slice(0, 8)}…${userId.slice(-4)}` : userId;
}

export default function Team() {
  const { company } = useCompany();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!company) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setProfileWarning(false);

    const { data, error: membersError } = await supabase
      .from("company_members")
      .select("id,user_id,role,created_at")
      .eq("company_id", company.id)
      .order("created_at");

    if (membersError) {
      setMembers([]);
      setError("Não foi possível carregar a equipa. Verifique a ligação e tente novamente.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rawMembers = (data ?? []) as Member[];
    if (rawMembers.length === 0) {
      setMembers([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Keep the same RLS-safe association used by CompanySettings: fetch visible
    // profiles separately, then map them by user_id without inventing identity data.
    const userIds = rawMembers.map((member) => member.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id,full_name,email,avatar_url")
      .in("user_id", userIds);

    if (profilesError) setProfileWarning(true);

    const profileMap = new Map(
      ((profiles ?? []) as Profile[]).map((profile) => [profile.user_id, profile])
    );

    setMembers(
      rawMembers.map((member) => ({
        ...member,
        profile: profileMap.get(member.user_id) ?? null,
      }))
    );
    setLoading(false);
    setRefreshing(false);
  }, [company]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout title="Equipa">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configurações & Acesso"
          title="Equipa & Funções"
          description="Controlo de utilizadores com permissões de acesso e gestão da loja."
          actions={
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              aria-busy={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {refreshing ? "A atualizar..." : "Atualizar"}
            </button>
          }
        />

        {loading ? (
          <LoadingState label="A carregar equipa..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => load(true)} />
        ) : members.length === 0 ? (
          <EmptyState
            title="Nenhum membro encontrado"
            description="A equipa será configurada quando existirem utilizadores associados à empresa."
          />
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs" aria-label="Membros da equipa">
            {profileWarning && (
              <div className="border-b border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-900">
                Alguns dados de perfil não puderam ser carregados. Os identificadores abaixo utilizam os IDs autorizados.
              </div>
            )}
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_160px] bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:grid border-b border-slate-100">
              <span>Membro</span>
              <span>Nível de Acesso</span>
              <span>Data de Registo</span>
            </div>
            <div className="divide-y divide-slate-100">
              {members.map((member) => {
                const name = member.profile?.full_name || member.profile?.email;
                const hasProfile = Boolean(member.profile);
                const roleLower = member.role.toLowerCase();
                const roleBadge =
                  roleLower === "owner"
                    ? "border-purple-200 bg-purple-50 text-purple-700"
                    : roleLower === "admin"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-700";

                return (
                  <article
                    key={member.id}
                    className="grid gap-3 p-4 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_140px_160px] sm:items-center sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-sans text-xs font-bold text-slate-700">
                          {initials(member.profile, member.user_id)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-bold text-slate-900">
                          {name || shortId(member.user_id)}
                        </p>
                        <p className="truncate text-xs text-slate-400 font-medium" title={member.user_id}>
                          {hasProfile && member.profile?.email ? member.profile.email : "ID: " + shortId(member.user_id)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", roleBadge)}>
                        {member.role}
                      </span>
                      <span className="text-xs text-slate-400 sm:hidden">
                        {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(member.created_at))}
                      </span>
                    </div>
                    <span className="hidden text-xs text-slate-500 sm:block">
                      {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(member.created_at))}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
