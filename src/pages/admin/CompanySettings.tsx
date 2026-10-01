import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  Facebook,
  Globe2,
  Instagram,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES } from "@/lib/format";
import { toast } from "sonner";

type Section =
  | "company"
  | "branding"
  | "business"
  | "commerce"
  | "orders"
  | "notifications"
  | "team"
  | "channels"
  | "ai"
  | "automations"
  | "integrations"
  | "api"
  | "security"
  | "audit";

type BusinessSettings = {
  id: string;
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  brand_voice: string | null;
  default_tone: string | null;
  target_audience: string | null;
  auto_hashtags: boolean | null;
  auto_publish: boolean;
  default_platform: string | null;
  include_cta: boolean | null;
  include_emojis: boolean | null;
  facebook_connected: boolean | null;
  facebook_url: string | null;
  instagram_connected: boolean | null;
  instagram_handle: string | null;
  linkedin_connected: boolean | null;
  linkedin_url: string | null;
  tiktok_connected: boolean | null;
  tiktok_url?: string | null;
  twitter_handle: string | null;
  follower_count: number | null;
};

type Member = {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "admin" | "staff";
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type AuditLog = {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  changes: Record<string, unknown>;
  created_at: string;
};

const NAVIGATION: Array<{
  group: string;
  items: Array<{
    id: Section;
    label: string;
    description: string;
    icon: typeof Building2;
    available: boolean;
  }>;
}> = [
  {
    group: "GERAL",
    items: [
      {
        id: "company",
        label: "Empresa",
        description: "Identidade e contactos",
        icon: Building2,
        available: true,
      },
      {
        id: "branding",
        label: "Branding",
        description: "Identidade visual",
        icon: Palette,
        available: true,
      },
      {
        id: "business",
        label: "Negócio",
        description: "Perfil usado pelos agentes",
        icon: Store,
        available: true,
      },
      {
        id: "commerce",
        label: "Comércio",
        description: "Regras comerciais",
        icon: LayoutDashboard,
        available: true,
      },
    ],
  },
  {
    group: "OPERAÇÃO",
    items: [
      {
        id: "orders",
        label: "Pedidos",
        description: "Comportamento dos pedidos",
        icon: Settings2,
        available: false,
      },
      {
        id: "notifications",
        label: "Notificações",
        description: "Alertas e eventos",
        icon: CircleHelp,
        available: false,
      },
      {
        id: "team",
        label: "Equipa",
        description: "Membros e funções",
        icon: Users,
        available: true,
      },
    ],
  },
  {
    group: "CANAIS",
    items: [
      {
        id: "channels",
        label: "Canais",
        description: "Facebook, Instagram e WhatsApp",
        icon: Globe2,
        available: true,
      },
    ],
  },
  {
    group: "IA & AUTOMAÇÃO",
    items: [
      {
        id: "ai",
        label: "Configuração da IA",
        description: "Regras globais da IA",
        icon: Bot,
        available: true,
      },
      {
        id: "automations",
        label: "Automações",
        description: "Fluxos automáticos",
        icon: Settings2,
        available: false,
      },
    ],
  },
  {
    group: "SISTEMA",
    items: [
      {
        id: "integrations",
        label: "Integrações",
        description: "Serviços externos",
        icon: Globe2,
        available: false,
      },
      {
        id: "api",
        label: "API",
        description: "Chaves e acesso externo",
        icon: KeyRound,
        available: false,
      },
      {
        id: "security",
        label: "Segurança",
        description: "Acesso e autenticação",
        icon: ShieldCheck,
        available: true,
      },
      {
        id: "audit",
        label: "Audit Log",
        description: "Histórico administrativo",
        icon: LayoutDashboard,
        available: true,
      },
    ],
  },
];

const DEFAULT_BUSINESS: BusinessSettings = {
  id: "",
  user_id: "",
  business_name: "",
  business_type: "",
  brand_voice: "",
  default_tone: "Profissional",
  target_audience: "",
  auto_hashtags: true,
  auto_publish: false,
  default_platform: "instagram",
  include_cta: true,
  include_emojis: false,
  facebook_connected: false,
  facebook_url: "",
  instagram_connected: false,
  instagram_handle: "",
  linkedin_connected: false,
  linkedin_url: "",
  tiktok_connected: false,
  tiktok_url: "",
  twitter_handle: "",
  follower_count: null,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#747b73]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[25px] font-semibold tracking-[-0.025em] text-[#202522]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#747b73]">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-[#202522]">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-[#747b73]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="h-11 w-full rounded-lg border border-[#ded9d0] bg-[#fffdf9] px-3.5 text-sm text-[#202522] outline-none transition placeholder:text-[#a7aaa2] focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className="w-full resize-y rounded-lg border border-[#ded9d0] bg-[#fffdf9] px-3.5 py-3 text-sm leading-6 text-[#202522] outline-none transition placeholder:text-[#a7aaa2] focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-lg border border-[#ded9d0] bg-[#fffdf9] px-3.5 text-sm text-[#202522] outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
    >
      {children}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-5 py-3 text-left"
      aria-pressed={checked}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#202522]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-[#747b73]">
            {description}
          </span>
        )}
      </span>

      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-[7px] border transition",
          checked
            ? "border-neutral-950 bg-[#202522]"
            : "border-[#c9c3b8] bg-[#ebe7df]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-[7px] bg-[#fffdf9] shadow-sm transition",
            checked ? "left-[21px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

function SaveBar({
  saving,
  dirty,
  onSave,
}: {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
}) {
  if (!dirty) return null;

  return (
    <div className="sticky bottom-4 z-20 mt-8 flex items-center justify-between gap-4 rounded-[7px] border border-[#ded9d0] bg-[#fffdf9]/95 px-4 py-3 shadow-lg shadow-black/[0.06]">
      <p className="text-sm text-[#747b73]">
        Existem alterações por guardar.
      </p>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#202522] px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? "A guardar..." : "Guardar alterações"}
      </button>
    </div>
  );
}

export default function CompanySettings() {
  const { company, reload } = useCompany();
  const { user } = useAuth();

  const [section, setSection] = useState<Section>("company");
  const [business, setBusiness] =
    useState<BusinessSettings>(DEFAULT_BUSINESS);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: "",
    currency: "AOA",
    whatsapp: "",
    description: "",
  });

  const [commerceForm, setCommerceForm] = useState({
    lowStockThreshold: "5",
    blockOutOfStock: true,
    defaultShipping: "0",
    freeShippingAbove: "0",
    minimumOrder: "0",
  });

  useEffect(() => {
    if (!company) return;

    setCompanyForm({
      name: company.name,
      currency: company.currency,
      whatsapp: company.whatsapp ?? "",
      description: company.description ?? "",
    });
  }, [company]);

  const loadBusinessSettings = async () => {
    if (!user) return;

    setLoadingBusiness(true);

    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error(`Não foi possível carregar o perfil do negócio: ${error.message}`);
      setLoadingBusiness(false);
      return;
    }

    if (data) {
      setBusiness({
        ...DEFAULT_BUSINESS,
        ...(data as BusinessSettings),
      });
    } else {
      setBusiness({
        ...DEFAULT_BUSINESS,
        user_id: user.id,
      });
    }

    setLoadingBusiness(false);
  };

  const loadMembers = async () => {
    if (!company) return;

    setLoadingMembers(true);

    const { data, error } = await supabase
      .from("company_members")
      .select("id,company_id,user_id,role")
      .eq("company_id", company.id)
      .order("created_at");

    if (error) {
      toast.error(`Não foi possível carregar a equipa: ${error.message}`);
      setLoadingMembers(false);
      return;
    }

    const rawMembers = (data ?? []) as Member[];

    if (rawMembers.length === 0) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const userIds = rawMembers.map((member) => member.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,full_name,email,avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile])
    );

    setMembers(
      rawMembers.map((member) => ({
        ...member,
        profile: profileMap.get(member.user_id) ?? null,
      }))
    );

    setLoadingMembers(false);
  };

  useEffect(() => {
    loadBusinessSettings();
  }, [user?.id]);

  useEffect(() => {
    loadMembers();
  }, [company?.id]);

  useEffect(() => {
    if (section === "audit" && company) {
      async function loadAudit() {
        setLoadingAudit(true);
        const { data } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(100);

        setAuditLogs((data as AuditLog[]) ?? []);
        setLoadingAudit(false);
      }

      loadAudit();
    }
  }, [section, company?.id]);

  const markDirty = () => setDirty(true);

  const saveCompany = async () => {
    if (!company || !companyForm.name.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("companies")
      .update({
        name: companyForm.name.trim(),
        currency: companyForm.currency,
        whatsapp: companyForm.whatsapp.trim() || null,
        description: companyForm.description.trim() || null,
      })
      .eq("id", company.id);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDirty(false);
    await reload();
    toast.success("Informações da empresa atualizadas.");
  };

  const saveBusiness = async () => {
    if (!user) return;

    setSaving(true);

    const payload = {
      user_id: user.id,
      business_name: business.business_name?.trim() || null,
      business_type: business.business_type?.trim() || null,
      brand_voice: business.brand_voice?.trim() || null,
      default_tone: business.default_tone || null,
      target_audience: business.target_audience?.trim() || null,
      auto_hashtags: business.auto_hashtags ?? true,
      auto_publish: business.auto_publish,
      default_platform: business.default_platform || null,
      include_cta: business.include_cta ?? true,
      include_emojis: business.include_emojis ?? false,
      facebook_connected: business.facebook_connected ?? false,
      facebook_url: business.facebook_url?.trim() || null,
      instagram_connected: business.instagram_connected ?? false,
      instagram_handle: business.instagram_handle?.trim() || null,
      linkedin_connected: business.linkedin_connected ?? false,
      linkedin_url: business.linkedin_url?.trim() || null,
      tiktok_connected: business.tiktok_connected ?? false,
      twitter_handle: business.twitter_handle?.trim() || null,
      follower_count: business.follower_count,
    };

    let error: { message: string } | null = null;

    if (business.id) {
      const result = await supabase
        .from("business_settings")
        .update(payload)
        .eq("id", business.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("business_settings")
        .insert(payload)
        .select("*")
        .single();

      error = result.error;

      if (result.data) {
        setBusiness({
          ...DEFAULT_BUSINESS,
          ...(result.data as BusinessSettings),
        });
      }
    }

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDirty(false);
    await loadBusinessSettings();
    toast.success("Configurações do negócio atualizadas.");
  };

  const save = async () => {
    if (section === "company") {
      await saveCompany();
      return;
    }

    if (
      section === "business" ||
      section === "branding" ||
      section === "channels" ||
      section === "ai"
    ) {
      await saveBusiness();
      return;
    }
  };

  const selectSection = (next: Section) => {
    setSection(next);
    setDirty(false);
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    const source = name?.trim() || email?.trim() || "U";

    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const renderCompany = () => (
    <>
      <SectionHeading
        eyebrow="Geral"
        title="Empresa"
        description="Defina a identidade básica, moeda e contactos usados pela sua loja."
      />

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[#202522]">
            Informações da empresa
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Nome da empresa">
              <Input
                value={companyForm.name}
                onChange={(value) => {
                  setCompanyForm((current) => ({ ...current, name: value }));
                  markDirty();
                }}
                maxLength={80}
                placeholder="Nome da empresa"
              />
            </Field>

            <Field
              label="Moeda"
              hint="Usada na loja, pedidos e apresentação dos preços."
            >
              <Select
                value={companyForm.currency}
                onChange={(value) => {
                  setCompanyForm((current) => ({
                    ...current,
                    currency: value,
                  }));
                  markDirty();
                }}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="WhatsApp da loja">
              <Input
                value={companyForm.whatsapp}
                onChange={(value) => {
                  setCompanyForm((current) => ({
                    ...current,
                    whatsapp: value,
                  }));
                  markDirty();
                }}
                maxLength={30}
                placeholder="+244 9xx xxx xxx"
              />
            </Field>

            <Field label="Endereço público da loja">
              <div className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[#ded9d0] bg-[#f1eee7] px-3.5">
                <span className="truncate text-sm text-[#747b73]">
                  /loja/{company?.slug}
                </span>

                <a
                  href={`/loja/${company?.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-[#202522] transition hover:underline"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Field>
          </div>
        </section>

        <div className="border-t border-[#ded9d0]" />

        <section>
          <h3 className="text-sm font-semibold text-[#202522]">
            Sobre o negócio
          </h3>

          <div className="mt-5">
            <Field
              label="Descrição"
              hint="Esta informação pode ser usada pelos agentes para compreender o negócio."
            >
              <Textarea
                value={companyForm.description}
                onChange={(value) => {
                  setCompanyForm((current) => ({
                    ...current,
                    description: value,
                  }));
                  markDirty();
                }}
                maxLength={500}
                rows={6}
                placeholder="Descreva brevemente a empresa, os seus produtos e a forma como trabalha."
              />

              <p className="mt-1 text-right text-xs text-[#a7aaa2]">
                {companyForm.description.length}/500
              </p>
            </Field>
          </div>
        </section>

        <section className="rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] p-4">
          <div className="flex gap-3">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" />
            <div>
              <p className="text-sm font-medium text-[#202522]">
                Sobre a estrutura da empresa
              </p>
              <p className="mt-1 text-xs leading-5 text-[#747b73]">
                Esta empresa é gerida através da sua conta e dos membros
                associados. A loja pública usa o slug acima como endereço.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );

  const renderBranding = () => (
    <>
      <SectionHeading
        eyebrow="Geral"
        title="Branding"
        description="Organize a identidade visual que será usada nas experiências públicas da empresa."
      />

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[#202522]">
            Identidade visual
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Logo"
                hint="O armazenamento de imagens ainda não está ligado a esta configuração."
              >
                <div className="flex items-center gap-4 rounded-[7px] border border-dashed border-[#c9c3b8] bg-[#f1eee7] p-5">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[7px] border border-[#ded9d0] bg-[#fffdf9]">
                    <Building2 className="h-7 w-7 text-[#a7aaa2]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#202522]">
                      Logo da empresa
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#747b73]">
                      A infraestrutura de Storage pode ser conectada aqui numa
                      próxima etapa.
                    </p>
                  </div>
                </div>
              </Field>
            </div>

            <Field label="Nome exibido">
              <Input
                value={business.business_name ?? ""}
                onChange={(value) => {
                  setBusiness((current) => ({
                    ...current,
                    business_name: value,
                  }));
                  markDirty();
                }}
                placeholder={company?.name}
                maxLength={100}
              />
            </Field>

            <Field label="Tipo de negócio">
              <Input
                value={business.business_type ?? ""}
                onChange={(value) => {
                  setBusiness((current) => ({
                    ...current,
                    business_type: value,
                  }));
                  markDirty();
                }}
                placeholder="Ex.: Retalho, Tecnologia, Moda"
                maxLength={80}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[7px] border border-[#ded9d0] bg-[#fffdf9] p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#ebe7df]">
              <Store className="h-5 w-5 text-[#5f625d]" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#202522]">
                Pré-visualização
              </p>
              <div className="mt-4 rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#202522] text-sm font-semibold text-white">
                    {getInitials(
                      business.business_name || company?.name,
                      null
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#202522]">
                      {business.business_name ||
                        company?.name ||
                        "Nome da empresa"}
                    </p>
                    <p className="text-xs text-[#747b73]">
                      {business.business_type || "Tipo de negócio"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SaveBar saving={saving} dirty={dirty} onSave={save} />
    </>
  );

  const renderBusiness = () => (
    <>
      <SectionHeading
        eyebrow="Geral"
        title="Negócio"
        description="Informações que ajudam a plataforma e os agentes a compreenderem a empresa."
      />

      {loadingBusiness ? (
        <div className="animate-pulse space-y-4">
          <div className="h-11 rounded-lg bg-[#ebe7df]" />
          <div className="h-28 rounded-lg bg-[#ebe7df]" />
          <div className="h-28 rounded-lg bg-[#ebe7df]" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-[#202522]">
              Perfil do negócio
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Nome do negócio">
                <Input
                  value={business.business_name ?? ""}
                  onChange={(value) => {
                    setBusiness((current) => ({
                      ...current,
                      business_name: value,
                    }));
                    markDirty();
                  }}
                  placeholder={company?.name}
                />
              </Field>

              <Field label="Tipo de negócio">
                <Input
                  value={business.business_type ?? ""}
                  onChange={(value) => {
                    setBusiness((current) => ({
                      ...current,
                      business_type: value,
                    }));
                    markDirty();
                  }}
                  placeholder="Ex.: Retalho"
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Público-alvo"
                  hint="Ajuda os agentes a adaptar linguagem e conteúdo."
                >
                  <Textarea
                    value={business.target_audience ?? ""}
                    onChange={(value) => {
                      setBusiness((current) => ({
                        ...current,
                        target_audience: value,
                      }));
                      markDirty();
                    }}
                    rows={4}
                    maxLength={500}
                    placeholder="Descreva o público principal da empresa."
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="border-t border-[#ded9d0]" />

          <section>
            <h3 className="text-sm font-semibold text-[#202522]">
              Voz da marca
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Tom padrão">
                <Select
                  value={business.default_tone ?? "Profissional"}
                  onChange={(value) => {
                    setBusiness((current) => ({
                      ...current,
                      default_tone: value,
                    }));
                    markDirty();
                  }}
                >
                  <option>Profissional</option>
                  <option>Amigável</option>
                  <option>Objetivo</option>
                  <option>Informal</option>
                  <option>Inspirador</option>
                </Select>
              </Field>

              <Field
                label="Plataforma padrão"
                hint="Usada quando uma execução não especificar o canal."
              >
                <Select
                  value={business.default_platform ?? "instagram"}
                  onChange={(value) => {
                    setBusiness((current) => ({
                      ...current,
                      default_platform: value,
                    }));
                    markDirty();
                  }}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="whatsapp">WhatsApp</option>
                </Select>
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Brand voice"
                  hint="Instrução global usada para orientar a comunicação dos agentes."
                >
                  <Textarea
                    value={business.brand_voice ?? ""}
                    onChange={(value) => {
                      setBusiness((current) => ({
                        ...current,
                        brand_voice: value,
                      }));
                      markDirty();
                    }}
                    rows={6}
                    maxLength={1000}
                    placeholder="Ex.: Comunicação profissional, clara e próxima. Evitar exageros e nunca inventar características dos produtos."
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>
      )}

      <SaveBar saving={saving} dirty={dirty} onSave={save} />
    </>
  );

  const renderCommerce = () => (
    <>
      <SectionHeading
        eyebrow="Geral"
        title="Comércio"
        description="Regras operacionais básicas para a gestão do catálogo e stock."
      />

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[#202522]">
            Moeda e inventário
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Moeda"
              hint="Definida nas informações da empresa."
            >
              <Select
                value={companyForm.currency}
                onChange={(value) => {
                  setCompanyForm((current) => ({
                    ...current,
                    currency: value,
                  }));
                  markDirty();
                }}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Limite de stock baixo"
              hint="Valor de referência visual para produtos com pouco stock."
            >
              <Input
                value={commerceForm.lowStockThreshold}
                onChange={(value) => {
                  setCommerceForm((current) => ({
                    ...current,
                    lowStockThreshold: value,
                  }));
                  markDirty();
                }}
                type="number"
                placeholder="5"
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-[#ded9d0]" />

        <section>
          <h3 className="text-sm font-semibold text-[#202522]">
            Regras comerciais
          </h3>

          <div className="mt-4 divide-y divide-neutral-200 rounded-[7px] border border-[#ded9d0] px-4">
            <Toggle
              checked={commerceForm.blockOutOfStock}
              onChange={(checked) => {
                setCommerceForm((current) => ({
                  ...current,
                  blockOutOfStock: checked,
                }));
                markDirty();
              }}
              label="Bloquear pedidos sem stock"
              description="Impede a venda de produtos quando o stock disponível é zero."
            />
          </div>
        </section>

        <section className="rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" />

            <div>
              <p className="text-sm font-medium text-[#202522]">
                Configurações comerciais avançadas
              </p>
              <p className="mt-1 text-xs leading-5 text-[#747b73]">
                Frete, IVA, valor mínimo de pedido e regras de cancelamento
                ainda não possuem campos persistentes no schema atual. Por
                isso, não são apresentados como configurações funcionais.
              </p>
            </div>
          </div>
        </section>
      </div>

      <SaveBar
        saving={false}
        dirty={dirty}
        onSave={() => {
          toast.info(
            "As regras avançadas de comércio ainda precisam de persistência no banco."
          );
        }}
      />
    </>
  );

  const renderChannels = () => (
    <>
      <SectionHeading
        title="Canais"
        description="Veja as conexões atualmente representadas no perfil do negócio."
      />

      <div className="space-y-3">
        <ChannelRow
          icon={<Instagram className="h-5 w-5" />}
          name="Instagram"
          detail={
            business.instagram_connected
              ? business.instagram_handle || "Conectado"
              : "Não conectado"
          }
          connected={Boolean(business.instagram_connected)}
          onToggle={() => {
            setBusiness((current) => ({
              ...current,
              instagram_connected: !current.instagram_connected,
            }));
            markDirty();
          }}
        />

        <ChannelRow
          icon={<Facebook className="h-5 w-5" />}
          name="Facebook"
          detail={
            business.facebook_connected
              ? business.facebook_url || "Conectado"
              : "Não conectado"
          }
          connected={Boolean(business.facebook_connected)}
          onToggle={() => {
            setBusiness((current) => ({
              ...current,
              facebook_connected: !current.facebook_connected,
            }));
            markDirty();
          }}
        />

        <ChannelRow
          icon={<MessageCircle className="h-5 w-5" />}
          name="WhatsApp"
          detail={company?.whatsapp || "Número da loja não configurado"}
          connected={Boolean(company?.whatsapp)}
          href={company?.whatsapp ? `https://wa.me/${company.whatsapp.replace(/\D/g, "")}` : undefined}
        />

        <ChannelRow
          icon={<Globe2 className="h-5 w-5" />}
          name="Website / Store"
          detail={company ? `/loja/${company.slug}` : ""}
          connected={Boolean(company)}
          href={company ? `/loja/${company.slug}` : undefined}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Field label="Instagram handle">
          <Input
            value={business.instagram_handle ?? ""}
            onChange={(value) => {
              setBusiness((current) => ({
                ...current,
                instagram_handle: value,
              }));
              markDirty();
            }}
            placeholder="@empresa"
          />
        </Field>

        <Field label="Facebook URL">
          <Input
            value={business.facebook_url ?? ""}
            onChange={(value) => {
              setBusiness((current) => ({
                ...current,
                facebook_url: value,
              }));
              markDirty();
            }}
            placeholder="https://facebook.com/..."
          />
        </Field>
      </div>

      <SaveBar saving={saving} dirty={dirty} onSave={save} />
    </>
  );

  const renderAI = () => (
    <>
      <SectionHeading
        eyebrow="IA & Automação"
        title="Configuração da IA"
        description="Defina as regras globais. Configurações específicas de cada agente continuam na página Agents."
      />

      {loadingBusiness ? (
        <div className="animate-pulse space-y-4">
          <div className="h-28 rounded-[7px] bg-[#ebe7df]" />
          <div className="h-40 rounded-[7px] bg-[#ebe7df]" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-[#202522]">
              Política global
            </h3>

            <div className="mt-4 rounded-[7px] border border-[#ded9d0] px-4">
              <Toggle
                checked={Boolean(business.include_cta)}
                onChange={(checked) => {
                  setBusiness((current) => ({
                    ...current,
                    include_cta: checked,
                  }));
                  markDirty();
                }}
                label="Incluir CTA"
                description="Permite que o conteúdo gerado inclua uma chamada para ação."
              />

              <Toggle
                checked={Boolean(business.auto_hashtags)}
                onChange={(checked) => {
                  setBusiness((current) => ({
                    ...current,
                    auto_hashtags: checked,
                  }));
                  markDirty();
                }}
                label="Gerar hashtags automaticamente"
                description="Permite incluir hashtags nos conteúdos gerados."
              />

              <Toggle
                checked={Boolean(business.include_emojis)}
                onChange={(checked) => {
                  setBusiness((current) => ({
                    ...current,
                    include_emojis: checked,
                  }));
                  markDirty();
                }}
                label="Permitir emojis"
                description="Controla a utilização de emojis no conteúdo gerado."
              />

              <Toggle
                checked={Boolean(business.auto_publish)}
                onChange={(checked) => {
                  setBusiness((current) => ({
                    ...current,
                    auto_publish: checked,
                  }));
                  markDirty();
                }}
                label="Publicação automática"
                description="Configuração atualmente armazenada no perfil do negócio."
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[#202522]">
              Dados disponíveis para a IA
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                "Informações dos produtos",
                "Stock dos produtos",
                "Preços",
                "Promoções",
                "Informações do negócio",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[7px] border border-[#ded9d0] bg-[#fffdf9] px-4 py-3"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#ebe7df]">
                    <Check className="h-4 w-4 text-[#5f625d]" />
                  </div>
                  <span className="text-sm text-[#303732]">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5f625d]" />
              <div>
                <p className="text-sm font-semibold text-[#202522]">
                  Limites de segurança
                </p>
                <p className="mt-1 text-sm leading-6 text-[#747b73]">
                  As regras críticas não devem depender apenas desta interface.
                  Alterações de preço, stock, reembolsos e outras ações
                  sensíveis devem continuar protegidas no backend.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "Não inventar dados de produtos",
                    "Não alterar preços",
                    "Não alterar stock",
                    "Não executar reembolsos",
                  ].map((rule) => (
                    <div
                      key={rule}
                      className="flex items-center gap-2 text-xs text-[#5f625d]"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <SaveBar saving={saving} dirty={dirty} onSave={save} />
    </>
  );

  const renderTeam = () => (
    <>
      <SectionHeading
        eyebrow="Operação"
        title="Equipa"
        description="Membros associados à empresa e a função que possuem dentro da organização."
      />

      <div className="overflow-hidden rounded-[7px] border border-[#ded9d0] bg-[#fffdf9]">
        <div className="hidden grid-cols-[minmax(0,1fr)_140px_80px] gap-4 border-b border-[#ded9d0] bg-[#f1eee7] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#747b73] md:grid">
          <span>Membro</span>
          <span>Função</span>
          <span />
        </div>

        {loadingMembers ? (
          <div className="space-y-3 p-5">
            <div className="h-12 animate-pulse rounded-lg bg-[#ebe7df]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#ebe7df]" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-7 w-7 text-[#c9c3b8]" />
            <p className="mt-3 text-sm font-medium text-[#202522]">
              Nenhum membro encontrado
            </p>
          </div>
        ) : (
          members.map((member) => {
            const name =
              member.profile?.full_name ||
              member.profile?.email ||
              "Utilizador";

            return (
              <div
                key={member.id}
                className="grid gap-3 border-b border-[#ebe7df] px-5 py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_140px_80px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {member.profile?.avatar_url ? (
                    <img
                      src={member.profile.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-[7px] object-cover"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] bg-[#ebe7df] text-xs font-semibold text-[#5f625d]">
                      {getInitials(name, member.profile?.email)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202522]">
                      {name}
                    </p>
                    <p className="truncate text-xs text-[#747b73]">
                      {member.profile?.email || member.user_id}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="inline-flex rounded-[7px] bg-[#ebe7df] px-2.5 py-1 text-xs font-medium capitalize text-[#5f625d]">
                    {member.role}
                  </span>
                </div>

                <div className="hidden md:block">
                  {member.role === "owner" && (
                    <span className="text-xs text-[#a7aaa2]">
                      Proprietário
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 rounded-[7px] border border-[#ded9d0] bg-[#f1eee7] p-5">
        <div className="flex gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#747b73]" />
          <div>
            <p className="text-sm font-medium text-[#202522]">
              Funções disponíveis
            </p>
            <p className="mt-1 text-xs leading-5 text-[#747b73]">
              O sistema atualmente suporta Owner, Admin e Staff. A gestão
              detalhada de permissões será adicionada sobre este RBAC.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderAudit = () => (
    <>
      <SectionHeading
        eyebrow="Sistema"
        title="Audit Log"
        description="Histórico de alterações, ações administrativas e atividades registadas no sistema."
      />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-[7px] border border-[#ded9d0] bg-[#fffdf9]">
          <div className="hidden grid-cols-[140px_minmax(0,1fr)_140px] gap-4 border-b border-[#ded9d0] bg-[#f1eee7] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#747b73] md:grid">
            <span>Ator</span>
            <span>Ação / Alteração</span>
            <span>Data</span>
          </div>

          {loadingAudit ? (
            <div className="space-y-3 p-5">
              <div className="h-12 animate-pulse rounded-lg bg-[#ebe7df]" />
              <div className="h-12 animate-pulse rounded-lg bg-[#ebe7df]" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldCheck className="mx-auto h-7 w-7 text-[#c9c3b8]" />
              <p className="mt-3 text-sm font-semibold text-[#202522]">
                Nenhum evento de auditoria registado
              </p>
              <p className="mt-1 text-xs text-[#a7aaa2]">
                As ações sensíveis executadas por utilizadores e agentes aparecerão aqui.
              </p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 border-b border-[#ebe7df] px-5 py-4 last:border-0 md:grid-cols-[140px_minmax(0,1fr)_140px] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[#202522]">{log.actor_name}</p>
                  <span className="inline-flex rounded bg-[#ebe7df] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#747b73]">
                    {log.actor_type}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#202522]">{log.action}</p>
                  {log.target_type && (
                    <p className="text-xs text-[#a7aaa2]">
                      Alvo: {log.target_type} {log.target_id ? `(#${log.target_id.slice(0, 8)})` : ""}
                    </p>
                  )}
                </div>

                <div className="text-xs text-[#747b73]">
                  {new Intl.DateTimeFormat("pt-PT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(log.created_at))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const renderSection = () => {
    switch (section) {
      case "company":
        return renderCompany();

      case "branding":
        return renderBranding();

      case "business":
        return renderBusiness();

      case "commerce":
        return renderCommerce();

      case "channels":
        return renderChannels();

      case "ai":
        return renderAI();

      case "team":
        return renderTeam();

      case "audit":
        return renderAudit();

      default:
        return renderCompany();
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 lg:hidden">
          <select
            value={section}
            onChange={(e) => selectSection(e.target.value as Section)}
            className="h-11 w-full rounded-lg border border-[#ded9d0] bg-[#fffdf9] px-3 text-sm font-medium text-[#202522]"
          >
            {NAVIGATION.flatMap((group) =>
              group.items
                .filter((item) => item.available)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))
            )}
          </select>
        </div>

        <div className="grid gap-8 lg:grid-cols-[235px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-5">
                <p className="mt-1 text-sm text-[#747b73]">
                  Configuração da empresa
                </p>
              </div>

              <nav className="space-y-6">
                {NAVIGATION.map((group) => (
                  <div key={group.group}>
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7aaa2]">
                      {group.group}
                    </p>

                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = section === item.id;

                        if (!item.available) return null;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectSection(item.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                              active
                                ? "bg-[#202522] text-white"
                                : "text-[#747b73] hover:bg-[#ebe7df] hover:text-[#202522]"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />

                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {item.label}
                            </span>

                            {active && (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-8 border-t border-[#ded9d0] pt-5">
                <Link
                  to={`/loja/${company?.slug}`}
                  target="_blank"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#747b73] transition hover:bg-[#ebe7df] hover:text-[#202522]"
                >
                  <Store className="h-4 w-4" />
                  Ver loja
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          <main className="min-w-0 max-w-4xl">{renderSection()}</main>
        </div>
      </div>
    </AdminLayout>
  );
}

function ChannelRow({
  icon,
  name,
  detail,
  connected,
  onToggle,
  href,
}: {
  icon: React.ReactNode;
  name: string;
  detail: string;
  connected: boolean;
  onToggle?: () => void;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[7px] border border-[#ded9d0] bg-[#fffdf9] p-5 sm:flex-row sm:items-center">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ebe7df] text-[#5f625d]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#202522]">{name}</p>

          <span className="flex items-center gap-1.5 text-xs text-[#747b73]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-[7px]",
                connected ? "bg-[#202522]" : "bg-neutral-300"
              )}
            />
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-[#747b73]">{detail}</p>
      </div>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "h-9 rounded-lg border px-3 text-xs font-medium transition",
            connected
              ? "border-[#ded9d0] bg-[#fffdf9] text-[#5f625d] hover:bg-[#f1eee7]"
              : "border-neutral-950 bg-[#202522] text-white hover:bg-neutral-800"
          )}
        >
          {connected ? "Desconectar" : "Marcar conectado"}
        </button>
      )}

      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#ded9d0] px-3 text-xs font-medium text-[#5f625d] transition hover:bg-[#f1eee7]"
        >
          Abrir
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
