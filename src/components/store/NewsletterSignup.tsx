import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterSignup({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("newsletter_subscribe", { _slug: slug, _email: email, _name: "" });
    if (error) return toast.error(error.message.includes("Email") ? "Email inválido" : "Não foi possível subscrever");
    setDone(true);
  }
  if (done) return <p className="text-sm">Subscrição confirmada. Pode cancelar a qualquer momento pelo link nos emails.</p>;
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <Input type="email" required maxLength={200} value={email} onChange={e => setEmail(e.target.value)} placeholder="O seu email para novidades" aria-label="Email para newsletter" />
      <Button type="submit">Subscrever</Button>
    </form>
  );
}
