import { metaCredentials, readCredentials } from "./credentials.ts";
export async function zapiRequest(credentials: Record<string,string>, path: string, method = "GET", body?: unknown) {
  if (!credentials.instance_id || !credentials.token || !credentials.client_token) throw new Error("Configure a ligação Z-API da empresa.");
  const response = await fetch(`https://api.z-api.io/instances/${encodeURIComponent(credentials.instance_id)}/token/${encodeURIComponent(credentials.token)}/${path}`, {
    method, headers: { "Client-Token": credentials.client_token, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Z-API recusou o pedido (${response.status}). Confirme a instância, a autorização e o saldo.`);
  return result;
}
export async function metaGroupRequest(phoneId: string, after?: string) {
  const credentials = await metaCredentials();
  if (!credentials.access_token) throw new Error("Configure a aplicação Meta na plataforma.");
  const url = new URL(`https://graph.facebook.com/v26.0/${encodeURIComponent(phoneId)}/groups`);
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${credentials.access_token}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`A Meta recusou acesso a grupos (${response.status}). Requer conta oficial elegível; grupos comuns não estão disponíveis nesta ligação.`);
  return await response.json();
}
export type GroupTarget = { provider: string; company_id: string; account_ref: string; external_id: string };
export async function sendGroupMessage(group: GroupTarget, text: string, image?: string) {
  if (group.provider === "zapi") {
    const credentials = await readCredentials(group.company_id, "zapi");
    if (!credentials || credentials.instance_id !== group.account_ref) throw new Error("A ligação deste grupo foi alterada. Sincronize novamente.");
    const result = await zapiRequest(credentials, image ? "send-image" : "send-text", "POST", image ? { phone: group.external_id, image, caption: text } : { phone: group.external_id, message: text });
    const id = result?.messageId ?? result?.id;
    if (!id) throw new Error("O fornecedor não confirmou o envio. Verifique antes de repetir.");
    return String(id);
  }
  const credentials = await metaCredentials();
  if (!credentials.access_token) throw new Error("Meta não configurada.");
  const response = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(group.account_ref)}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${credentials.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "group", to: group.external_id, type: image ? "image" : "text", ...(image ? { image: { link: image, caption: text } } : { text: { body: text } }) }), signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`A Meta recusou o envio (${response.status}). Verifique a autorização e a elegibilidade do grupo.`);
  const result = await response.json();
  if (!result.messages?.[0]?.id) throw new Error("A Meta não confirmou o envio. Verifique antes de repetir.");
  return String(result.messages[0].id);
}