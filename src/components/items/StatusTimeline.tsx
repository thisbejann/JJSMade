import { STATUS_CONFIG, STATUS_FLOW, type ItemStatus } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface StatusTimelineProps {
  currentStatus: string;
}

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  info: { bg: "bg-info", text: "text-info", ring: "ring-info/30" },
  warning: { bg: "bg-warning", text: "text-warning", ring: "ring-warning/30" },
  accent: { bg: "bg-accent", text: "text-accent", ring: "ring-accent/30" },
  success: { bg: "bg-success", text: "text-success", ring: "ring-success/30" },
  danger: { bg: "bg-danger", text: "text-danger", ring: "ring-danger/30" },
};

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const isTerminal = currentStatus === "cancelled" || currentStatus === "returned";
  const currentIndex = STATUS_FLOW.indexOf(currentStatus as ItemStatus);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {STATUS_FLOW.map((status, i) => {
        const config = STATUS_CONFIG[status];
        const colors = colorMap[config.color];
        const isCurrent = status === currentStatus;
        const isCompleted = !isTerminal && currentIndex > i;
        const isFuture = !isCurrent && !isCompleted;

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full transition-all shrink-0",
                  isCurrent && `${colors.bg} ring-4 ${colors.ring}`,
                  isCompleted && colors.bg,
                  isFuture && "bg-hover border border-border-default"
                )}
              />
              <span
                className={cn(
                  "text-[10px] text-center leading-tight font-medium",
                  isCurrent && colors.text,
                  isCompleted && "text-secondary",
                  isFuture && "text-tertiary"
                )}
              >
                {config.label}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 -mt-5 shrink-0",
                  isCompleted ? colors.bg : "bg-border-subtle"
                )}
              />
            )}
          </div>
        );
      })}

      {isTerminal && (
        <div className="flex items-center">
          <div className="h-px w-6 -mt-5 bg-danger shrink-0" />
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="w-3.5 h-3.5 rounded-full bg-danger ring-4 ring-danger/30" />
            <span className="text-[10px] text-center leading-tight font-medium text-danger">
              {STATUS_CONFIG[currentStatus as ItemStatus].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
