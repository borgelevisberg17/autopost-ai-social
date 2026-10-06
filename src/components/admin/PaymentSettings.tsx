import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaymentSettings({ companyId }: { companyId: string }) {
  const [f, setF] = useState({ payment_iban: "", payment_iban_holder: "", payment_express_number: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("payment_iban,payment_iban_holder,payment_express_number").eq("id", companyId).maybeSingle()
      .then(({ data }) => data && setF({
        payment_iban: data.payment_iban ?? "", payment_iban_holder: data.payment_iban_holder ?? "",
        payment_express_number: data.payment_express_number ?? "",
      }));
  }, [companyId]);

  const save = async () => {
    const iban = f.payment_iban.replace(/\s+/g, " ").trim().toUpperCase();
    if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9 ]{10,40}$/.test(iban)) return toast.error("IBAN inválido.");
    const express = f.payment_express_number.trim();
    if (express && !/^\+?[\d ]{6,20}$/.test(express)) return toast.error("Número Express inválido.");
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      payment_iban: iban || null, payment_iban_holder: f.payment_iban_holder.trim().slice(0, 120) || null,
      payment_express_number: express || null,
    }).eq("id", companyId);
    setSaving(false);
    if (error) toast.error("Só administradores podem alterar."); else toast.success("Dados de pagamento guardados");
  };

  return (
    <div className="col-span-full rounded border border-border bg-card p-4">
      <p className="font-semibold">Pagamentos da loja</p>
      <p className="mt-1 text-sm text-muted-foreground">Os clientes veem estes dados depois de comprar e enviam o comprovativo. Deixe vazio o que não usa.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Input placeholder="IBAN, ex. AO06 0000 ..." value={f.payment_iban} onChange={(e) => setF({ ...f, payment_iban: e.target.value })} />
        <Input placeholder="Titular da conta" value={f.payment_iban_holder} onChange={(e) => setF({ ...f, payment_iban_holder: e.target.value })} />
        <Input placeholder="Número Multicaixa Express" value={f.payment_express_number} onChange={(e) => setF({ ...f, payment_express_number: e.target.value })} />
      </div>
      <Button className="mt-3" onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar pagamentos</Button>
    </div>
  );
}
