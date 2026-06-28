import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { StatusPipeline } from "../components/items/StatusPipeline";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { PendingQcSection } from "../components/dashboard/PendingQcSection";
import { Skeleton } from "../components/ui/Skeleton";
import { formatPHP } from "../lib/formatters";


export default function Dashboard() {
  const stats = useQuery(api.analytics.getDashboardStats);
  const statusCounts = useQuery(api.items.getByStatus);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <h1 className="text-lg font-semibold text-primary">Dashboard</h1>

        {/* Key Metrics — no cards, no icons, typography does the work */}
        {stats === undefined ? (
          <div className="flex gap-8 sm:gap-10">
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        ) : (
          <div className="flex items-baseline gap-8 sm:gap-10">
            <div>
              <p className="text-3xl font-bold text-accent tracking-tight">
                {formatPHP(stats.profitThisMonth)}
              </p>
              <p className="text-sm text-secondary mt-1.5">Profit this month</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-primary">
                {formatPHP(stats.avgProfitThisMonth)}
              </p>
              <p className="text-xs text-tertiary mt-1">Avg profit</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-primary tabular-nums">
                {stats.inPipeline}
              </p>
              <p className="text-xs text-tertiary mt-1">In pipeline</p>
            </div>
          </div>
        )}

        {/* Pipeline */}
        {statusCounts === undefined ? (
          <Skeleton className="h-16" />
        ) : (
          <StatusPipeline statusCounts={statusCounts} />
        )}

        {/* Recent Orders + Pending QC */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <RecentOrders />
          <PendingQcSection />
        </div>
      </div>
    </PageContainer>
  );
}
