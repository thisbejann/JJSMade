import { STATUS_CONFIG, STATUS_FLOW, type ItemStatus } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface StatusTimelineProps {
  currentStatus: string;
}

const colorMap: Record<string, { text: string; dot: string; ring: string }> = {
  info: { text: "text-info", dot: "bg-info", ring: "ring-info/30" },
  warning: { text: "text-warning", dot: "bg-warning", ring: "ring-warning/30" },
  accent: { text: "text-accent", dot: "bg-accent", ring: "ring-accent/30" },
  success: { text: "text-success", dot: "bg-success", ring: "ring-success/30" },
  danger: { text: "text-danger", dot: "bg-danger", ring: "ring-danger/30" },
};

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const isTerminal = currentStatus === "refunded";
  const terminalStatus = isTerminal ? (currentStatus as ItemStatus) : null;
  const steps: ItemStatus[] = terminalStatus
    ? [...STATUS_FLOW, terminalStatus]
    : [...STATUS_FLOW];

  const currentIndex = terminalStatus
    ? steps.length - 1
    : STATUS_FLOW.indexOf(currentStatus as ItemStatus);

  const isStepCurrent = (index: number) => index === currentIndex;
  const isStepCompleted = (index: number) =>
    !isTerminal && currentIndex >= 0 && index < currentIndex;

  const connectorClass = (index: number) => {
    if (index >= steps.length - 1) return "";
    if (isTerminal) {
      return index === steps.length - 2 ? "bg-danger/70" : "bg-border-subtle";
    }
    return index < currentIndex ? "bg-accent/80" : "bg-border-subtle";
  };

  const gridStyle = { gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Dot section: tall dedicated zone with dots vertically centered within it */}
        <div className="flex items-center h-14">
          <div className="w-full grid" style={gridStyle}>
            {steps.map((status, index) => {
              const config = STATUS_CONFIG[status];
              const colors = colorMap[config.color];
              const isCurrent = isStepCurrent(index);
              const isCompleted = isStepCompleted(index);

              return (
                <div key={`dot-${status}-${index}`} className="relative flex justify-center items-center">
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-1/2 left-1/2 w-full h-px -translate-y-1/2",
                        connectorClass(index)
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 w-4 h-4 rounded-full transition-all flex-shrink-0",
                      isCurrent
                        ? `${colors.dot} ring-4 ${colors.ring}`
                        : isCompleted
                          ? "bg-accent"
                          : "bg-hover border border-border-default"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels: own section below, never affects dot positioning */}
        <div className="grid pb-1" style={gridStyle}>
          {steps.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const colors = colorMap[config.color];
            const isCurrent = isStepCurrent(index);
            const isCompleted = isStepCompleted(index);

            return (
              <div key={`label-${status}-${index}`} className="flex justify-center px-2">
                <span
                  className={cn(
                    "text-[11px] leading-tight text-center max-w-[90px]",
                    isCurrent
                      ? `font-semibold ${colors.text}`
                      : isCompleted
                        ? "font-medium text-secondary"
                        : "font-medium text-tertiary"
                  )}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
