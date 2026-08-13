import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { normalizeInstapayBranding } = require("../../controllers/siteSettingsController.js") as {
  normalizeInstapayBranding: (input?: Record<string, unknown>) => Record<string, unknown>;
};

describe("normalizeInstapayBranding", () => {
  it("normalizes destination type and trims InstaPay string fields", () => {
    const next = normalizeInstapayBranding({
      name: "Sawy Academy",
      instapayDestinationType: "bank",
      instapayAccountName: "  Mohamed El Sawy  ",
      instapayPhoneNumber: " 0100 000 0000 ",
      instapayBankName: "  CIB ",
      instapayBankAccountNumber: " 123 ",
      instapayBankAccountName: " Studio ",
      instapayInstructions: "  Include order email  ",
    });

    expect(next.instapayDestinationType).toBe("bank");
    expect(next.instapayAccountName).toBe("Mohamed El Sawy");
    expect(next.instapayPhoneNumber).toBe("0100 000 0000");
    expect(next.instapayBankName).toBe("CIB");
    expect(next.instapayBankAccountNumber).toBe("123");
    expect(next.instapayBankAccountName).toBe("Studio");
    expect(next.instapayInstructions).toBe("Include order email");
    expect(next.name).toBe("Sawy Academy");
  });

  it("falls back invalid destination types to phone", () => {
    const next = normalizeInstapayBranding({
      instapayDestinationType: "wallet",
    });
    expect(next.instapayDestinationType).toBe("phone");
  });
});
