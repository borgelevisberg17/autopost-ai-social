import { describe, expect, test } from "bun:test";
import { whatsappConnectionState, type WhatsAppAccountStatus } from "../src/lib/whatsappStatus";

const account: WhatsAppAccountStatus = { id: "1", phone_number_id: "12345", waba_id: "54321", display_phone: "+244900000000", status: "pending", auto_reply: true, last_event_at: null };
describe("WhatsApp connection evidence", () => {
  test("a saved Business number is associated even without a contact phone or inbound event", () => {
    expect(whatsappConnectionState(account, false, false)).toBe("associated");
  });
  test("loading and failed reads never mean disconnected", () => {
    expect(whatsappConnectionState(null, true, false)).toBe("loading");
    expect(whatsappConnectionState(null, false, true)).toBe("unknown");
  });
  test("active and missing accounts are distinguished", () => {
    expect(whatsappConnectionState({ ...account, status: "active" }, false, false)).toBe("active");
    expect(whatsappConnectionState(null, false, false)).toBe("disconnected");
  });
});