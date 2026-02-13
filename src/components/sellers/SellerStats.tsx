import { formatPHP } from "../../lib/formatters";
import { Card, CardContent } from "../ui/Card";

interface SellerStatsProps {
  totalItems: number;
  soldItems: number;
  totalProfit: number;
  avgProfit: number;
  totalSpent: number;
}

export function SellerStats({ totalItems, soldItems, totalProfit, avgProfit, totalSpent }: SellerStatsProps) {
  const stats = [
    { label: "Total Items", value: totalItems.toString() },
    { label: "Items Sold", value: soldItems.toString() },
    { label: "Total Spent", value: formatPHP(totalSpent) },
    { label: "Total Profit", value: formatPHP(totalProfit), color: "text-success" },
    { label: "Avg Profit", value: formatPHP(avgProfit) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-secondary mb-1">{stat.label}</p>
            <p className={`font-mono text-sm font-semibold ${stat.color ?? "text-primary"}`}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
