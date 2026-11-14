import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { whatsappConnectionLabel, whatsappConnectionState } from "@/lib/whatsappStatus";

export function useWhatsAppAccount(companyId?: string) {
  const query = useQuery({
    queryKey: ["whatsapp-account", companyId],
    enabled: !!companyId,
    refetchInterval: 10000,
    queryFn: async () => {
      if (!companyId) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase.from("whatsapp_accounts")
        .select("id,phone_number_id,waba_id,display_phone,status,auto_reply,last_event_at")
        .eq("company_id", companyId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const state = whatsappConnectionState(query.data ?? null, query.isLoading || !companyId, query.isError);
  return { ...query, state, label: whatsappConnectionLabel(state) };
}