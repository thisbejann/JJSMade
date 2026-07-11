import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const REALIZED_STATUSES = new Set(["delivered_to_customer", "sold"]);

export function computeCustomerStats(items: { status: string; profit?: number; sellingPrice?: number }[]) {
  const orderCount = items.length;
  const soldItems = items.filter((i) => REALIZED_STATUSES.has(i.status));
  const totalProfit = soldItems.reduce((sum, i) => sum + (i.profit ?? 0), 0);
  const totalRevenue = soldItems.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);
  return {
    orderCount,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  };
}

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("customers").order("asc").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Customer name is required");
    return ctx.db.insert("customers", { name: trimmed, createdAt: Date.now() });
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const listWithStats = query({
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").order("asc").collect();
    return Promise.all(
      customers.map(async (customer) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_customerId", (q) => q.eq("customerId", customer._id))
          .collect();
        const stats = computeCustomerStats(items);
        return { ...customer, ...stats };
      })
    );
  },
});

export const getProfile = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const customer = await ctx.db.get(id);
    if (!customer) return null;

    const allItems = await ctx.db
      .query("items")
      .withIndex("by_customerId", (q) => q.eq("customerId", id))
      .collect();

    const groups = await ctx.db
      .query("orderGroups")
      .withIndex("by_customerId", (q) => q.eq("customerId", id))
      .collect();

    const groupIds = new Set(groups.map((g) => g._id));
    const soloItems = allItems.filter((i) => !i.orderGroupId || !groupIds.has(i.orderGroupId));

    // Each group carries a content-derived identity (preview names, count, value)
    // so a group with no note is still distinguishable in the UI. Query items by
    // the group index rather than filtering allItems — that's the authoritative
    // link, matching how orderGroups.ts resolves membership.
    const enrichedGroups = (
      await Promise.all(
        groups.map(async (group) => {
          const groupItems = await ctx.db
            .query("items")
            .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", group._id))
            .collect();
          const quotesSum = groupItems.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);
          const value = group.negotiatedTotal ?? quotesSum;
          return {
            ...group,
            itemCount: groupItems.length,
            previewNames: groupItems.slice(0, 3).map((i) => i.name),
            value: Math.round(value * 100) / 100,
          };
        })
      )
    ).sort((a, b) => b.createdAt - a.createdAt);

    const stats = computeCustomerStats(allItems);

    return { ...customer, ...stats, groups: enrichedGroups, soloItems };
  },
});

export const migrateCustomerNames = internalMutation({
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const nameToId = new Map<string, Id<"customers">>();

    for (const item of items) {
      if (item.customerId) continue;
      if (!item.customerName) continue;

      const name = item.customerName;
      if (!nameToId.has(name)) {
        const existing = await ctx.db
          .query("customers")
          .withIndex("by_name", (q) => q.eq("name", name))
          .first();
        const id = existing
          ? existing._id
          : await ctx.db.insert("customers", { name, createdAt: Date.now() });
        nameToId.set(name, id);
      }

      await ctx.db.patch(item._id, { customerId: nameToId.get(name) });
    }

    return { migrated: nameToId.size };
  },
});
