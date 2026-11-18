import { expect, test } from "bun:test";
import { parseEmbeddedSignupMessage } from "../src/lib/facebookSdk";
test("aceita número escolhido vindo do Facebook", () => {
  expect(parseEmbeddedSignupMessage("https://www.facebook.com", JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { waba_id: "111", phone_number_id: "222" } }))).toEqual({ waba_id: "111", phone_number_id: "222" });
});
test("ignora mensagens de outros sites", () => {
  expect(parseEmbeddedSignupMessage("https://evil.com", { type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { waba_id: "1", phone_number_id: "2" } })).toBeNull();
});
test("cancelamento é reconhecido", () => {
  expect(parseEmbeddedSignupMessage("https://web.facebook.com", { type: "WA_EMBEDDED_SIGNUP", event: "CANCEL" })).toBe("cancelled");
});
