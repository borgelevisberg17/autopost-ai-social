// Orders this browser placed, so customers can reopen them without typing a code.
const KEY = "vendora.myOrders";
type Saved = { slug: string; id: string; at: number };

export function getMyOrders(slug: string): Saved[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Saved[];
    return all.filter((o) => o.slug === slug).sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export function rememberOrder(slug: string, id: string) {
  try {
    const all = (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Saved[]).filter((o) => o.id !== id);
    all.push({ slug, id, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-30)));
  } catch { /* storage unavailable */ }
}
