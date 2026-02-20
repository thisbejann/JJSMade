import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { formatPHP, formatDateShort } from "../../lib/formatters";

export function CumulativeProfitChart() {
  const data = useQuery(api.analytics.getCumulativeProfitData);

  const chartData = (data ?? []).map((d) => ({
    ...d,
    dateLabel: formatDateShort(d.date),
  }));

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Cumulative Profit</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : chartData.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="dateLabel" stroke={CHART_COLORS.text} fontSize={11} tickLine={false} />
              <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number | string | undefined) => [formatPHP(Number(value ?? 0)), "Cumulative Profit"]} labelFormatter={(label) => label} />
              <Line type="monotone" dataKey="profit" stroke={CHART_COLORS.success} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
