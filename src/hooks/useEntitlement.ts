import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import type { Entitlement } from "@/components/admin/SubscriptionPanel";

export function useEntitlement() {
  const { company } = useCompany();
  return useQuery({
    queryKey: ["entitlement", company?.id],
    enabled: !!company,
    refetchInterval: 30000,
    queryFn: async () => {
      if (!company) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase.rpc("company_entitlement", { _company: company.id });
      if (error) throw error;
      return data as unknown as Entitlement;
    },
  });
}