import { createClient } from "npm:@supabase/supabase-js@2";
import { companyWhatsAppToken, metaCredentials } from "../_shared/credentials.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const GRAPH_VERSION = "v25.0";
const LIMITS: Record<string, number> = {
  "image/jpeg": 5 * 1024 * 1024,
  "image/png": 5 * 1024 * 1024,
  "video/mp4": 16 * 1024 * 1024,
  "application/pdf": 100 * 1024 * 1024,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > 101 * 1024 * 1024) return json({ error: "O upload excede o limite máximo permitido." }, 413);
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Inicie sessão" }, 401);
    const userDb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userDb.auth.getUser();
    if (!user) return json({ error: "Inicie sessão" }, 401);

    const form = await req.formData();
    const companyId = String(form.get("company_id") ?? "");
    const file = form.get("file");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId)) {
      return json({ error: "Loja inválida" }, 400);
    }
    if (!(file instanceof File)) return json({ error: "Seleciona um ficheiro" }, 400);

    const { data: allowed, error: permissionError } = await userDb.rpc("is_company_admin", {
      _company: companyId,
      _user: user.id,
    });
    if (permissionError || !allowed) return json({ error: "Sem permissão para gerir o WhatsApp desta loja" }, 403);

    const mime = file.type.toLowerCase();
    const maxSize = LIMITS[mime];
    if (!maxSize) return json({ error: "Formato não suportado. Usa JPG, PNG, MP4 ou PDF." }, 415);
    if (file.size < 1 || file.size > maxSize) {
      const maxMb = Math.round(maxSize / 1024 / 1024);
      return json({ error: `O ficheiro excede o limite de ${maxMb} MB para este formato.` }, 413);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const startsWith = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
    const validSignature = mime === "image/jpeg" ? startsWith(0xff, 0xd8, 0xff)
      : mime === "image/png" ? startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
      : mime === "application/pdf" ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
      : mime === "video/mp4" ? new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp"
      : false;
    if (!validSignature) return json({ error: "O conteúdo do ficheiro não corresponde ao formato declarado." }, 415);

    const meta = await metaCredentials();
    const appId = meta.app_id;
    const token = await companyWhatsAppToken(companyId);
    if (!/^\d{5,30}$/.test(appId ?? "")) return json({ error: "O App ID da Meta não está configurado na Vendora." }, 503);
    if (!token) return json({ error: "Credenciais WhatsApp não configuradas" }, 503);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "template-media";
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const sessionUrl = new URL(`${base}/${encodeURIComponent(appId)}/uploads`);
    sessionUrl.searchParams.set("file_length", String(file.size));
    sessionUrl.searchParams.set("file_type", mime);
    sessionUrl.searchParams.set("file_name", safeName);

    const sessionResponse = await fetch(sessionUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const session = await sessionResponse.json().catch(() => ({}));
    const uploadId = session?.id;
    const validUploadId = typeof uploadId === "string" && /^upload:[A-Za-z0-9:_=-]+(?:\?sig=[A-Za-z0-9._~+=:-]+)?$/.test(uploadId);
    if (!sessionResponse.ok || !validUploadId) {
      console.error("Meta upload session failed", session?.error?.code ?? sessionResponse.status);
      return json({ error: session?.error?.message ?? "A Meta não conseguiu iniciar o carregamento.", meta_code: session?.error?.code ?? null, meta_subcode: session?.error?.error_subcode ?? null, meta_type: session?.error?.type ?? null }, 502);
    }

    // Preserve the optional signature query string returned with the Meta upload session.
    const uploadUrl = new URL(`${base}/${uploadId}`);
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${token}`,
        "file_offset": "0",
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
    });
    const uploaded = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok || typeof uploaded.h !== "string" || !uploaded.h) {
      console.error("Meta media transfer failed", uploaded?.error?.code ?? uploadResponse.status);
      return json({ error: uploaded?.error?.message ?? "A Meta não concluiu o carregamento do ficheiro.", meta_code: uploaded?.error?.code ?? null, meta_subcode: uploaded?.error?.error_subcode ?? null, meta_type: uploaded?.error?.type ?? null }, 502);
    }

    return json({ ok: true, header_handle: uploaded.h, file_name: safeName, mime_type: mime, size: file.size });
  } catch (error) {
    console.error("whatsapp-template-media-upload:", error instanceof Error ? error.message : "unknown");
    return json({ error: "Não foi possível carregar o ficheiro para a Meta." }, 500);
  }
});
