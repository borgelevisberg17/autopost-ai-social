export type GroupRules = { authorized: boolean; available: boolean; sales_enabled: boolean; marketing_enabled: boolean; call_word: string; timezone: string; start_hour: number; end_hour: number; weekdays: number[]; interval_minutes: number; last_inbound_at?: string | null; last_marketing_at?: string | null };
export function calledInGroup(text: string, word: string): boolean {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !!escaped && new RegExp(`(^|[\\s,;:])${escaped}(?=$|[\\s,;:!? .])`, "iu").test(text);
}
export function salesAllowed(group: GroupRules, text: string) {
  return group.authorized && group.available && group.sales_enabled && calledInGroup(text, group.call_word);
}
export function marketingAllowed(group: GroupRules, now = new Date()) {
  if (!group.authorized || !group.available || !group.marketing_enabled) return false;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: group.timezone, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find(p => p.type === "weekday")?.value ?? "");
  const hour = Number(parts.find(p => p.type === "hour")?.value);
  if (!group.weekdays.includes(day) || hour < group.start_hour || hour >= group.end_hour) return false;
  if (group.last_inbound_at && now.getTime() - Date.parse(group.last_inbound_at) < 15 * 60000) return false;
  return !group.last_marketing_at || now.getTime() - Date.parse(group.last_marketing_at) >= group.interval_minutes * 60000;
}
export type RankedProduct = { id: string; stock: number; active: boolean; created_at: string; promo_price: number | null; price: number; images: string[]; name: string; description?: string | null };
export function chooseGroupProduct(products: RankedProduct[], sold: Record<string, number>, recentIds: string[], now = new Date()) {
  const candidates = products.filter(p => p.active && p.stock > 0);
  const fresh = candidates.filter(p => !recentIds.includes(p.id));
  return (fresh.length ? fresh : candidates).sort((a,b) => {
    const score = (p: RankedProduct) => (sold[p.id] ?? 0) * 3 + (now.getTime() - Date.parse(p.created_at) < 7 * 86400000 ? 5 : 0) + (p.promo_price !== null ? 2 : 0);
    return score(b) - score(a) || Date.parse(b.created_at) - Date.parse(a.created_at);
  })[0] ?? null;
}