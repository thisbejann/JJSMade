import { query } from "./_generated/server";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const soldItems = items.filter((i) => i.status === "sold");
    const soldThisMonth = soldItems.filter(
      (i) => i.soldDate && i.soldDate >= startOfMonth
    );
    const inPipeline = items.filter(
      (i) => i.status !== "sold" && i.status !== "cancelled" && i.status !== "returned"
    );

    const revenueThisMonth = soldThisMonth.reduce(
      (sum, i) => sum + (i.sellingPrice ?? 0),
      0
    );
    const profitThisMonth = soldThisMonth.reduce(
      (sum, i) => sum + (i.profit ?? 0),
      0
    );
    const avgProfitThisMonth =
      soldThisMonth.length > 0 ? profitThisMonth / soldThisMonth.length : 0;

    return {
      totalItems: items.length,
      inPipeline: inPipeline.length,
      soldThisMonth: soldThisMonth.length,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      profitThisMonth: Math.round(profitThisMonth * 100) / 100,
      avgProfitThisMonth: Math.round(avgProfitThisMonth * 100) / 100,
    };
  },
});

export const getMonthlyProfitData = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold" && i.soldDate);

    const monthly: Record<string, { revenue: number; cost: number; profit: number; count: number }> = {};

    for (const item of soldItems) {
      const date = new Date(item.soldDate!);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { revenue: 0, cost: 0, profit: 0, count: 0 };
      monthly[key].revenue += item.sellingPrice ?? 0;
      monthly[key].cost += item.totalCost ?? 0;
      monthly[key].profit += item.profit ?? 0;
      monthly[key].count += 1;
    }

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
      }));
  },
});

export const getProfitByCategory = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold");

    const byCategory: Record<string, { profit: number; count: number; revenue: number }> = {};

    for (const item of soldItems) {
      if (!byCategory[item.category]) byCategory[item.category] = { profit: 0, count: 0, revenue: 0 };
      byCategory[item.category].profit += item.profit ?? 0;
      byCategory[item.category].count += 1;
      byCategory[item.category].revenue += item.sellingPrice ?? 0;
    }

    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    }));
  },
});

export const getProfitBySeller = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold");

    const bySeller: Record<string, { profit: number; count: number; revenue: number }> = {};

    for (const item of soldItems) {
      if (!bySeller[item.seller]) bySeller[item.seller] = { profit: 0, count: 0, revenue: 0 };
      bySeller[item.seller].profit += item.profit ?? 0;
      bySeller[item.seller].count += 1;
      bySeller[item.seller].revenue += item.sellingPrice ?? 0;
    }

    return Object.entries(bySeller)
      .map(([seller, data]) => ({ seller, ...data }))
      .sort((a, b) => b.profit - a.profit);
  },
});

export const getCostBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold");

    if (soldItems.length === 0) {
      return {
        itemPrice: 0,
        localShipping: 0,
        forwarderFee: 0,
        forwarderBuyFee: 0,
        qcServiceFee: 0,
        lalamoveFee: 0,
      };
    }

    const totals = soldItems.reduce(
      (acc, item) => ({
        itemPrice: acc.itemPrice + (item.pricePHP ?? 0),
        localShipping: acc.localShipping + (item.localShippingPHP ?? 0),
        forwarderFee: acc.forwarderFee + (item.forwarderFee ?? 0),
        forwarderBuyFee: acc.forwarderBuyFee + (item.forwarderBuyFeePHP ?? 0),
        qcServiceFee: acc.qcServiceFee + (item.qcServiceFeePHP ?? 0),
        lalamoveFee: acc.lalamoveFee + (item.lalamoveFee ?? 0),
      }),
      {
        itemPrice: 0,
        localShipping: 0,
        forwarderFee: 0,
        forwarderBuyFee: 0,
        qcServiceFee: 0,
        lalamoveFee: 0,
      }
    );

    const count = soldItems.length;
    return {
      itemPrice: Math.round((totals.itemPrice / count) * 100) / 100,
      localShipping: Math.round((totals.localShipping / count) * 100) / 100,
      forwarderFee: Math.round((totals.forwarderFee / count) * 100) / 100,
      forwarderBuyFee:
        Math.round((totals.forwarderBuyFee / count) * 100) / 100,
      qcServiceFee: Math.round((totals.qcServiceFee / count) * 100) / 100,
      lalamoveFee: Math.round((totals.lalamoveFee / count) * 100) / 100,
    };
  },
});

export const getTopBatches = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold" && i.batch);

    const byBatch: Record<string, { profit: number; count: number }> = {};

    for (const item of soldItems) {
      const batch = item.batch!;
      if (!byBatch[batch]) byBatch[batch] = { profit: 0, count: 0 };
      byBatch[batch].profit += item.profit ?? 0;
      byBatch[batch].count += 1;
    }

    return Object.entries(byBatch)
      .map(([batch, data]) => ({ batch, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  },
});

export const getTopCustomers = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold" && i.customerName);

    const byCustomer: Record<string, { totalSpent: number; count: number }> = {};

    for (const item of soldItems) {
      const name = item.customerName!;
      if (!byCustomer[name]) byCustomer[name] = { totalSpent: 0, count: 0 };
      byCustomer[name].totalSpent += item.sellingPrice ?? 0;
      byCustomer[name].count += 1;
    }

    return Object.entries(byCustomer)
      .map(([customer, data]) => ({ customer, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  },
});

export const getProfitDistribution = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold" && i.profit != null);

    const buckets: Record<string, number> = {};
    const bucketSize = 100;

    for (const item of soldItems) {
      const profit = item.profit!;
      const bucketStart = Math.floor(profit / bucketSize) * bucketSize;
      const key = `${bucketStart}-${bucketStart + bucketSize}`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }

    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aStart = parseInt(a.range.split("-")[0]);
        const bStart = parseInt(b.range.split("-")[0]);
        return aStart - bStart;
      });
  },
});

export const getCumulativeProfitData = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items
      .filter((i) => i.status === "sold" && i.soldDate && i.profit != null)
      .sort((a, b) => a.soldDate! - b.soldDate!);

    let cumulative = 0;
    return soldItems.map((item) => {
      cumulative += item.profit!;
      return {
        date: item.soldDate!,
        profit: Math.round(cumulative * 100) / 100,
        itemName: item.name,
      };
    });
  },
});

export const getItemsSoldByMonth = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold" && i.soldDate);

    const monthly: Record<string, number> = {};

    for (const item of soldItems) {
      const date = new Date(item.soldDate!);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthly[key] = (monthly[key] ?? 0) + 1;
    }

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  },
});

export const getAllTimeStats = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const soldItems = items.filter((i) => i.status === "sold");

    const totalRevenue = soldItems.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);
    const totalProfit = soldItems.reduce((sum, i) => sum + (i.profit ?? 0), 0);
    const avgProfit = soldItems.length > 0 ? totalProfit / soldItems.length : 0;

    // Best month
    const monthlyProfit: Record<string, number> = {};
    for (const item of soldItems) {
      if (!item.soldDate) continue;
      const date = new Date(item.soldDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyProfit[key] = (monthlyProfit[key] ?? 0) + (item.profit ?? 0);
    }
    const bestMonth = Object.entries(monthlyProfit).sort(([, a], [, b]) => b - a)[0];

    // Best seller
    const sellerProfit: Record<string, number> = {};
    for (const item of soldItems) {
      sellerProfit[item.seller] = (sellerProfit[item.seller] ?? 0) + (item.profit ?? 0);
    }
    const bestSeller = Object.entries(sellerProfit).sort(([, a], [, b]) => b - a)[0];

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalSold: soldItems.length,
      avgProfit: Math.round(avgProfit * 100) / 100,
      bestMonth: bestMonth ? { month: bestMonth[0], profit: Math.round(bestMonth[1] * 100) / 100 } : null,
      bestSeller: bestSeller ? { seller: bestSeller[0], profit: Math.round(bestSeller[1] * 100) / 100 } : null,
    };
  },
});
