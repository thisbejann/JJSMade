import { lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { MetricTiles } from "../components/ui/MetricTiles";
import { Skeleton } from "../components/ui/Skeleton";
import { formatPHP } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { DollarCircleIcon, ArrowUpRight01Icon, ShoppingBag01Icon, Target01Icon, Award01Icon, StarIcon } from "@hugeicons/core-free-icons";

const ProfitOverTimeChart = lazy(() => import("../components/charts/ProfitOverTimeChart").then(m => ({ default: m.ProfitOverTimeChart })));
const RevenueCostProfitChart = lazy(() => import("../components/charts/RevenueCostProfitChart").then(m => ({ default: m.RevenueCostProfitChart })));
const CategoryBreakdownChart = lazy(() => import("../components/charts/CategoryBreakdownChart").then(m => ({ default: m.CategoryBreakdownChart })));
const TopSellersChart = lazy(() => import("../components/charts/TopSellersChart").then(m => ({ default: m.TopSellersChart })));
const TopBatchesChart = lazy(() => import("../components/charts/TopBatchesChart").then(m => ({ default: m.TopBatchesChart })));
const CostDistributionChart = lazy(() => import("../components/charts/CostDistributionChart").then(m => ({ default: m.CostDistributionChart })));
const ItemsSoldChart = lazy(() => import("../components/charts/ItemsSoldChart").then(m => ({ default: m.ItemsSoldChart })));
const ProfitDistributionChart = lazy(() => import("../components/charts/ProfitDistributionChart").then(m => ({ default: m.ProfitDistributionChart })));
const CumulativeProfitChart = lazy(() => import("../components/charts/CumulativeProfitChart").then(m => ({ default: m.CumulativeProfitChart })));
const TopCustomersChart = lazy(() => import("../components/charts/TopCustomersChart").then(m => ({ default: m.TopCustomersChart })));

function ChartSkeleton() {
  return <Skeleton className="h-80" />;
}

export default function Analytics() {
  const stats = useQuery(api.analytics.getAllTimeStats);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* All-time metrics — one tonal tile panel instead of 6 separate cards */}
        {stats === undefined ? (
          <Skeleton className="h-28 rounded-3xl sm:h-40 xl:h-24" />
        ) : (
          <MetricTiles
            className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
            metrics={[
              { label: "Total Revenue", value: formatPHP(stats.totalRevenue), icon: <HugeiconsIcon icon={DollarCircleIcon} size={20} strokeWidth={1.5} /> },
              { label: "Total Profit", value: formatPHP(stats.totalProfit), icon: <HugeiconsIcon icon={ArrowUpRight01Icon} size={20} strokeWidth={1.5} /> },
              { label: "Items Sold", value: String(stats.totalSold), icon: <HugeiconsIcon icon={ShoppingBag01Icon} size={20} strokeWidth={1.5} /> },
              { label: "Avg Profit/Item", value: formatPHP(stats.avgProfit), icon: <HugeiconsIcon icon={Target01Icon} size={20} strokeWidth={1.5} /> },
              { label: "Best Month", value: formatPHP(stats.bestMonth?.profit ?? 0), sublabel: stats.bestMonth?.month, icon: <HugeiconsIcon icon={Award01Icon} size={20} strokeWidth={1.5} /> },
              { label: "Best Seller", value: formatPHP(stats.bestSeller?.profit ?? 0), sublabel: stats.bestSeller?.seller, icon: <HugeiconsIcon icon={StarIcon} size={20} strokeWidth={1.5} /> },
            ]}
          />
        )}

        {/* Tier 1 — Performance Trends */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-primary">Performance Trends</h2>
          <div className="space-y-6">
            <Suspense fallback={<ChartSkeleton />}><ProfitOverTimeChart height={400} /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><RevenueCostProfitChart height={400} /></Suspense>
          </div>
        </section>

        {/* Tier 2 — Business Mix */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-primary">Business Mix</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<ChartSkeleton />}><CumulativeProfitChart /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><ItemsSoldChart /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><CategoryBreakdownChart /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><CostDistributionChart /></Suspense>
          </div>
        </section>

        {/* Tier 3 — Leaderboards */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-primary">Leaderboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}><TopSellersChart /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><TopBatchesChart /></Suspense>
            <Suspense fallback={<ChartSkeleton />}><TopCustomersChart /></Suspense>
          </div>
          <Suspense fallback={<ChartSkeleton />}><ProfitDistributionChart /></Suspense>
        </section>
      </div>
    </PageContainer>
  );
}
