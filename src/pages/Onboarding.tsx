import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Circle, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { CURRENCIES, slugify } from "@/lib/format";
import { toast } from "sonner";

type Step = 1 | 2 | 3;
type FormState = { name: string; slug: string; currency: string; description: string; whatsapp: string; productName: string; productCategory: string; productPrice: string; productStock: string };

const initialForm: FormState = { name: "", slug: "", currency: "AOA", description: "", whatsapp: "", productName: "", productCategory: "", productPrice: "", productStock: "0" };
const stepLabels = ["Loja", "Produto", "Confirmar"];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-xs font-bold text-slate-800">{label}</label>
        {hint && <span className="text-[11px] font-medium text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 shadow-2xs";

export default function Onboarding() {
  const { user } = useAuth();
  const { company, loading: companyLoading, error: companyError, reload, select } = useCompany();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const hasProduct = form.productName.trim().length > 0;
  const currency = useMemo(() => CURRENCIES.find((item) => item.code === form.currency), [form.currency]);

  if (companyLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-900">
        <p role="status" className="text-sm font-medium text-slate-500">
          A validar o acesso à loja…
        </p>
      </main>
    );
  }

  if (companyError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-900">
        <section className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-xs">
          <p className="text-lg font-bold text-slate-900">Não foi possível carregar a sua loja.</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  if (company) return <Navigate to="/dashboard" replace />;

  const validate = (current: Step) => {
    if (current === 1) {
      if (!form.name.trim()) { toast.error("Indique o nome da loja."); return false; }
      if (!slugify(form.slug || form.name)) { toast.error("Indique um endereço público válido."); return false; }
    }
    if (current === 2 && hasProduct) {
      if (!form.productPrice || !Number.isFinite(Number(form.productPrice)) || Number(form.productPrice) < 0) { toast.error("Indique um preço válido."); return false; }
      if (!Number.isInteger(Number(form.productStock)) || Number(form.productStock) < 0) { toast.error("O stock deve ser um número inteiro igual ou superior a zero."); return false; }
    }
    return true;
  };

  const next = () => { if (validate(step)) setStep((current) => Math.min(3, current + 1) as Step); };
  const back = () => setStep((current) => Math.max(1, current - 1) as Step);

  const finish = async () => {
    if (!user || !validate(1) || !validate(2)) return;
    const slug = slugify(form.slug || form.name);
    setSaving(true);
    const { data, error } = await supabase.from("companies").insert({ name: form.name.trim(), slug, currency: form.currency, description: form.description.trim() || null, whatsapp: form.whatsapp.trim() || null, created_by: user.id }).select("id").single();
    if (error || !data) {
      setSaving(false);
      toast.error(error?.code === "23505" ? "Esse endereço já está em uso." : error?.message || "Não foi possível criar a loja.");
      return;
    }
    select(data.id);
    if (hasProduct) {
      const { error: productError } = await supabase.from("products").insert({ company_id: data.id, name: form.productName.trim(), category: form.productCategory.trim() || null, price: Number(form.productPrice), stock: Number(form.productStock), active: true, images: [] });
      if (productError) toast.warning("A loja foi criada. Adicione o produto no catálogo.");
    }
    await reload();
    setSaving(false);
    toast.success("Loja criada.");
    navigate("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white shadow-2xs">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Circle className="h-2 w-2 fill-current" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">Vendora</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Configuração inicial
          </span>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1120px] lg:grid-cols-[220px_minmax(0,620px)] lg:gap-20 lg:px-8">
        <aside className="border-b border-slate-200/80 py-6 lg:border-b-0 lg:py-12">
          <div className="mb-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            3 passos simples
          </div>
          <nav aria-label="Progresso da configuração" className="flex gap-5 lg:block lg:space-y-5">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const complete = step > number;
              return (
                <div key={label} className="flex items-center gap-3 lg:items-start">
                  <div className="relative">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl border text-xs font-bold transition shadow-xs ${
                        complete
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {complete ? <Check className="h-4 w-4" /> : number}
                    </span>
                    {number < 3 && (
                      <span
                        className={`absolute left-1/2 top-9 hidden h-5 w-px -translate-x-1/2 lg:block ${
                          complete ? "bg-emerald-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <div className={`text-xs font-bold ${active ? "text-slate-900" : "text-slate-500"}`}>
                      {label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {number === 1 ? "Dados da loja" : number === 2 ? "Opcional" : "Rever e criar"}
                    </div>
                  </div>
                  <span className={`text-xs font-bold lg:hidden ${active ? "text-slate-900" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="px-5 py-8 sm:px-0 lg:py-14">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              PASSO 0{step} DE 03
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {step === 1 ? "Configure a sua loja" : step === 2 ? "Adicione um produto" : "Confirme os dados"}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {step === 1
                ? "Estes dados identificam a sua operação e aparecem na loja pública."
                : step === 2
                ? "Comece com um produto real ou deixe o catálogo para configurar depois."
                : "Tudo o que for criado aqui pode ser alterado no painel da loja."}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <Field label="Nome da loja">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => {
                    update("name", event.target.value);
                    if (!form.slug || form.slug === slugify(form.name))
                      update("slug", slugify(event.target.value));
                  }}
                  placeholder="Ex.: Sapataria Luanda"
                  maxLength={80}
                />
              </Field>

              <Field label="Endereço público" hint="editável">
                <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 shadow-2xs">
                  <span className="pl-3.5 text-xs font-semibold text-slate-400">/loja/</span>
                  <input
                    className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-slate-900 outline-none"
                    value={form.slug}
                    onChange={(event) => update("slug", slugify(event.target.value))}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 font-medium">
                  vendora.co/loja/{slugify(form.slug || form.name) || "nome-da-loja"}
                </p>
              </Field>

              <Field label="Moeda principal">
                <select
                  className={inputClass}
                  value={form.currency}
                  onChange={(event) => update("currency", event.target.value)}
                >
                  {CURRENCIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Descrição" hint="opcional">
                <textarea
                  className="min-h-[94px] w-full resize-none rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 shadow-2xs"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  maxLength={500}
                  placeholder="Uma frase sobre o que a sua loja vende."
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                Este passo é opcional. Não criamos dados de demonstração: só será criado um produto se preencher o nome abaixo.
              </div>

              <Field label="Nome do produto" hint="opcional">
                <input
                  className={inputClass}
                  value={form.productName}
                  onChange={(event) => update("productName", event.target.value)}
                  placeholder="Ex.: Camisa de linho"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Preço (${currency?.label || form.currency})`}>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.productPrice}
                    onChange={(event) => update("productPrice", event.target.value)}
                    placeholder="0,00"
                    disabled={!hasProduct}
                  />
                </Field>

                <Field label="Stock inicial">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    value={form.productStock}
                    onChange={(event) => update("productStock", event.target.value)}
                    disabled={!hasProduct}
                  />
                </Field>
              </div>

              <Field label="Categoria" hint="opcional">
                <input
                  className={inputClass}
                  value={form.productCategory}
                  onChange={(event) => update("productCategory", event.target.value)}
                  placeholder="Ex.: Camisas"
                  disabled={!hasProduct}
                />
              </Field>

              <Field label="WhatsApp da operação" hint="opcional">
                <input
                  className={inputClass}
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) => update("whatsapp", event.target.value)}
                  placeholder="+244 900 000 000"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center gap-3.5 border-b border-slate-100 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">{form.name}</div>
                  <div className="text-xs text-slate-400 font-medium">/loja/{slugify(form.slug || form.name)}</div>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <dt className="text-xs font-semibold text-slate-500">Moeda</dt>
                  <dd className="font-bold text-slate-900">{form.currency}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <dt className="text-xs font-semibold text-slate-500">Produto inicial</dt>
                  <dd className="font-bold text-slate-900">{hasProduct ? form.productName : "Nenhum"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <dt className="text-xs font-semibold text-slate-500">WhatsApp</dt>
                  <dd className="font-bold text-slate-900">{form.whatsapp || "Não indicado"}</dd>
                </div>
              </dl>

              <div className="border-t border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                Depois de criar a loja, pode continuar no painel com produtos, pedidos, inventário, canais e configurações.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 1 || saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "A criar loja..." : "Criar loja"}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200/80 bg-white px-5 py-4 text-center text-xs text-slate-400">
        Pode alterar estes dados a qualquer momento em Configurações.
      </footer>
    </main>
  );
}
