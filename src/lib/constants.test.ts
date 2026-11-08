import { describe, expect, it } from "vitest";
import { categoryChoices, personalCategoryChoices } from "./constants";

describe("categoryChoices", () => {
  it("offers a new Item every current category but not the legacy one", () => {
    expect(categoryChoices()).toEqual(["shoes", "clothes", "watches", "accessories", "bags"]);
  });

  it("offers the same set when editing an Item in a current category", () => {
    expect(categoryChoices("bags")).toEqual(["shoes", "clothes", "watches", "accessories", "bags"]);
  });

  it("keeps a legacy Item's own category so it can stay or be reclassified", () => {
    expect(categoryChoices("watches_accessories")).toEqual([
      "shoes",
      "clothes",
      "watches",
      "accessories",
      "bags",
      "watches_accessories",
    ]);
  });
});

describe("personalCategoryChoices", () => {
  it("doesn't offer Watches to a new Personal Item", () => {
    expect(personalCategoryChoices()).toEqual(["shoes", "clothes", "accessories", "bags"]);
  });

  it("doesn't offer Watches when editing a Personal Item in another category", () => {
    expect(personalCategoryChoices("bags")).toEqual(["shoes", "clothes", "accessories", "bags"]);
  });

  it("keeps Watches for a Personal Item that already has it", () => {
    expect(personalCategoryChoices("watches")).toEqual([
      "shoes",
      "clothes",
      "watches",
      "accessories",
      "bags",
    ]);
  });

  it("still keeps a legacy Personal Item's own category", () => {
    expect(personalCategoryChoices("watches_accessories")).toEqual([
      "shoes",
      "clothes",
      "accessories",
      "bags",
      "watches_accessories",
    ]);
  });
});
