import type { ItemCategory } from "../../lib/constants";
import { shippingEstimateOptions, type ClassChoice } from "../../lib/weightClassPickers";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Segmented } from "../ui/Segmented";

// The Weight Preset class picker behind Estimated Shipping. Each option shows
// its preset kg, and the selected one shows what belongs in it. Shoes also take
// the EU size, since it picks the ≤ 42 / 43+ preset.
export function ShippingEstimatePicker({
  category,
  choice,
  onChange,
  euSizeStr,
  onEuSizeChange,
}: {
  category: ItemCategory;
  choice: ClassChoice;
  onChange: (choice: ClassChoice) => void;
  euSizeStr: string;
  onEuSizeChange: (euSizeStr: string) => void;
}) {
  const euSize = euSizeStr.trim() === "" ? undefined : Number(euSizeStr);
  const picker = shippingEstimateOptions(category, euSize);
  if (picker === null) return null;
  const { field, label, options } = picker;
  const selected = options.find((opt) => opt.value === choice[field]);

  return (
    // EU size sits beside the buttons when the container is wide enough, and
    // below the hint when it stacks, so the hint always stays under the buttons.
    <div className="@container">
      <div className={cn("grid gap-2", field === "shoeBuild" && "@md:grid-cols-[1fr_5.5rem] @md:gap-x-3 items-end")}>
        <Segmented
          label={`Shipping estimate · ${label}`}
          options={options.map((opt) => ({ value: opt.value, label: opt.label, detail: `${opt.kg.toFixed(1)} kg` }))}
          value={choice[field]}
          onChange={(value) => onChange({ ...choice, [field]: value })}
        />
        {field === "shoeBuild" && (
          <div className="order-2 mt-2 @md:order-none @md:mt-0">
            <Input
              label="EU size"
              type="number"
              value={euSizeStr}
              onChange={(e) => onEuSizeChange(e.target.value)}
              step="0.5"
              placeholder="43"
            />
          </div>
        )}
        {selected && (
          <p className={cn("order-1 text-[11px] text-tertiary @md:order-none", field === "shoeBuild" && "@md:col-span-2")}>
            {selected.hint}
          </p>
        )}
      </div>
    </div>
  );
}
