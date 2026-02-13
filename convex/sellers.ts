import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    platform: v.optional(v.union(v.literal("weidian"), v.literal("taobao"), v.literal("1688"), v.literal("yupoo"), v.literal("direct"))),
    contactInfo: v.optional(v.string()),
    storeLink: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("sellers", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("sellers"),
    name: v.optional(v.string()),
    platform: v.optional(v.union(v.literal("weidian"), v.literal("taobao"), v.literal("1688"), v.literal("yupoo"), v.literal("direct"))),
    contactInfo: v.optional(v.string()),
    storeLink: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("sellers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const sellers = await ctx.db.query("sellers").order("desc").collect();
    const items = await ctx.db.query("items").collect();

    let filtered = sellers;
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = sellers.filter(
        (seller) =>
          seller.name.toLowerCase().includes(s) ||
          (seller.contactInfo && seller.contactInfo.toLowerCase().includes(s))
      );
    }

    return filtered.map((seller) => {
      const sellerItems = items.filter((i) => i.seller === seller.name);
      const soldItems = sellerItems.filter((i) => i.status === "sold");
      const totalProfit = soldItems.reduce((sum, i) => sum + (i.profit ?? 0), 0);
      const avgProfit = soldItems.length > 0 ? totalProfit / soldItems.length : 0;

      return {
        ...seller,
        totalItems: sellerItems.length,
        soldItems: soldItems.length,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgProfit: Math.round(avgProfit * 100) / 100,
      };
    });
  },
});

export const getById = query({
  args: { id: v.id("sellers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
