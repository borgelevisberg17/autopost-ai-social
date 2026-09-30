import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="space-y-8">
        <PageHeader
          eyebrow="Definições / Equipa"
          title="Equipa e funções"
          description="Veja quem tem acesso a esta operação e o papel atribuído a cada pessoa."
          className="[&_h1]:font-serif [&_h1]:font-medium"
          actions={
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading || refreshing}
              aria-busy={refreshing}
              className="inline-flex h-11 items-center gap-2 border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-semibold text-[#5f625d] transition hover:bg-[#f1eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36c3f] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9"
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              {refreshing ? "A atualizar..." : "Atualizar"}
            </button>
          }
        />

        {loading ? (
          <LoadingState label="A carregar equipa" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => load(true)} />
        ) : members.length === 0 ? (
          <EmptyState
            title="Nenhum membro encontrado"
            description="A equipa será criada quando existir uma associação à empresa."
          />
        ) : (
          <section className="border-y border-[#ded9d0]" aria-label="Membros da equipa">
            {profileWarning && (
              <div className="border-b border-[#e3b9ad] bg-[#f5e7e2] px-4 py-3 text-sm leading-5 text-[#7e3929] sm:px-5">
                Alguns dados de perfil não estão disponíveis. A identificação abaixo usa apenas o ID visível, sem inventar nomes ou emails.
              </div>
            )}
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_150px] bg-[#f1eee7] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#747b73] sm:grid">
              <span>Membro</span>
              <span>Função</span>
              <span>Entrada</span>
            </div>
            <div className="space-y-1 py-2">
              {members.map((member) => {
                const name = member.profile?.full_name || member.profile?.email;
                const hasProfile = Boolean(member.profile);
                return (
                  <article
                    key={member.id}
                    className="grid gap-3 px-4 py-4 transition hover:bg-[#f1eee7]/70 sm:grid-cols-[minmax(0,1fr)_120px_150px] sm:items-center sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-[7px] object-cover"
                        />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#e9eee9] font-mono text-xs font-semibold text-[#2c6457]">
                          {initials(member.profile, member.user_id)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#202522]">
                          {name || shortId(member.user_id)}
                        </p>
                        <p className="truncate text-xs text-[#747b73]" title={member.user_id}>
                          {hasProfile && member.profile?.email ? member.profile.email : "ID de utilizador · " + shortId(member.user_id)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5f625d]">
                        {member.role}
                      </span>
                      <span className="text-xs text-[#747b73] sm:hidden">
                        {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(member.created_at))}
                      </span>
                    </div>
                    <span className="hidden text-xs text-[#747b73] sm:block">
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
