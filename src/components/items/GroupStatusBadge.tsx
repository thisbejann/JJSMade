import { GROUP_STATUS_CONFIG } from "../../lib/constants";
import { Badge, type badgeVariants } from "../ui/Badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface GroupStatusBadgeProps {
  status: string;
  className?: string;
}

/** Group-order equivalent of ItemStatusBadge — semantic Badge variants only. */
export function GroupStatusBadge({ status, className }: GroupStatusBadgeProps) {
  const config = GROUP_STATUS_CONFIG[status as keyof typeof GROUP_STATUS_CONFIG]
    ?? { color: "tertiary" as const, label: status };

  return (
    <Badge variant={config.color as BadgeVariant} className={className}>
      {config.label}
    </Badge>
  );
}
