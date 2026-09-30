import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  return <div><div className="mb-2 flex items-baseline justify-between gap-3"><label className="text-xs font-semibold text-[#3f4640]">{label}</label>{hint && <span className="text-[11px] text-[#979c95]">{hint}</span>}</div>{children}</div>;
}

const inputClass = "h-11 w-full border border-[#d8d6ce] bg-[#fffdf9] px-3 text-sm text-[#202522] outline-none transition focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10";

export default function Onboarding() {
  const { user } = useAuth();
  const { reload, select } = useCompany();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const hasProduct = form.productName.trim().length > 0;
  const currency = useMemo(() => CURRENCIES.find((item) => item.code === form.currency), [form.currency]);

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

  return <main className="min-h-screen bg-[#f6f3ed] text-[#202522]">
    <header className="border-b border-[#dedbd2] bg-[#fffdf9]"><div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center bg-[#202522] text-[#fffdf9]"><Circle className="h-2.5 w-2.5 fill-current" /></span><span className="text-sm font-bold tracking-[-0.04em]">Vendora</span></div><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#979c95]">Configuração inicial</span></div></header>
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1120px] lg:grid-cols-[220px_minmax(0,620px)] lg:gap-20 lg:px-8">
      <aside className="border-b border-[#dedbd2] py-6 lg:border-b-0 lg:py-12"><div className="mb-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#979c95]">3 passos</div><nav aria-label="Progresso da configuração" className="flex gap-5 lg:block lg:space-y-5">{stepLabels.map((label, index) => { const number = index + 1; const active = step === number; const complete = step > number; return <div key={label} className="flex items-center gap-3 lg:items-start"><div className="relative"><span className={`grid h-7 w-7 place-items-center rounded-[5px] border text-[10px] font-semibold ${complete ? "border-[#2c6457] bg-[#2c6457] text-white" : active ? "border-[#202522] bg-[#202522] text-white" : "border-[#d8d6ce] bg-[#fffdf9] text-[#979c95]"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : number}</span>{number < 3 && <span className={`absolute left-1/2 top-8 hidden h-5 w-px -translate-x-1/2 lg:block ${complete ? "bg-[#2c6457]" : "bg-[#d8d6ce]"}`} />}</div><div className="hidden lg:block"><div className={`text-xs font-semibold ${active ? "text-[#202522]" : "text-[#747b73]"}`}>{label}</div><div className="mt-1 text-[11px] text-[#979c95]">{number === 1 ? "Dados da loja" : number === 2 ? "Opcional" : "Rever e criar"}</div></div><span className={`text-xs font-semibold lg:hidden ${active ? "text-[#202522]" : "text-[#979c95]"}`}>{label}</span></div>; })}</nav></aside>
      <section className="px-5 py-8 sm:px-0 lg:py-14">
        <div className="mb-9"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#2c6457]">Passo 0{step} de 03</p><h1 className="text-[30px] font-semibold leading-tight tracking-[-0.055em]">{step === 1 ? "Configure a sua loja" : step === 2 ? "Adicione um produto" : "Confirme os dados"}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#747b73]">{step === 1 ? "Estes dados identificam a sua operação e aparecem na loja pública." : step === 2 ? "Comece com um produto real ou deixe o catálogo para configurar depois." : "Tudo o que for criado aqui pode ser alterado no dashboard."}</p></div>
        {step === 1 && <div className="space-y-5"><Field label="Nome da loja"><input className={inputClass} value={form.name} onChange={(event) => { update("name", event.target.value); if (!form.slug || form.slug === slugify(form.name)) update("slug", slugify(event.target.value)); }} placeholder="Ex.: Sapataria Luanda" maxLength={80} /></Field><Field label="Endereço público" hint="editável"><div className="flex items-center border border-[#d8d6ce] bg-[#fffdf9]"><span className="pl-3 font-mono text-xs text-[#979c95]">/loja/</span><input className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))} /></div><p className="mt-2 text-[11px] text-[#979c95]">vendora.co/loja/{slugify(form.slug || form.name) || "nome-da-loja"}</p></Field><Field label="Moeda principal"><select className={inputClass} value={form.currency} onChange={(event) => update("currency", event.target.value)}>{CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></Field><Field label="Descrição" hint="opcional"><textarea className="min-h-[94px] w-full resize-none border border-[#d8d6ce] bg-[#fffdf9] p-3 text-sm outline-none focus:border-[#2c6457] focus:ring-2 focus:ring-[#2c6457]/10" value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={500} placeholder="Uma frase sobre o que a sua loja vende." /></Field></div>}
        {step === 2 && <div className="space-y-5"><div className="border border-[#dedbd2] bg-[#fffdf9] p-4 text-sm leading-6 text-[#5f625d]">Este passo é opcional. Não criamos dados de demonstração: só será criado um produto se preencher o nome abaixo.</div><Field label="Nome do produto" hint="opcional"><input className={inputClass} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder="Ex.: Camisa de linho" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={`Preço (${currency?.label || form.currency})`}><input className={inputClass} type="number" min="0" step="0.01" value={form.productPrice} onChange={(event) => update("productPrice", event.target.value)} placeholder="0,00" disabled={!hasProduct} /></Field><Field label="Stock inicial"><input className={inputClass} type="number" min="0" step="1" value={form.productStock} onChange={(event) => update("productStock", event.target.value)} disabled={!hasProduct} /></Field></div><Field label="Categoria" hint="opcional"><input className={inputClass} value={form.productCategory} onChange={(event) => update("productCategory", event.target.value)} placeholder="Ex.: Camisas" disabled={!hasProduct} /></Field><Field label="WhatsApp da operação" hint="opcional"><input className={inputClass} type="tel" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="+244 900 000 000" /></Field></div>}
        {step === 3 && <div className="border border-[#dedbd2] bg-[#fffdf9]"><div className="flex items-center gap-3 border-b border-[#ebe8e0] p-4"><div className="grid h-9 w-9 place-items-center bg-[#f1eee7] text-[#2c6457]"><Store className="h-4 w-4" /></div><div><div className="text-sm font-semibold">{form.name}</div><div className="font-mono text-[10px] text-[#979c95]">/loja/{slugify(form.slug || form.name)}</div></div></div><dl className="divide-y divide-[#ebe8e0] text-sm"><div className="flex items-center justify-between gap-4 p-4"><dt className="text-[#747b73]">Moeda</dt><dd className="font-medium">{form.currency}</dd></div><div className="flex items-center justify-between gap-4 p-4"><dt className="text-[#747b73]">Produto inicial</dt><dd className="font-medium">{hasProduct ? form.productName : "Nenhum"}</dd></div><div className="flex items-center justify-between gap-4 p-4"><dt className="text-[#747b73]">WhatsApp</dt><dd className="font-medium">{form.whatsapp || "Não indicado"}</dd></div></dl><div className="border-t border-[#ebe8e0] bg-[#f6f3ed] p-4 text-xs leading-5 text-[#747b73]">Depois de criar a loja, pode continuar no dashboard com produtos, pedidos, inventário, canais e configurações.</div></div>}
        <div className="mt-10 flex items-center justify-between border-t border-[#dedbd2] pt-5"><button type="button" onClick={back} disabled={step === 1 || saving} className="inline-flex h-10 items-center gap-2 px-2 text-sm font-semibold text-[#747b73] hover:text-[#202522] disabled:invisible"><ArrowLeft className="h-4 w-4" />Voltar</button>{step < 3 ? <button type="button" onClick={next} className="inline-flex h-10 items-center gap-2 bg-[#202522] px-5 text-sm font-semibold text-white hover:bg-[#2c6457]">Continuar<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={finish} disabled={saving} className="inline-flex h-10 items-center gap-2 bg-[#2c6457] px-5 text-sm font-semibold text-white hover:bg-[#225247] disabled:opacity-60">{saving ? "A criar loja..." : "Criar loja"}<Check className="h-4 w-4" /></button>}</div>
      </section>
    </div>
    <footer className="border-t border-[#dedbd2] bg-[#fffdf9] px-5 py-4 text-center font-mono text-[10px] text-[#979c95]">Pode alterar estes dados depois em Configurações.</footer>
  </main>;
}
