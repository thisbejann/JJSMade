import { describe, it, expect } from "vitest";
import { validateSellerInput } from "./sellers";

describe("validateSellerInput", () => {
  it("rejects a TD without a shipping fee", () => {
    expect(() =>
      validateSellerInput({ name: "Ken", platform: "td", tdInsurancePct: 10 }, [])
    ).toThrow("TD shipping fee is required");
  });

  it("rejects a TD without an insurance rate", () => {
    expect(() =>
      validateSellerInput({ name: "Ken", platform: "td", tdShippingCNY: 250 }, [])
    ).toThrow("TD insurance % is required");
  });

  it("rejects negative TD rates", () => {
    expect(() =>
      validateSellerInput({ name: "Ken", platform: "td", tdShippingCNY: -1, tdInsurancePct: 10 }, [])
    ).toThrow("TD shipping fee must be 0 or higher");
    expect(() =>
      validateSellerInput({ name: "Ken", platform: "td", tdShippingCNY: 250, tdInsurancePct: -5 }, [])
    ).toThrow("TD insurance % must be 0 or higher");
  });

  it("rejects a non-numeric TD rate", () => {
    expect(() =>
      validateSellerInput({ name: "Ken", platform: "td", tdShippingCNY: NaN, tdInsurancePct: 10 }, [])
    ).toThrow("TD shipping fee must be 0 or higher");
  });

  it("rejects a TD whose name matches an existing TD, ignoring case and spaces", () => {
    expect(() =>
      validateSellerInput(
        { name: "  ken watches ", platform: "td", tdShippingCNY: 250, tdInsurancePct: 10 },
        ["Ken Watches"]
      )
    ).toThrow('A TD named "ken watches" already exists');
  });

  it("does not check names for a non-TD seller", () => {
    expect(validateSellerInput({ name: "Ken Watches", platform: "weidian" }, ["Ken Watches"]).name).toBe(
      "Ken Watches"
    );
  });

  it("rejects an empty name", () => {
    expect(() => validateSellerInput({ name: "   ", platform: "weidian" }, [])).toThrow(
      "Seller name is required"
    );
  });

  it("returns a TD with a trimmed name and its rates", () => {
    expect(
      validateSellerInput({ name: " Ken ", platform: "td", tdShippingCNY: 0, tdInsurancePct: 10 }, ["Bob"])
    ).toEqual({ name: "Ken", platform: "td", tdShippingCNY: 0, tdInsurancePct: 10 });
  });

  it("drops TD rates from a seller that is not a TD", () => {
    expect(
      validateSellerInput({ name: "Shop", platform: "taobao", tdShippingCNY: 250, tdInsurancePct: 10 }, [])
    ).toEqual({ name: "Shop", platform: "taobao", tdShippingCNY: undefined, tdInsurancePct: undefined });
  });
});
