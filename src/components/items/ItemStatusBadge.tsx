import { STATUS_CONFIG, type ItemStatus } from "../../lib/constants";
import { Badge } from "../ui/Badge";

interface ItemStatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.color} className={className}>
      {config.label}
    </Badge>
  );
}
