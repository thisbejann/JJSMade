import { lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { StatCard } from "../components/dashboard/StatCard";
import { Skeleton } from "../components/ui/Skeleton";
import { formatPHP } from "../lib/formatters";
import { DollarSign, TrendingUp, ShoppingBag, Target, Award, Star } from "lucide-react";

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
        {/* All-time stat cards */}
        {stats === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Total Revenue" value={stats.totalRevenue} format={formatPHP} icon={<DollarSign size={20} />} />
            <StatCard label="Total Profit" value={stats.totalProfit} format={formatPHP} icon={<TrendingUp size={20} />} />
            <StatCard label="Items Sold" value={stats.totalSold} icon={<ShoppingBag size={20} />} />
            <StatCard label="Avg Profit/Item" value={stats.avgProfit} format={formatPHP} icon={<Target size={20} />} />
            <StatCard
              label="Best Month"
              value={stats.bestMonth?.profit ?? 0}
              format={formatPHP}
              icon={<Award size={20} />}
              trend={stats.bestMonth?.month}
            />
            <StatCard
              label="Best Seller"
              value={stats.bestSeller?.profit ?? 0}
              format={formatPHP}
              icon={<Star size={20} />}
              trend={stats.bestSeller?.seller}
            />
          </div>
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
