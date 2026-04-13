import { useNavigate } from "react-router";
import { STATUS_FLOW, STATUS_CONFIG } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface StatusPipelineProps {
  statusCounts: Record<string, number>;
}

const activeColorMap: Record<string, string> = {
  info: "text-info",
  warning: "text-warning",
  accent: "text-accent",
  success: "text-success",
  danger: "text-danger",
};

const activeBgMap: Record<string, string> = {
  info: "bg-info/8 hover:bg-info/15",
  warning: "bg-warning/8 hover:bg-warning/15",
  accent: "bg-accent/8 hover:bg-accent/15",
  success: "bg-success/8 hover:bg-success/15",
  danger: "bg-danger/8 hover:bg-danger/15",
};

export function StatusPipeline({ statusCounts }: StatusPipelineProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STATUS_FLOW.map((status, i) => {
        const config = STATUS_CONFIG[status];
        const count = statusCounts[status] ?? 0;
        const hasItems = count > 0;

        return (
          <div key={status} className="flex items-center">
            <button
              onClick={() => navigate(`/orders?status=${status}`)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-colors cursor-pointer",
                hasItems
                  ? activeBgMap[config.color]
                  : "hover:bg-hover opacity-40"
              )}
            >
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  hasItems ? activeColorMap[config.color] : "text-tertiary"
                )}
              >
                {count}
              </span>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  hasItems ? "text-secondary" : "text-tertiary"
                )}
              >
                {config.label}
              </span>
            </button>
            {i < STATUS_FLOW.length - 1 && (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                strokeWidth={1.5}
                className="text-border-strong shrink-0 mx-0.5"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
