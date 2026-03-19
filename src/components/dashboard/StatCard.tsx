import { Card } from "../ui/Card";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: ReactNode;
  trend?: string;
}

export function StatCard({ label, value, format, icon, trend }: StatCardProps) {
  const formatted = format ? format(value) : Math.round(value).toString();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-secondary font-medium mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-primary truncate">{formatted}</p>
          {trend && <p className="text-xs text-success mt-1 truncate">{trend}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center text-accent shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}
