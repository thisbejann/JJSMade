import { formatPHP } from "../../lib/formatters";
import { MetricTiles } from "../ui/MetricTiles";

interface SellerStatsProps {
  totalItems: number;
  soldItems: number;
  totalProfit: number;
  avgProfit: number;
  totalSpent: number;
}

export function SellerStats({ totalItems, soldItems, totalProfit, avgProfit, totalSpent }: SellerStatsProps) {
  return (
    <MetricTiles
      className="grid-cols-2 sm:grid-cols-5"
      metrics={[
        { label: "Total Items", value: totalItems.toString() },
        { label: "Items Delivered", value: soldItems.toString() },
        { label: "Total Spent", value: formatPHP(totalSpent) },
        { label: "Total Profit", value: formatPHP(totalProfit), valueClassName: "text-success" },
        { label: "Avg Profit", value: formatPHP(avgProfit) },
      ]}
    />
  );
}
