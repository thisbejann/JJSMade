import { HugeiconsIcon } from "@hugeicons/react";
import { CATEGORY_CONFIG, type ItemCategory } from "../../lib/constants";
import { CATEGORY_ICONS } from "./categoryIcons";
import { Badge } from "../ui/Badge";

interface CategoryBadgeProps {
  category: ItemCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <Badge variant="default" className={className}>
      <HugeiconsIcon icon={icon} size={12} strokeWidth={1.5} />
      {config.label}
    </Badge>
  );
}
