import { QC_STATUS_CONFIG, type QcStatus } from "../../lib/constants";
import { Badge } from "../ui/Badge";

interface QcStatusBadgeProps {
  qcStatus: QcStatus;
  className?: string;
}

export function QcStatusBadge({ qcStatus, className }: QcStatusBadgeProps) {
  const config = QC_STATUS_CONFIG[qcStatus];

  return (
    <Badge variant={config.color} className={className}>
      {config.label}
    </Badge>
  );
}
