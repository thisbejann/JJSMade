import { Footprints, Shirt, Watch } from "lucide-react";
import { CATEGORY_CONFIG, type ItemCategory } from "../../lib/constants";
import { Badge } from "../ui/Badge";

const iconMap = {
  shoes: Footprints,
  clothes: Shirt,
  watches_accessories: Watch,
} as const;

interface CategoryBadgeProps {
  category: ItemCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = iconMap[category];

  return (
    <Badge variant="default" className={className}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
