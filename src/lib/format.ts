export const CURRENCIES = [
  { code: "AOA", label: "Kwanza (Kz)" },
  { code: "BRL", label: "Real (R$)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "Dólar (US$)" },
  { code: "MZN", label: "Metical (MT)" },
  { code: "CVE", label: "Escudo (CVE)" },
];

export function formatMoney(value: number | string | null | undefined, currency = "AOA") {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export const ORDER_STATUS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}
