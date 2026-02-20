import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { formatPHP } from "../../lib/formatters";

export function ProfitOverTimeChart() {
  const data = useQuery(api.analytics.getMonthlyProfitData);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Profit Over Time</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : data.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No sales data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
              <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number | string | undefined) => [formatPHP(Number(value ?? 0)), "Profit"]} />
              <Area type="monotone" dataKey="profit" stroke={CHART_COLORS.accent} strokeWidth={2} fill="url(#profitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
