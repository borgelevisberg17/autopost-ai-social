export type WhatsAppAccountStatus = {
  id: string;
  phone_number_id: string;
  waba_id: string | null;
  display_phone: string | null;
  status: string;
  auto_reply: boolean;
  last_event_at: string | null;
};

export function whatsappConnectionState(account: WhatsAppAccountStatus | null, loading: boolean, failed: boolean) {
  if (loading) return "loading";
  if (failed) return "unknown";
  if (!account) return "disconnected";
  return account.status === "active" ? "active" : "associated";
}

export function whatsappConnectionLabel(state: ReturnType<typeof whatsappConnectionState>) {
  return {
    loading: "A verificar ligação…",
    unknown: "Não foi possível verificar a ligação",
    disconnected: "Número Business ainda não associado",
    associated: "Número associado · a aguardar mensagem da Meta",
    active: "Ativo",
  }[state];
}