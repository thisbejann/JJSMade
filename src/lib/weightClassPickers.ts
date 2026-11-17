import type { WeightClass, WeightClassField } from "./pricing";

// UI choices for the Weight Preset class pickers, shared by the Quote
// Calculator page and the item form's Price Calculator.

export type ClassChoice = Required<Pick<WeightClass, WeightClassField>>;

export const DEFAULT_CLASS_CHOICE: ClassChoice = {
  shoeBuild: "regular",
  clothingWeight: "light",
  bagSize: "large",
};

// The Weight Preset picker for each class field. CATEGORY_WEIGHT_CLASS says
// which one a category shows.
export const CLASS_PICKERS: {
  [F in WeightClassField]: { label: string; options: { value: ClassChoice[F]; label: string }[] };
} = {
  shoeBuild: {
    label: "Shoe build",
    options: [
      { value: "light", label: "Light" },
      { value: "regular", label: "Regular" },
      { value: "chunky", label: "Chunky" },
    ],
  },
  clothingWeight: {
    label: "Clothing weight",
    options: [
      { value: "light", label: "Light" },
      { value: "heavy", label: "Heavy" },
    ],
  },
  bagSize: {
    label: "Bag size",
    options: [
      { value: "small", label: "Small" },
      { value: "large", label: "Large" },
    ],
  },
};
