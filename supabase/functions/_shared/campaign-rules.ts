export type CampaignProduct = { name: string; price: number; promo_price: number | null };
export function channelFeature(channel: string): string[] {
  return channel === "whatsapp" ? ["whatsapp", "marketing"] : channel === "facebook" || channel === "instagram" || channel === "email" ? ["analytics", "marketing"] : ["marketing"];
}
export function stepWindowOpen(step: { start_hour: number; end_hour: number }, now: Date, tz = "Africa/Luanda"): boolean {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz }).format(now));
  return h >= step.start_hour && h < step.end_hour;
}
const money = (v: number, c: string) => `${Number(v).toLocaleString("pt-PT")} ${c}`;
export function buildStepContent(channel: string, company: { name: string; currency: string } | null, products: CampaignProduct[], url: string): string {
  const cur = company?.currency ?? "";
  const lines = products.slice(0, channel === "instagram" ? 1 : 3).map((p) => p.promo_price ? `• ${p.name} — ${money(p.promo_price, cur)} (antes ${money(p.price, cur)})` : `• ${p.name} — ${money(p.price, cur)}`);
  const name = company?.name ?? "a nossa loja";
  if (channel === "instagram") return `Novidade em ${name} ✨\n${lines.join("\n")}\n\nEncomende pelo link na bio.\n#${name.replace(/\W/g, "")} #novidades`;
  if (channel === "whatsapp") return `Olá! Temos disponível em ${name}:\n${lines.join("\n")}\n\nEncomende aqui: ${url}\nResponda SAIR para não receber mais.`;
  if (channel === "email") return `Assunto: Escolhas da semana em ${name}\n\n${lines.join("\n")}\n\nVer na loja: ${url}`;
  return `Disponível agora em ${name}:\n${lines.join("\n")}\n\nEncomende: ${url}`;
}
