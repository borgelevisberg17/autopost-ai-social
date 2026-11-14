// Orders this browser placed, so customers can reopen them without typing a code.
const KEY = "vendora.myOrders";
const ITEMS_KEY = "vendora.cachedOrderItems";

export type CachedOrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  image?: string;
  size?: string;
  color?: string;
};

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

export function saveOrderItems(orderId: string, items: CachedOrderItem[]) {
  try {
    const all = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? "{}") as Record<string, CachedOrderItem[]>;
    all[orderId] = items;
    const keys = Object.keys(all);
    if (keys.length > 30) {
      delete all[keys[0]];
    }
    localStorage.setItem(ITEMS_KEY, JSON.stringify(all));
  } catch { /* storage unavailable */ }
}

export function getCachedOrderItems(orderId: string): CachedOrderItem[] {
  try {
    const all = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? "{}") as Record<string, CachedOrderItem[]>;
    return all[orderId] ?? [];
  } catch {
    return [];
  }
}
