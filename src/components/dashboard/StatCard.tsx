import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: ReactNode;
  trend?: string;
}

export function StatCard({ label, value, format, icon, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 600;
    const start = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatted = format ? format(Math.round(displayValue * 100) / 100) : Math.round(displayValue).toString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start justify-between relative">
          <div>
            <p className="text-xs text-secondary font-medium mb-1">{label}</p>
            <p className="font-mono text-2xl font-bold text-primary">{formatted}</p>
            {trend && <p className="text-xs text-success mt-1">{trend}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
