import { STATUS_CONFIG, PERSONAL_STATUS_CONFIG } from "../../lib/constants";
import { Badge } from "../ui/Badge";

interface ItemStatusBadgeProps {
  status: string;
  className?: string;
}

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    ?? PERSONAL_STATUS_CONFIG[status as keyof typeof PERSONAL_STATUS_CONFIG]
    ?? { color: "tertiary", label: status };

  return (
    <Badge variant={config.color as "tertiary"} className={className}>
      {config.label}
    </Badge>
  );
}
