import { STATUS_CONFIG, type ItemStatus } from "../../lib/constants";
import { Badge } from "../ui/Badge";

interface ItemStatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { color: "tertiary", label: status };

  return (
    <Badge variant={config.color as "tertiary"} className={className}>
      {config.label}
    </Badge>
  );
}
