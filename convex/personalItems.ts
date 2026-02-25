import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { computeDerivedFields } from "./helpers";

const CLOTHES_SIZES = new Set(["S", "M", "L", "XL"]);

const personalStatusValidator = v.union(
  v.literal("ordered"),
  v.literal("qc_sent"),
  v.literal("item_shipout"),
  v.literal("arrived_ph_warehouse"),
  v.literal("delivered_to_me"),
  v.literal("cancelled")
);

function normalizeSize(
  category: "shoes" | "clothes" | "watches_accessories",
  size?: string
) {
  const trimmed = size?.trim();
  if (!trimmed) return undefined;
  if (category === "clothes") return trimmed.toUpperCase();
  if (category === "watches_accessories") return undefined;
  return trimmed;
}

function validateItemRules(data: {
  category: "shoes" | "clothes" | "watches_accessories";
  size?: string;
  isForwarderBuy: boolean;
  forwarderBuyRateUsed?: number;
}) {
  if (data.category === "shoes") {
    const parsed = Number(data.size);
    if (!data.size || Number.isNaN(parsed) || parsed <= 0) {
      throw new Error("Shoes must use a valid EU size");
    }
  }

  if (data.category === "clothes") {
    if (!data.size || !CLOTHES_SIZES.has(data.size)) {
      throw new Error("Clothes size must be S, M, L, or XL");
    }
  }

  if (data.isForwarderBuy) {
    if (
      data.forwarderBuyRateUsed == null ||
      Number.isNaN(data.forwarderBuyRateUsed) ||
      data.forwarderBuyRateUsed <= 0
    ) {
      throw new Error("Forwarder buy service rate is required");
    }
  }
}

// ── Mutations ──

export const create = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("shoes"), v.literal("clothes"), v.literal("watches_accessories")),
    imageUrl: v.optional(v.string()),
    size: v.optional(v.string()),
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
    isForwarderBuy: v.optional(v.boolean()),
    forwarderBuyRateUsed: v.optional(v.number()),
    status: personalStatusValidator,
    notes: v.optional(v.string()),
    orderDate: v.number(),
  },
  handler: async (ctx, args) => {
    const size = normalizeSize(args.category, args.size);
    const isForwarderBuy = args.isForwarderBuy ?? false;
    const forwarderBuyRateUsed = isForwarderBuy ? args.forwarderBuyRateUsed : undefined;

    validateItemRules({ category: args.category, size, isForwarderBuy, forwarderBuyRateUsed });

    const derived = computeDerivedFields({
      priceCNY: args.priceCNY,
      exchangeRateUsed: args.exchangeRateUsed,
      hasLocalShipping: args.hasLocalShipping,
      localShippingCNY: args.localShippingCNY,
      weightKg: args.weightKg,
      forwarderRatePerKg: args.forwarderRatePerKg,
      isForwarderBuy,
      forwarderBuyRateUsed,
      lalamoveFee: undefined,
      sellingPrice: undefined,
    });

    const now = Date.now();
    const id = await ctx.db.insert("personalItems", {
      ...args,
      size,
      isForwarderBuy,
      forwarderBuyRateUsed,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      forwarderBuyFeePHP: derived.forwarderBuyFeePHP,
      qcServiceFeePHP: derived.qcServiceFeePHP,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("personalItems"),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal("shoes"), v.literal("clothes"), v.literal("watches_accessories"))),
    imageUrl: v.optional(v.string()),
    size: v.optional(v.string()),
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
    isForwarderBuy: v.optional(v.boolean()),
    forwarderBuyRateUsed: v.optional(v.number()),
    status: v.optional(personalStatusValidator),
    notes: v.optional(v.string()),
    orderDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Personal item not found");

    const merged = { ...existing, ...updates };
    const size = normalizeSize(merged.category, merged.size);
    const isForwarderBuy = merged.isForwarderBuy ?? false;
    const forwarderBuyRateUsed = isForwarderBuy ? merged.forwarderBuyRateUsed : undefined;

    validateItemRules({ category: merged.category, size, isForwarderBuy, forwarderBuyRateUsed });

    const derived = computeDerivedFields({
      priceCNY: merged.priceCNY,
      exchangeRateUsed: merged.exchangeRateUsed,
      hasLocalShipping: merged.hasLocalShipping,
      localShippingCNY: merged.localShippingCNY,
      weightKg: merged.weightKg,
      forwarderRatePerKg: merged.forwarderRatePerKg,
      isForwarderBuy,
      forwarderBuyRateUsed,
      lalamoveFee: undefined,
      sellingPrice: undefined,
    });

    await ctx.db.patch(id, {
      ...updates,
      size,
      isForwarderBuy,
      forwarderBuyRateUsed,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      forwarderBuyFeePHP: derived.forwarderBuyFeePHP,
      qcServiceFeePHP: derived.qcServiceFeePHP,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("personalItems"),
    status: personalStatusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Personal item not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("personalItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Queries ──

export const list = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("personalItems").order("desc").collect();

    if (args.status) {
      items = items.filter((i) => i.status === args.status);
    }
    if (args.category) {
      items = items.filter((i) => i.category === args.category);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.seller.toLowerCase().includes(s) ||
          (i.batch && i.batch.toLowerCase().includes(s))
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
  args: { id: v.id("personalItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
