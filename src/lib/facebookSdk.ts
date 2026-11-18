type FBLoginResponse = { authResponse?: { code?: string } | null; status?: string };
type FB = { init: (o: Record<string, unknown>) => void; login: (cb: (r: FBLoginResponse) => void, o: Record<string, unknown>) => void };
declare global { interface Window { FB?: FB; fbAsyncInit?: () => void } }

let loading: Promise<FB> | null = null;
export function loadFacebookSdk(appId: string): Promise<FB> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => { window.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v21.0" }); resolve(window.FB!); };
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/pt_PT/sdk.js"; s.async = true; s.crossOrigin = "anonymous";
    s.onerror = () => { loading = null; reject(new Error("Não foi possível abrir o Facebook. Verifique bloqueadores de anúncios.")); };
    document.body.appendChild(s);
  });
  return loading;
}

/** Parses the Embedded Signup postMessage that carries the chosen WABA and phone number. */
export function parseEmbeddedSignupMessage(origin: string, data: unknown): { waba_id: string; phone_number_id: string } | "cancelled" | null {
  if (!/^https:\/\/([a-z]+\.)?facebook\.com$/.test(origin)) return null;
  try {
    const msg = typeof data === "string" ? JSON.parse(data) : data;
    if (msg?.type !== "WA_EMBEDDED_SIGNUP") return null;
    if (msg.event === "FINISH" || msg.event === "FINISH_ONLY_WABA") return msg.data?.phone_number_id ? { waba_id: String(msg.data.waba_id), phone_number_id: String(msg.data.phone_number_id) } : null;
    if (msg.event === "CANCEL") return "cancelled";
  } catch { /* not ours */ }
  return null;
}
