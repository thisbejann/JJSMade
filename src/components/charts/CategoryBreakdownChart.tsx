import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_CATEGORY_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { CATEGORY_CONFIG } from "../../lib/constants";
import { formatPHP } from "../../lib/formatters";

export function CategoryBreakdownChart() {
  const data = useQuery(api.analytics.getProfitByCategory);

  const chartData = (data ?? []).map((d) => ({
    name: CATEGORY_CONFIG[d.category as keyof typeof CATEGORY_CONFIG]?.label ?? d.category,
    value: d.profit,
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Profit by Category</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : chartData.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatPHP(value)} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#8a8a9a" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
