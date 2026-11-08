import { describe, expect, it } from "vitest";
import { categoryChoices } from "./constants";

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
