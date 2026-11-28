import { describe, expect, it } from "vitest";
import type { ItemCategory } from "./constants";
import { shippingEstimateOptions } from "./weightClassPickers";

const kgByValue = (category: ItemCategory, euSize?: number) =>
  Object.fromEntries(shippingEstimateOptions(category, euSize)!.options.map((o) => [o.value, o.kg]));

describe("shippingEstimateOptions", () => {
  it("shows each shoe build's kg for the EU size range", () => {
    expect(kgByValue("shoes", 42)).toEqual({ light: 0.8, regular: 1.1, chunky: 1.5 });
    expect(kgByValue("shoes", 43)).toEqual({ light: 0.9, regular: 1.2, chunky: 1.7 });
    // No size leans heavy, as the quote does.
    expect(kgByValue("shoes")).toEqual(kgByValue("shoes", 43));
  });

  it("shows clothing and bag kg", () => {
    expect(kgByValue("clothes")).toEqual({ light: 0.5, heavy: 1.0 });
    expect(kgByValue("bags")).toEqual({ small: 1.5, large: 3.5 });
  });

  it("labels bags as Bag type", () => {
    expect(shippingEstimateOptions("bags", undefined)!.label).toBe("Bag type");
  });

  it("gives every option a hint", () => {
    for (const category of ["shoes", "clothes", "bags"] as const) {
      for (const opt of shippingEstimateOptions(category, undefined)!.options) {
        expect(opt.hint).not.toBe("");
      }
    }
  });

  it("has no picker for categories without a class", () => {
    expect(shippingEstimateOptions("watches", undefined)).toBeNull();
    expect(shippingEstimateOptions("accessories", undefined)).toBeNull();
  });
});
