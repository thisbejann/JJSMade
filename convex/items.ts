import { query, mutation, internalMutation, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import {
  assertStatusFitsRoute,
  categoryHasSize,
  computeDerivedFields,
  isLegacyCategory,
  isTdRoute,
  type TdRates,
} from "./helpers";
import { categoryValidator, itemStatusValidator, type ItemCategory, type ItemStatus } from "./schema";
import { deleteUnreferencedQcPhotos } from "./qcPhotoCleanup";

const CLOTHES_SIZES = new Set(["S", "M", "L", "XL"]);


export function normalizeSize(
  category: ItemCategory,
  size?: string
) {
  const trimmed = size?.trim();
  if (!trimmed) return undefined;
  if (category === "clothes") return trimmed.toUpperCase();
  if (!categoryHasSize(category)) return undefined;
  return trimmed;
}

export function validateItemRules(data: {
  category: ItemCategory;
  /** The stored category when editing. Absent for a new Item. */
  existingCategory?: ItemCategory;
  size?: string;
  status: ItemStatus;
  isForwarderBuy: boolean;
  forwarderBuyRateUsed?: number;
  forwarderBuyCommissionPercent?: number;
}) {
  if (isLegacyCategory(data.category) && data.category !== data.existingCategory) {
    throw new Error("Watches & Accessories is retired. Pick Watches or Accessories");
  }

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

  assertStatusFitsRoute(data.category, data.status);

  if (data.isForwarderBuy) {
    if (isTdRoute(data.category)) {
      throw new ConvexError("A watch can't be bought by the forwarder. Pay the TD directly");
    }
    if (
      data.forwarderBuyRateUsed == null ||
      Number.isNaN(data.forwarderBuyRateUsed) ||
      data.forwarderBuyRateUsed <= 0
    ) {
      throw new Error("Forwarder buy service rate is required");
    }

    if (
      data.forwarderBuyCommissionPercent == null ||
      Number.isNaN(data.forwarderBuyCommissionPercent) ||
      data.forwarderBuyCommissionPercent < 0
    ) {
      throw new Error("Forwarder buy commission percent must be 0 or higher");
    }
  }
}

/**
 * The TD rates a watch carries, read on the server so the client can't override them.
 * A watch keeps the rates it was ordered with until its seller changes: then the new
 * TD's current rates are copied in. Keeping them doesn't require the name to still be
 * a TD, so a watch stays editable after its TD is renamed in Sellers.
 */
export async function resolveTdRates(
  ctx: QueryCtx,
  next: { category: ItemCategory; seller: string },
  existing?: Doc<"items">
): Promise<TdRates | undefined> {
  if (!isTdRoute(next.category)) return undefined;
  const seller = next.seller.trim();
  if (
    existing &&
    isTdRoute(existing.category) &&
    existing.seller.trim() === seller &&
    existing.tdShippingCNY != null &&
    existing.tdInsurancePct != null
  ) {
    return { tdShippingCNY: existing.tdShippingCNY, tdInsurancePct: existing.tdInsurancePct };
  }
  const matches = await ctx.db
    .query("sellers")
    .withIndex("by_name", (q) => q.eq("name", seller))
    .collect();
  const td = matches.find((s) => s.platform === "td");
  if (!td || td.tdShippingCNY == null || td.tdInsurancePct == null) {
    throw new ConvexError(`"${seller}" isn't a Trusted Dealer. Pick a TD or create one`);
  }
  return { tdShippingCNY: td.tdShippingCNY, tdInsurancePct: td.tdInsurancePct };
}

type WatchTd = TdRates & { insured: boolean };

/** Off the TD route every field is cleared, so a reclassified Item drops stale rates. */
export function storedTdFields(td: WatchTd | undefined) {
  return {
    tdShippingCNY: td?.tdShippingCNY,
    tdInsurancePct: td?.tdInsurancePct,
    tdInsured: td?.insured,
  };
}

// ── Mutations ──

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
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
    trackingNumber: v.optional(v.string()),
    isBranded: v.boolean(),
    forwarderRatePerKg: v.number(),
    isForwarderBuy: v.optional(v.boolean()),
    forwarderBuyRateUsed: v.optional(v.number()),
    forwarderBuyCommissionPercent: v.optional(v.number()),
    tdInsured: v.optional(v.boolean()),
    sellingPrice: v.optional(v.number()),
    lalamoveFee: v.optional(v.number()),
    customerName: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
    orderGroupId: v.optional(v.id("orderGroups")),
    status: itemStatusValidator,
    notes: v.optional(v.string()),
    orderDate: v.number(),
  },
  handler: async (ctx, args) => {
    const size = normalizeSize(args.category, args.size);
    const trackingNumber = args.trackingNumber?.trim() || undefined;
    const isForwarderBuy = args.isForwarderBuy ?? false;
    const forwarderBuyRateUsed = isForwarderBuy
      ? args.forwarderBuyRateUsed
      : undefined;
    const forwarderBuyCommissionPercent = isForwarderBuy
      ? args.forwarderBuyCommissionPercent ?? 10
      : undefined;

    validateItemRules({
      category: args.category,
      size,
      status: args.status,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent,
    });

    const rates = await resolveTdRates(ctx, args);
    const td = rates && { ...rates, insured: args.tdInsured ?? true };

    const derived = computeDerivedFields({
      category: args.category,
      priceCNY: args.priceCNY,
      exchangeRateUsed: args.exchangeRateUsed,
      hasLocalShipping: args.hasLocalShipping,
      localShippingCNY: args.localShippingCNY,
      weightKg: args.weightKg,
      forwarderRatePerKg: args.forwarderRatePerKg,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent,
      sellingPrice: args.sellingPrice,
      td,
    });

    const now = Date.now();
    const id = await ctx.db.insert("items", {
      ...args,
      ...storedTdFields(td),
      size,
      trackingNumber,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      forwarderBuyFeePHP: derived.forwarderBuyFeePHP,
      qcServiceFeePHP: derived.qcServiceFeePHP,
      tdShippingPHP: derived.tdShippingPHP,
      tdInsurancePHP: derived.tdInsurancePHP,
      totalCost: derived.totalCost,
      profit: derived.profit,
      soldDate: args.status === "delivered_to_customer" ? now : undefined,
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
    category: v.optional(categoryValidator),
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
    trackingNumber: v.optional(v.string()),
    isBranded: v.optional(v.boolean()),
    forwarderRatePerKg: v.optional(v.number()),
    isForwarderBuy: v.optional(v.boolean()),
    forwarderBuyRateUsed: v.optional(v.number()),
    forwarderBuyCommissionPercent: v.optional(v.number()),
    tdInsured: v.optional(v.boolean()),
    sellingPrice: v.optional(v.number()),
    lalamoveFee: v.optional(v.number()),
    customerName: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
    orderGroupId: v.optional(v.id("orderGroups")),
    status: v.optional(itemStatusValidator),
    notes: v.optional(v.string()),
    orderDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item not found");
    const hasQcPhotoIdsUpdate = Object.prototype.hasOwnProperty.call(
      updates,
      "qcPhotoIds"
    );
    const updatedQcPhotoIds = hasQcPhotoIdsUpdate ? updates.qcPhotoIds ?? [] : [];
    const updatedQcPhotoIdSet = new Set(updatedQcPhotoIds);
    const removedQcPhotoIds = hasQcPhotoIdsUpdate
      ? (existing.qcPhotoIds ?? []).filter((photoId) => !updatedQcPhotoIdSet.has(photoId))
      : [];

    const hasTrackingNumberUpdate = Object.prototype.hasOwnProperty.call(
      updates,
      "trackingNumber"
    );
    const trackingNumber = hasTrackingNumberUpdate
      ? updates.trackingNumber?.trim() || undefined
      : existing.trackingNumber;

    const hasForwarderBuyCommissionUpdate = Object.prototype.hasOwnProperty.call(
      updates,
      "forwarderBuyCommissionPercent"
    );
    const forwarderBuyCommissionPercent = hasForwarderBuyCommissionUpdate
      ? updates.forwarderBuyCommissionPercent
      : existing.forwarderBuyCommissionPercent;

    const merged = {
      ...existing,
      ...updates,
      trackingNumber,
      forwarderBuyCommissionPercent,
    };
    const size = normalizeSize(merged.category, merged.size);
    const isForwarderBuy = merged.isForwarderBuy ?? false;
    const forwarderBuyRateUsed = isForwarderBuy
      ? merged.forwarderBuyRateUsed
      : undefined;
    const normalizedForwarderBuyCommissionPercent = isForwarderBuy
      ? merged.forwarderBuyCommissionPercent ?? 10
      : undefined;

    validateItemRules({
      category: merged.category,
      existingCategory: existing.category,
      size,
      status: merged.status,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent: normalizedForwarderBuyCommissionPercent,
    });

    const rates = await resolveTdRates(ctx, merged, existing);
    const td = rates && { ...rates, insured: merged.tdInsured ?? true };

    const derived = computeDerivedFields({
      category: merged.category,
      priceCNY: merged.priceCNY,
      exchangeRateUsed: merged.exchangeRateUsed,
      hasLocalShipping: merged.hasLocalShipping,
      localShippingCNY: merged.localShippingCNY,
      weightKg: merged.weightKg,
      estimatedWeightKg: merged.estimatedWeightKg,
      forwarderRatePerKg: merged.forwarderRatePerKg,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent: normalizedForwarderBuyCommissionPercent,
      sellingPrice: merged.sellingPrice,
      td,
    });

    const now = Date.now();
    const soldDate =
      updates.status === "delivered_to_customer" && existing.status !== "delivered_to_customer"
        ? now
        : existing.soldDate;

    await ctx.db.patch(id, {
      ...updates,
      ...storedTdFields(td),
      size,
      trackingNumber,
      isForwarderBuy,
      forwarderBuyRateUsed,
      forwarderBuyCommissionPercent: normalizedForwarderBuyCommissionPercent,
      pricePHP: derived.pricePHP,
      localShippingPHP: derived.localShippingPHP,
      forwarderFee: derived.forwarderFee,
      forwarderBuyFeePHP: derived.forwarderBuyFeePHP,
      qcServiceFeePHP: derived.qcServiceFeePHP,
      tdShippingPHP: derived.tdShippingPHP,
      tdInsurancePHP: derived.tdInsurancePHP,
      totalCost: derived.totalCost,
      profit: derived.profit,
      soldDate,
      updatedAt: now,
    });

    await deleteUnreferencedQcPhotos(ctx, removedQcPhotoIds, { table: "items", id });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("items"),
    status: itemStatusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Item not found");
    assertStatusFitsRoute(existing.category, args.status);

    const now = Date.now();
    const soldDate =
      args.status === "delivered_to_customer" && existing.status !== "delivered_to_customer" ? now : existing.soldDate;

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
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    const removedQcPhotoIds = existing.qcPhotoIds ?? [];
    await ctx.db.delete(args.id);
    await deleteUnreferencedQcPhotos(ctx, removedQcPhotoIds, {
      table: "items",
      id: args.id,
    });
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("items")),
    status: itemStatusValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.ids) {
      const existing = await ctx.db.get(id);
      if (!existing) continue;
      assertStatusFitsRoute(existing.category, args.status);
      const soldDate =
        args.status === "delivered_to_customer" && existing.status !== "delivered_to_customer" ? now : existing.soldDate;
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
    soloOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("items").order("desc").collect();

    if (args.soloOnly) {
      items = items.filter((i) => !i.orderGroupId);
    }

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

export const getUniqueSellers = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const sellers = new Set<string>();
    for (const item of items) {
      if (item.seller) sellers.add(item.seller);
    }
    return [...sellers].sort();
  },
});

export const getUniqueBatches = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    const batches = new Set<string>();
    for (const item of items) {
      if (item.batch) batches.add(item.batch);
    }
    return [...batches].sort();
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

// ── Migrations ──

export function planBagReclassification<Id>(items: { _id: Id; category: ItemCategory }[]) {
  const toMove: Id[] = [];
  const alreadyBags: Id[] = [];
  for (const item of items) {
    (item.category === "bags" ? alreadyBags : toMove).push(item._id);
  }
  return { toMove, alreadyBags };
}

// One-time move of past bag orders into Bags. The owner passes the confirmed
// Item IDs at run time; nothing is matched by name. Only `category` changes,
// and re-running it skips Items that are already Bags.
export const reclassifyAsBags = internalMutation({
  args: { itemIds: v.array(v.id("items")) },
  handler: async (ctx, { itemIds }) => {
    const items = await Promise.all(itemIds.map((id) => ctx.db.get(id)));
    const missing = itemIds.filter((_, i) => items[i] === null);
    if (missing.length > 0) {
      throw new Error(`Items not found: ${missing.join(", ")}`);
    }

    const plan = planBagReclassification(items.filter((item) => item !== null));
    for (const id of plan.toMove) {
      await ctx.db.patch(id, { category: "bags" });
    }
    return { moved: plan.toMove, alreadyBags: plan.alreadyBags };
  },
});
