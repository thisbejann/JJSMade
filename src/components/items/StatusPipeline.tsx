import { useNavigate } from "react-router";
import { STATUS_FLOW, STATUS_CONFIG } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface StatusPipelineProps {
  statusCounts: Record<string, number>;
}

const colorMap: Record<string, string> = {
  info: "bg-info/20 text-info border-info/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  accent: "bg-accent/20 text-accent border-accent/30",
  success: "bg-success/20 text-success border-success/30",
  danger: "bg-danger/20 text-danger border-danger/30",
};

export function StatusPipeline({ statusCounts }: StatusPipelineProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 overflow-x-auto p-2 -m-2">
      {STATUS_FLOW.map((status, i) => {
        const config = STATUS_CONFIG[status];
        const count = statusCounts[status] ?? 0;
        const colors = colorMap[config.color];

        return (
          <div key={status} className="flex items-center">
            <button
              onClick={() => navigate(`/orders?status=${status}`)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all hover:scale-105 cursor-pointer min-w-[90px]",
                colors
              )}
            >
              <span className="font-mono text-lg font-bold">{count}</span>
              <span className="text-[10px] font-medium whitespace-nowrap">
                {config.label}
              </span>
            </button>
            {i < STATUS_FLOW.length - 1 && (
              <div className="w-4 h-px bg-border-subtle shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
