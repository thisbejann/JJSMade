import { describe, expect, it } from "vitest";
import type { ItemCategory } from "./constants";
import {
  DEFAULT_CLASS_CHOICE,
  recordedEstimate,
  sameEstimate,
  shippingEstimateOptions,
  storedClassChoice,
} from "./weightClassPickers";

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

describe("recordedEstimate", () => {
  it("records a Heavy clothes Item at 1.0 kg", () => {
    expect(recordedEstimate("clothes", { ...DEFAULT_CLASS_CHOICE, clothingWeight: "heavy" }, undefined)).toEqual({
      estimatedWeightKg: 1.0,
      clothingWeight: "heavy",
    });
  });

  it("records a shoe's build at the kg for its EU size", () => {
    const chunky = { ...DEFAULT_CLASS_CHOICE, shoeBuild: "chunky" as const };
    expect(recordedEstimate("shoes", chunky, 42)).toEqual({ estimatedWeightKg: 1.5, shoeBuild: "chunky" });
    expect(recordedEstimate("shoes", chunky, 44)).toEqual({ estimatedWeightKg: 1.7, shoeBuild: "chunky" });
  });

  it("records a bag's type, and 0.5 kg for accessories", () => {
    expect(recordedEstimate("bags", DEFAULT_CLASS_CHOICE, undefined)).toEqual({ estimatedWeightKg: 3.5, bagSize: "large" });
    expect(recordedEstimate("accessories", DEFAULT_CLASS_CHOICE, undefined)).toEqual({ estimatedWeightKg: 0.5 });
  });

  it("records nothing for a watch or an unpicked older Item", () => {
    expect(recordedEstimate("watches", DEFAULT_CLASS_CHOICE, undefined)).toBeNull();
    expect(recordedEstimate("clothes", null, undefined)).toBeNull();
    expect(recordedEstimate("accessories", null, undefined)).toBeNull();
  });
});

describe("storedClassChoice", () => {
  it("leaves the picker blank for an Item with no estimate", () => {
    expect(storedClassChoice({ clothingWeight: "heavy" })).toBeNull();
  });

  it("opens on the Item's recorded class", () => {
    expect(storedClassChoice({ estimatedWeightKg: 1.0, clothingWeight: "heavy" })).toEqual({
      ...DEFAULT_CLASS_CHOICE,
      clothingWeight: "heavy",
    });
  });
});

describe("sameEstimate", () => {
  it("compares kg and class", () => {
    const heavy = { estimatedWeightKg: 1.0, clothingWeight: "heavy" as const };
    expect(sameEstimate(heavy, { ...heavy })).toBe(true);
    expect(sameEstimate(heavy, { estimatedWeightKg: 0.5, clothingWeight: "light" })).toBe(false);
    expect(sameEstimate(null, null)).toBe(true);
    expect(sameEstimate(heavy, null)).toBe(false);
  });
});
