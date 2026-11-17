import { describe, expect, test } from "bun:test";
import { buildStepContent, channelFeature, stepWindowOpen } from "../supabase/functions/_shared/campaign-rules.ts";
import { routeAllowed } from "../src/lib/planAccess";

describe("campanhas", () => {
  test("WhatsApp exige plano com whatsapp (Pro)", () => {
    expect(channelFeature("whatsapp")).toEqual(["whatsapp", "marketing"]);
  });
  test("Facebook/Instagram/email exigem Básico (analytics+marketing)", () => {
    expect(channelFeature("instagram")).toEqual(["analytics", "marketing"]);
    expect(channelFeature("email")).toEqual(["analytics", "marketing"]);
  });
  test("Free acede à página Campanhas para rascunhos", () => {
    expect(routeAllowed("/admin/campanhas", { features: ["marketing"], company_status: "active" })).toBe(true);
  });
  test("fora do horário não envia", () => {
    expect(stepWindowOpen({ start_hour: 8, end_hour: 21 }, new Date("2026-11-16T02:00:00Z"))).toBe(false);
    expect(stepWindowOpen({ start_hour: 8, end_hour: 21 }, new Date("2026-11-16T12:00:00Z"))).toBe(true);
  });
  test("texto usa preço real e inclui saída no WhatsApp", () => {
    const t = buildStepContent("whatsapp", { name: "Loja", currency: "AOA" }, [{ name: "Saia", price: 5000, promo_price: null }], "https://x/loja/l");
    expect(t).toContain("Saia");
    expect(t).toContain("SAIR");
  });
});
