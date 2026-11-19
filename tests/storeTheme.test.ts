import { expect, test } from "bun:test";
import { applyPreset, defaultTheme, moveSection, normalizeTheme, themeAccess } from "../src/lib/storeTheme";

test("Free só tem tema pronto, cores e logótipo", () => {
  expect(themeAccess(["marketing"])).toEqual({ sections: false, fonts: false, versions: false });
});
test("Básico desbloqueia secções e tipos de letra", () => {
  expect(themeAccess(["marketing", "analytics"])).toEqual({ sections: true, fonts: true, versions: false });
});
test("Pro guarda versões", () => {
  expect(themeAccess(["marketing", "analytics", "sales", "whatsapp"]).versions).toBe(true);
});
test("tema parcial ganha valores por defeito e todas as secções", () => {
  const t = normalizeTheme({ colors: { primary: "#ff0000" } });
  expect(t.colors.primary).toBe("#ff0000");
  expect(t.colors.background).toBe("#ffffff");
  expect(t.sections?.length).toBe(8);
});
test("imagem sem https é rejeitada e volta ao padrão", () => {
  expect(normalizeTheme({ brand: { displayName: "x", logoUrl: "http://a.com/x.png", tagline: "" } }).brand.logoUrl).toBe("");
});
test("modelo Tecnologia aplica fundo escuro", () => {
  expect(applyPreset(defaultTheme(), "tech").colors.background).toBe("#0e1116");
});
test("reordenar secções", () => {
  const s = defaultTheme().sections!;
  expect(moveSection(s, 1, -1)[0].id).toBe("categories");
});
