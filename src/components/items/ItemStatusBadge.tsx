import { STATUS_CONFIG, PERSONAL_STATUS_CONFIG } from "../../lib/constants";
import { Badge, type badgeVariants } from "../ui/Badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface ItemStatusBadgeProps {
  status: string;
  className?: string;
}

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    ?? PERSONAL_STATUS_CONFIG[status as keyof typeof PERSONAL_STATUS_CONFIG]
    ?? { color: "tertiary" as const, label: status };

  return (
    <Badge variant={config.color as BadgeVariant} className={className}>
      {config.label}
    </Badge>
  );
}
