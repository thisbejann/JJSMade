import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";

export function ProfitDistributionChart() {
  const data = useQuery(api.analytics.getProfitDistribution);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Profit Distribution</h2>
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
              <XAxis dataKey="range" stroke={CHART_COLORS.text} fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" name="Items" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
