import type { EstimateFields } from "../../convex/schema";
import type { ItemCategory } from "./constants";
import { CATEGORY_WEIGHT_CLASS, weightClassFor, weightPreset, type WeightClass, type WeightClassField } from "./pricing";

// The Weight Preset class pickers shared by the Quote Calculator page and the
// item form's Price Calculator: their choices, hints, and the kg each picks.

export type ClassChoice = Required<Pick<WeightClass, WeightClassField>>;

export const DEFAULT_CLASS_CHOICE: ClassChoice = {
  shoeBuild: "regular",
  clothingWeight: "light",
  bagSize: "large",
};

// The Weight Preset picker for each class field. CATEGORY_WEIGHT_CLASS says
// which one a category shows. Hints are the CONTEXT.md definitions, shortened.
export const CLASS_PICKERS: {
  [F in WeightClassField]: {
    label: string;
    options: { value: ClassChoice[F]; label: string; hint: string }[];
  };
} = {
  shoeBuild: {
    label: "Shoe build",
    options: [
      { value: "light", label: "Light", hint: "thin, airy running-type shoes" },
      { value: "regular", label: "Regular", hint: "low-profile everyday sneakers, e.g. Sambas, NB 530" },
      { value: "chunky", label: "Chunky", hint: "thick-soled or heavily padded, e.g. NB 9060, Kobe 6" },
    ],
  },
  clothingWeight: {
    label: "Clothing weight",
    options: [
      { value: "light", label: "Light", hint: "tees, shirts, polos, shorts" },
      { value: "heavy", label: "Heavy", hint: "knitwear, cardigans, jackets, sets" },
    ],
  },
  bagSize: {
    // The domain term is Bag Size, but "size" reads like the garment's S/M/L.
    label: "Bag type",
    options: [
      { value: "small", label: "Small", hint: "crossbody bags, minis, pouches, wallet-on-chain" },
      { value: "large", label: "Large", hint: "totes, backpacks, medium-or-bigger handbags" },
    ],
  },
};

/** A typed EU size, or undefined while the field is empty. */
export function parseEuSize(euSizeStr: string): number | undefined {
  return euSizeStr.trim() === "" ? undefined : Number(euSizeStr);
}

export interface ShippingEstimateOption {
  value: ClassChoice[WeightClassField];
  label: string;
  /** The Weight Preset this option picks, in kg. */
  kg: number;
  hint: string;
}

/**
 * The class picker a category shows, each option with the Weight Preset it
 * picks. Null when the category has no picker. Shoe kg follows the EU size.
 */
export function shippingEstimateOptions(
  category: ItemCategory,
  euSize: number | undefined
): { field: WeightClassField; label: string; options: ShippingEstimateOption[] } | null {
  const field = CATEGORY_WEIGHT_CLASS[category];
  if (field === null) return null;
  const picker = CLASS_PICKERS[field];
  return {
    field,
    label: picker.label,
    options: picker.options.map((opt) => {
      const kg = weightPreset(category, weightClassFor(category, { [field]: opt.value, euSize }));
      if (kg === null) throw new Error(`No Weight Preset for ${category}`);
      return { ...opt, kg };
    }),
  };
}

/** A Weight Preset estimate as an Item stores it. Only the category's own class field is set. */
export type PresetEstimate = Omit<EstimateFields, "estimatedWeightKg" | "estimatedWeightTyped"> & {
  estimatedWeightKg: number;
};

/**
 * The estimate an Item form saves. Null when there is none to save: a watch,
 * or an Item whose class was never picked (choice null).
 */
export function presetEstimate(
  category: ItemCategory,
  choice: ClassChoice | null,
  euSize: number | undefined
): PresetEstimate | null {
  if (choice === null) return null;
  const weightClass = weightClassFor(category, { ...choice, euSize });
  const kg = weightPreset(category, weightClass);
  if (kg === null) return null;
  const { shoeBuild, clothingWeight, bagSize } = weightClass;
  return { estimatedWeightKg: kg, shoeBuild, clothingWeight, bagSize };
}

/**
 * The class an Item opens its picker with. Null leaves the picker blank: the
 * Item has no estimate, or a typed weight that no class describes.
 */
export function storedClassChoice(item: EstimateFields): ClassChoice | null {
  if (item.estimatedWeightKg == null || item.estimatedWeightTyped) return null;
  return {
    shoeBuild: item.shoeBuild ?? DEFAULT_CLASS_CHOICE.shoeBuild,
    clothingWeight: item.clothingWeight ?? DEFAULT_CLASS_CHOICE.clothingWeight,
    bagSize: item.bagSize ?? DEFAULT_CLASS_CHOICE.bagSize,
  };
}

export function sameEstimate(a: PresetEstimate | null, b: PresetEstimate | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.estimatedWeightKg === b.estimatedWeightKg &&
    a.shoeBuild === b.shoeBuild &&
    a.clothingWeight === b.clothingWeight &&
    a.bagSize === b.bagSize
  );
}
