import { HugeiconsIcon } from "@hugeicons/react";
import { RunningShoesIcon, Shirt01Icon, Watch01Icon } from "@hugeicons/core-free-icons";
import { CATEGORY_CONFIG, type ItemCategory } from "../../lib/constants";
import { Badge } from "../ui/Badge";

const iconMap = {
  shoes: RunningShoesIcon,
  clothes: Shirt01Icon,
  watches_accessories: Watch01Icon,
} as const;

interface CategoryBadgeProps {
  category: ItemCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const icon = iconMap[category];

  return (
    <Badge variant="default" className={className}>
      <HugeiconsIcon icon={icon} size={12} strokeWidth={1.5} />
      {config.label}
    </Badge>
  );
}
