import { HugeiconsIcon } from "@hugeicons/react";
import { CATEGORY_CONFIG, type ItemCategory } from "../../lib/constants";
import { CATEGORY_ICONS } from "./categoryIcons";
import { cn } from "../../lib/utils";

interface CategoryIconProps {
  category: ItemCategory;
  className?: string;
}

/**
 * Icon-only category indicator. Used in dense list rows where a labelled
 * CategoryBadge would force a wide `whitespace-nowrap` element that crushes
 * the item name on narrow screens. The full label is preserved for a11y via
 * `title` / `aria-label`.
 */
export function CategoryIcon({ category, className }: CategoryIconProps) {
  const config = CATEGORY_CONFIG[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      title={config.label}
      aria-label={config.label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-secondary",
        className
      )}
    >
      <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />
    </span>
  );
}
