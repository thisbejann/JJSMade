import { describe, it, expect } from "vitest";
import { validateItemRules } from "./personalItems";

describe("Personal Item rules", () => {
  it("rejects a Watch, which has no China-route cost", () => {
    expect(() => validateItemRules({ category: "watches", isForwarderBuy: false })).toThrow(
      "Watches can't be Personal Items"
    );
  });

  it("accepts a China-route category", () => {
    expect(() => validateItemRules({ category: "bags", isForwarderBuy: false })).not.toThrow();
  });
});
