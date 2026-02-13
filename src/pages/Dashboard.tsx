import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { StatCard } from "../components/dashboard/StatCard";
import { StatusPipeline } from "../components/items/StatusPipeline";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { PendingQcSection } from "../components/dashboard/PendingQcSection";
import { ProfitOverTimeChart } from "../components/charts/ProfitOverTimeChart";
import { CategoryBreakdownChart } from "../components/charts/CategoryBreakdownChart";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { formatPHP } from "../lib/formatters";
import { Package, TrendingUp, DollarSign, ShoppingBag, BarChart3, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = useQuery(api.analytics.getDashboardStats);
  const statusCounts = useQuery(api.items.getByStatus);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Stat Cards */}
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
            <StatCard label="Total Items" value={stats.totalItems} icon={<Package size={20} />} />
            <StatCard label="In Pipeline" value={stats.inPipeline} icon={<TrendingUp size={20} />} />
            <StatCard label="Sold This Month" value={stats.soldThisMonth} icon={<ShoppingBag size={20} />} />
            <StatCard label="Revenue (Month)" value={stats.revenueThisMonth} format={formatPHP} icon={<DollarSign size={20} />} />
            <StatCard label="Profit (Month)" value={stats.profitThisMonth} format={formatPHP} icon={<BarChart3 size={20} />} />
            <StatCard label="Avg Profit" value={stats.avgProfitThisMonth} format={formatPHP} icon={<Target size={20} />} />
          </motion.div>
        )}

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-sm text-primary">Pipeline Overview</h2>
          </CardHeader>
          <CardContent>
            {statusCounts === undefined ? (
              <Skeleton className="h-20" />
            ) : (
              <StatusPipeline statusCounts={statusCounts} />
            )}
          </CardContent>
        </Card>

        {/* Charts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <ProfitOverTimeChart />
            <CategoryBreakdownChart />
          </div>
          <div className="space-y-6">
            <RecentOrders />
            <PendingQcSection />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
