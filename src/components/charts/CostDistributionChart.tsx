import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_CATEGORY_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { formatPHP } from "../../lib/formatters";

export function CostDistributionChart() {
  const data = useQuery(api.analytics.getCostBreakdown);

  const chartData = data
    ? [
        { name: "Item Price", value: data.itemPrice },
        { name: "Local Shipping", value: data.localShipping },
        { name: "Forwarder Fee", value: data.forwarderFee },
        { name: "Lalamove", value: data.lalamoveFee },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Avg Cost Breakdown</h2>
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
              <Tooltip {...chartTooltipStyle} formatter={(value: number | string | undefined) => formatPHP(Number(value ?? 0))} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#8a8a9a" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
