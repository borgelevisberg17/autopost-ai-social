import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"idle" | "done" | "invalid">("idle");
  const token = params.get("token") ?? "";
  async function confirm() {
    const { data, error } = await supabase.rpc("newsletter_unsubscribe", { _token: token });
    setState(!error && data ? "done" : "invalid");
  }
  return (
    <main className="mx-auto max-w-md p-8 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Cancelar newsletter</h1>
      {state === "idle" && <Button onClick={confirm} disabled={!token}>Confirmar cancelamento</Button>}
      {state === "done" && <p>Já não vai receber emails desta loja.</p>}
      {state === "invalid" && <p>Link inválido ou já utilizado.</p>}
    </main>
  );
}
