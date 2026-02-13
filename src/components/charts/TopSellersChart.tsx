import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";
import { formatPHP } from "../../lib/formatters";

export function TopSellersChart() {
  const data = useQuery(api.analytics.getProfitBySeller);
  const top10 = (data ?? []).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Top Sellers by Profit</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : top10.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis type="number" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="seller" stroke={CHART_COLORS.text} fontSize={11} tickLine={false} width={100} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => [formatPHP(value), "Profit"]} />
              <Bar dataKey="profit" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
