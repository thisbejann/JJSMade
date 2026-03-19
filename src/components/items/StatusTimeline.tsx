import { STATUS_CONFIG, STATUS_FLOW, type ItemStatus } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface StatusTimelineProps {
  currentStatus: string;
}

const colorMap: Record<string, { text: string; dot: string; ring: string; bg: string }> = {
  info: { text: "text-info", dot: "bg-info", ring: "ring-info/30", bg: "bg-info/10" },
  warning: { text: "text-warning", dot: "bg-warning", ring: "ring-warning/30", bg: "bg-warning/10" },
  accent: { text: "text-accent", dot: "bg-accent", ring: "ring-accent/30", bg: "bg-accent/10" },
  success: { text: "text-success", dot: "bg-success", ring: "ring-success/30", bg: "bg-success/10" },
  danger: { text: "text-danger", dot: "bg-danger", ring: "ring-danger/30", bg: "bg-danger/10" },
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
    <>
      {/* Desktop: horizontal timeline */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[600px]">
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

      {/* Mobile: vertical stepper */}
      <div className="md:hidden flex flex-col gap-0">
        {steps.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const colors = colorMap[config.color];
          const isCurrent = isStepCurrent(index);
          const isCompleted = isStepCompleted(index);

          return (
            <div key={`mobile-${status}-${index}`} className="flex items-stretch gap-3">
              {/* Dot + connector column */}
              <div className="flex flex-col items-center w-6">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full shrink-0 mt-1",
                    isCurrent
                      ? `${colors.dot} ring-3 ${colors.ring}`
                      : isCompleted
                        ? "bg-accent"
                        : "bg-hover border border-border-default"
                  )}
                />
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 my-1",
                      connectorClass(index)
                    )}
                  />
                )}
              </div>
              {/* Label */}
              <div
                className={cn(
                  "pb-3 text-sm",
                  isCurrent
                    ? `font-semibold ${colors.text}`
                    : isCompleted
                      ? "font-medium text-secondary"
                      : "text-tertiary"
                )}
              >
                {config.label}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
