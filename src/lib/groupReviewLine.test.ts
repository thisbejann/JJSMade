import { describe, expect, it } from "vitest";
import { groupItemFromLine, initialRow, rowComplete, type BundleLine } from "./groupReviewLine";

const shoeLine: BundleLine = {
  id: "shoe",
  category: "shoes",
  mode: "regular",
  priceCNY: 500,
  localShippingCNY: 10,
  quote: 4828,
  estimatedWeightKg: 1.3,
  weightClass: { shoeBuild: "regular", euSize: 43 },
  estimatedWeightTyped: false,
  td: null,
};

const watchLine: BundleLine = {
  id: "watch",
  category: "watches",
  mode: "regular",
  priceCNY: 2000,
  localShippingCNY: 0,
  quote: 18500,
  estimatedWeightKg: null,
  weightClass: {},
  estimatedWeightTyped: false,
  td: { name: "Noob Factory", insured: false },
};

describe("initialRow", () => {
  it("prefills a watch line's Trusted Dealer as its seller, with no size", () => {
    expect(initialRow(watchLine)).toEqual({ name: "", seller: "Noob Factory", size: "" });
  });

  it("prefills a shoe's EU size from the calculator and leaves its seller blank", () => {
    expect(initialRow(shoeLine)).toEqual({ name: "", seller: "", size: "43" });
  });
});

describe("rowComplete", () => {
  it("needs only a name on a watch line, because its TD is prefilled and it has no size", () => {
    expect(rowComplete(watchLine, initialRow(watchLine))).toBe(false);
    expect(rowComplete(watchLine, { ...initialRow(watchLine), name: "Submariner" })).toBe(true);
  });

  it("still needs a seller on a shoe line", () => {
    expect(rowComplete(shoeLine, { ...initialRow(shoeLine), name: "Dunk Low" })).toBe(false);
  });
});

describe("groupItemFromLine", () => {
  const settings = { cnyToPhpRate: 8, defaultForwarderRate: 400, forwarderBuyServiceRate: 9 };

  it("sends a watch's TD as its seller with its insurance choice, and no size or rates", () => {
    const row = { name: " Submariner ", seller: "Noob Factory", size: "" };
    const item = groupItemFromLine(watchLine, row, settings);

    expect(item).toMatchObject({
      name: "Submariner",
      category: "watches",
      seller: "Noob Factory",
      tdInsured: false,
      priceCNY: 2000,
      sellingPrice: 18500,
      isForwarderBuy: false,
      exchangeRateUsed: 8,
    });
    expect(item.size).toBeUndefined();
    expect(item).not.toHaveProperty("tdShippingCNY");
    expect(item).not.toHaveProperty("tdInsurancePct");
  });

  it("leaves tdInsured off a China-route line and keeps its size and estimate", () => {
    const row = { name: "Dunk Low", seller: "Verify Seller", size: "43" };
    const item = groupItemFromLine(shoeLine, row, settings);

    expect(item).toMatchObject({
      size: "43",
      seller: "Verify Seller",
      estimatedWeightKg: 1.3,
      shoeBuild: "regular",
    });
    expect(item.tdInsured).toBeUndefined();
  });
});
