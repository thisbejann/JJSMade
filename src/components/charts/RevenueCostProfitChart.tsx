import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { formatPHP } from "../../lib/formatters";

export function RevenueCostProfitChart() {
  const data = useQuery(api.analytics.getMonthlyProfitData);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Revenue vs Cost vs Profit</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : data.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
              <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [formatPHP(value), name]} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#8a8a9a" }} />
              <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.info} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Cost" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
