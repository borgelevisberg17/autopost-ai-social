import { createClient } from "npm:@supabase/supabase-js@2";

export function serviceDb() {
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Serviço indisponível");
  return createClient(url, key);
}
const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(""));
const decode = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
async function encryptionKey() {
  const secret = Deno.env.get("VENDORA_CREDENTIAL_ENCRYPTION_KEY");
  if (!secret) throw new Error("Proteção de credenciais indisponível");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptCredentials(value: Record<string, string>, scope: string, provider: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(`${scope}:${provider}`) }, await encryptionKey(), new TextEncoder().encode(JSON.stringify(value)));
  return `${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}
export async function readCredentials(scope: string, provider: string): Promise<Record<string, string> | null> {
  const { data, error } = await serviceDb().from("integration_credentials").select("ciphertext").eq("scope_key", scope).eq("provider", provider).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a ligação");
  if (!data) return null;
  const [iv, encrypted] = data.ciphertext.split(".");
  const raw = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(iv), additionalData: new TextEncoder().encode(`${scope}:${provider}`) }, await encryptionKey(), decode(encrypted));
  return JSON.parse(new TextDecoder().decode(raw));
}
export async function metaCredentials() {
  const saved = await readCredentials("platform", "meta");
  const defaults = { access_token: Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "", app_secret: Deno.env.get("WHATSAPP_APP_SECRET") ?? "", verify_token: Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "", app_id: "" };
  return { ...defaults, ...Object.fromEntries(Object.entries(saved ?? {}).filter(([, value]) => value.trim() !== "")) };
}