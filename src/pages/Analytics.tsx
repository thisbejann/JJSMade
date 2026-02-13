import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { StatCard } from "../components/dashboard/StatCard";
import { ProfitOverTimeChart } from "../components/charts/ProfitOverTimeChart";
import { RevenueCostProfitChart } from "../components/charts/RevenueCostProfitChart";
import { CategoryBreakdownChart } from "../components/charts/CategoryBreakdownChart";
import { TopSellersChart } from "../components/charts/TopSellersChart";
import { TopBatchesChart } from "../components/charts/TopBatchesChart";
import { CostDistributionChart } from "../components/charts/CostDistributionChart";
import { ItemsSoldChart } from "../components/charts/ItemsSoldChart";
import { ProfitDistributionChart } from "../components/charts/ProfitDistributionChart";
import { CumulativeProfitChart } from "../components/charts/CumulativeProfitChart";
import { TopCustomersChart } from "../components/charts/TopCustomersChart";
import { Skeleton } from "../components/ui/Skeleton";
import { formatPHP } from "../lib/formatters";
import { DollarSign, TrendingUp, ShoppingBag, Target, Award, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Analytics() {
  const stats = useQuery(api.analytics.getAllTimeStats);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* All-time stat cards */}
        {stats === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
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
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfitOverTimeChart />
          <RevenueCostProfitChart />
          <CategoryBreakdownChart />
          <TopSellersChart />
          <TopBatchesChart />
          <CostDistributionChart />
          <ItemsSoldChart />
          <ProfitDistributionChart />
          <CumulativeProfitChart />
          <TopCustomersChart />
        </div>
      </div>
    </PageContainer>
  );
}
