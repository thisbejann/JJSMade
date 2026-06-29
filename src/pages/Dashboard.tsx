import { useQuery } from "convex/react";
import { format } from "date-fns";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { StatusPipeline } from "../components/items/StatusPipeline";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { PendingQcSection } from "../components/dashboard/PendingQcSection";
import { Skeleton } from "../components/ui/Skeleton";
import { MetricTiles } from "../components/ui/MetricTiles";
import { formatPHP } from "../lib/formatters";

export default function Dashboard() {
  const stats = useQuery(api.analytics.getDashboardStats);
  const statusCounts = useQuery(api.items.getByStatus);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Hero band — date leads, then the coral profit number, with supporting
            metrics riding a hairline-divided tonal panel (no card chrome) */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-tertiary">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="flex items-center">
              {stats === undefined ? (
                <Skeleton className="h-14 w-56" />
              ) : (
                <div>
                  <p className="text-5xl font-bold tracking-tight text-accent tabular-nums">
                    {formatPHP(stats.profitThisMonth)}
                  </p>
                  <p className="mt-1.5 text-sm text-secondary">Profit this month</p>
                </div>
              )}
            </div>

            {stats === undefined ? (
              <Skeleton className="h-16 flex-1" />
            ) : (
              <MetricTiles
                className="flex-1 grid-cols-2 sm:grid-cols-4"
                metrics={[
                  { label: "Revenue", value: formatPHP(stats.revenueThisMonth) },
                  { label: "Avg profit", value: formatPHP(stats.avgProfitThisMonth) },
                  { label: "Sold", value: String(stats.soldThisMonth) },
                  { label: "In pipeline", value: String(stats.inPipeline) },
                ]}
              />
            )}
          </div>
        </div>

        {/* Pipeline */}
        {statusCounts === undefined ? (
          <Skeleton className="h-12" />
        ) : (
          <StatusPipeline statusCounts={statusCounts} />
        )}

        {/* Recent orders (borderless) + Pending QC (warm tonal panel) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <RecentOrders />
          <PendingQcSection />
        </div>
      </div>
    </PageContainer>
  );
}
