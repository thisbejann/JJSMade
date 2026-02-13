import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { computeDerivedFields } from "./helpers";

// ── Mutations ──

export const create = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("shoes"), v.literal("clothes"), v.literal("watches_accessories")),
    imageUrl: v.optional(v.string()),
    seller: v.string(),
    sellerContact: v.optional(v.string()),
    batch: v.optional(v.string()),
    priceCNY: v.number(),
    exchangeRateUsed: v.number(),
    hasLocalShipping: v.boolean(),
    localShippingCNY: v.optional(v.number()),
    qcPhotoIds: v.optional(v.array(v.id("_storage"))),
    qcStatus: v.union(v.literal("not_received"), v.literal("pending_review"), v.literal("gl"), v.literal("rl")),
    weightKg: v.optional(v.number()),
    isBranded: v.boolean(),
    forwarderRatePerKg: v.number(),
    sellingPrice: v.optional(v.number()),
    lalamoveFee: v.optional(v.number()),
    customerName: v.optional(v.string()),
    status: v.union(
      v.literal("ordered"), v.literal("shipped_to_warehouse"), v.literal("at_cn_warehouse"),
      v.literal("shipped_to_ph"), v.literal("at_ph_warehouse"), v.literal("delivered_to_me"),
      v.literal("sold"), v.literal("cancelled"), v.literal("returned")
    ),
    notes: v.optional(v.string()),
    orderDate: v.number(),
  },
  handler: async (ctx, args) => {
    const derived = computeDerivedFields({
      priceCNY: args.priceCNY,
      exchangeRateUsed: args.exchangeRateUsed,
      hasLocalShipping: args.hasLocalShipping,
      localShippingCNY: args.localShippingCNY,
      weightKg: args.weightKg,
      forwarderRatePerKg: args.forwarderRatePerKg,
      lalamoveFee: args.lalamoveFee,
      sellingPrice: args.sellingPrice,
    });

    const now = Date.now();
    const id = await ctx.db.insert("items", {
      ...args,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      totalCost: derived.totalCost,
      profit: derived.profit,
      soldDate: args.status === "sold" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal("shoes"), v.literal("clothes"), v.literal("watches_accessories"))),
    imageUrl: v.optional(v.string()),
    seller: v.optional(v.string()),
    sellerContact: v.optional(v.string()),
    batch: v.optional(v.string()),
    priceCNY: v.optional(v.number()),
    exchangeRateUsed: v.optional(v.number()),
    hasLocalShipping: v.optional(v.boolean()),
    localShippingCNY: v.optional(v.number()),
    qcPhotoIds: v.optional(v.array(v.id("_storage"))),
    qcStatus: v.optional(v.union(v.literal("not_received"), v.literal("pending_review"), v.literal("gl"), v.literal("rl"))),
    weightKg: v.optional(v.number()),
    isBranded: v.optional(v.boolean()),
    forwarderRatePerKg: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    lalamoveFee: v.optional(v.number()),
    customerName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("ordered"), v.literal("shipped_to_warehouse"), v.literal("at_cn_warehouse"),
      v.literal("shipped_to_ph"), v.literal("at_ph_warehouse"), v.literal("delivered_to_me"),
      v.literal("sold"), v.literal("cancelled"), v.literal("returned")
    )),
    notes: v.optional(v.string()),
    orderDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item not found");

    const merged = { ...existing, ...updates };
    const derived = computeDerivedFields({
      priceCNY: merged.priceCNY,
      exchangeRateUsed: merged.exchangeRateUsed,
      hasLocalShipping: merged.hasLocalShipping,
      localShippingCNY: merged.localShippingCNY,
      weightKg: merged.weightKg,
      forwarderRatePerKg: merged.forwarderRatePerKg,
      lalamoveFee: merged.lalamoveFee,
      sellingPrice: merged.sellingPrice,
    });

    const now = Date.now();
    const soldDate =
      updates.status === "sold" && existing.status !== "sold"
        ? now
        : existing.soldDate;

    await ctx.db.patch(id, {
      ...updates,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      totalCost: derived.totalCost,
      profit: derived.profit,
      soldDate,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("items"),
    status: v.union(
      v.literal("ordered"), v.literal("shipped_to_warehouse"), v.literal("at_cn_warehouse"),
      v.literal("shipped_to_ph"), v.literal("at_ph_warehouse"), v.literal("delivered_to_me"),
      v.literal("sold"), v.literal("cancelled"), v.literal("returned")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Item not found");

    const now = Date.now();
    const soldDate =
      args.status === "sold" && existing.status !== "sold" ? now : existing.soldDate;

    await ctx.db.patch(args.id, {
      status: args.status,
      soldDate,
      updatedAt: now,
    });
  },
});

export const updateQcStatus = mutation({
  args: {
    id: v.id("items"),
    qcStatus: v.union(v.literal("not_received"), v.literal("pending_review"), v.literal("gl"), v.literal("rl")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      qcStatus: args.qcStatus,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("items")),
    status: v.union(
      v.literal("ordered"), v.literal("shipped_to_warehouse"), v.literal("at_cn_warehouse"),
      v.literal("shipped_to_ph"), v.literal("at_ph_warehouse"), v.literal("delivered_to_me"),
      v.literal("sold"), v.literal("cancelled"), v.literal("returned")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.ids) {
      const existing = await ctx.db.get(id);
      if (!existing) continue;
      const soldDate =
        args.status === "sold" && existing.status !== "sold" ? now : existing.soldDate;
      await ctx.db.patch(id, { status: args.status, soldDate, updatedAt: now });
    }
  },
});

// ── Queries ──

export const list = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    seller: v.optional(v.string()),
    qcStatus: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("items").order("desc").collect();

    if (args.status) {
      items = items.filter((i) => i.status === args.status);
    }
    if (args.category) {
      items = items.filter((i) => i.category === args.category);
    }
    if (args.seller) {
      items = items.filter((i) => i.seller === args.seller);
    }
    if (args.qcStatus) {
      items = items.filter((i) => i.qcStatus === args.qcStatus);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.seller.toLowerCase().includes(s) ||
          (i.batch && i.batch.toLowerCase().includes(s)) ||
          (i.customerName && i.customerName.toLowerCase().includes(s))
      );
    }

    if (args.sortBy) {
      const order = args.sortOrder === "asc" ? 1 : -1;
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[args.sortBy!];
        const bVal = (b as Record<string, unknown>)[args.sortBy!];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return ((aVal as number) - (bVal as number)) * order;
      });
    }

    return items;
  },
});

export const getById = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    return await ctx.db.query("items").order("desc").take(limit);
  },
});

export const getByStatus = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const grouped: Record<string, number> = {};
    for (const item of items) {
      grouped[item.status] = (grouped[item.status] ?? 0) + 1;
    }
    return grouped;
  },
});
