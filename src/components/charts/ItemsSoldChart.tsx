import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, chartTooltipStyle } from "../../lib/chartTheme";

export function ItemsSoldChart() {
  const data = useQuery(api.analytics.getItemsSoldByMonth);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Items Sold Per Month</h2>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-[300px]" />
        ) : data.length === 0 ? (
          <p className="text-center text-secondary py-12 text-sm">No sales yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
              <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" name="Items Sold" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
