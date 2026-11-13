import { describe, expect, test } from "bun:test";
import { routeAllowed } from "../src/lib/planAccess";
describe("plan navigation", () => {
  test("Free cannot open WhatsApp or analysis", () => {
    const free = { features: ["marketing"], company_status: "active" };
    expect(routeAllowed("/admin/conversas", free)).toBe(false);
    expect(routeAllowed("/admin/analytics", free)).toBe(false);
    expect(routeAllowed("/admin/agentes", free)).toBe(true);
  });
  test("Básico has analysis but not WhatsApp", () => {
    const basic = { features: ["marketing", "analytics"], company_status: "active" };
    expect(routeAllowed("/admin/analytics", basic)).toBe(true);
    expect(routeAllowed("/admin/conversas", basic)).toBe(false);
  });
  test("Pro can open WhatsApp only while active", () => {
    expect(routeAllowed("/admin/conversas", { features: ["whatsapp"], company_status: "active" })).toBe(true);
    expect(routeAllowed("/admin/conversas", { features: ["whatsapp"], company_status: "suspended" })).toBe(false);
  });
});