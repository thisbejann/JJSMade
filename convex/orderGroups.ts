import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { computeDerivedFields } from "./helpers";
import { normalizeSize, validateItemRules } from "./items";

const categoryValidator = v.union(
  v.literal("shoes"),
  v.literal("clothes"),
  v.literal("watches_accessories")
);

const STATUS_FLOW = [
  "ordered",
  "qc_sent",
  "item_shipout",
  "arrived_ph_warehouse",
  "delivered_to_customer",
] as const;

type ActiveStatus = (typeof STATUS_FLOW)[number];

const EXCLUDED_STATUSES = new Set([
  "refunded",
  "cancelled",
  "returned",
  "sold",
  "shipped_to_warehouse",
  "at_cn_warehouse",
  "shipped_to_ph",
  "at_ph_warehouse",
  "delivered_to_me",
]);

export function deriveGroupStatus(
  statuses: string[]
): ActiveStatus | "cancelled" | "completed" {
  const active = statuses.filter((s) => !EXCLUDED_STATUSES.has(s));
  if (active.length === 0) return "cancelled";
  if (active.every((s) => s === "delivered_to_customer")) return "completed";
  const indices = active.map((s) => STATUS_FLOW.indexOf(s as ActiveStatus));
  const laggingIndex = Math.min(...indices.filter((i) => i !== -1));
  return STATUS_FLOW[laggingIndex] ?? "ordered";
}

function computeGroupFields(
  items: {
    status: string;
    orderDate: number;
    sellingPrice?: number;
    profit?: number;
    totalCost?: number;
  }[],
  group: { negotiatedTotal?: number; quotesSumAtEntry?: number }
) {
  const status = deriveGroupStatus(items.map((i) => i.status));
  const orderDate = items.length > 0 ? Math.max(...items.map((i) => i.orderDate)) : 0;

  // sumOfQuotes is the full-price total (what every item quotes add up to).
  const sumOfQuotes = items.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);
  const sumOfCosts = items.reduce((sum, i) => sum + (i.totalCost ?? 0), 0);
  const totalProfit = items.reduce((sum, i) => sum + (i.profit ?? 0), 0);

  // Group-level override: the customer pays the negotiated total if one is set,
  // otherwise the full sum of quotes. Profit is always measured against the
  // effective total the customer actually pays, not the sum of quotes.
  const negotiatedTotal = group.negotiatedTotal ?? null;
  const effectiveTotal = negotiatedTotal ?? sumOfQuotes;
  const discount = sumOfQuotes - effectiveTotal;
  const discountPct = sumOfQuotes > 0 ? (discount / sumOfQuotes) * 100 : 0;
  const groupProfit = effectiveTotal - sumOfCosts;

  // Stale when the quotes have shifted since the price was agreed — we never
  // auto-update the agreed number, only flag it for the user to re-confirm.
  const quotesSumAtEntry = group.quotesSumAtEntry ?? null;
  const stale =
    negotiatedTotal != null &&
    quotesSumAtEntry != null &&
    quotesSumAtEntry !== sumOfQuotes;

  return {
    status,
    orderDate,
    // Back-compat aliases (sum of quotes / sum of per-item profit at full price).
    totalSellingPrice: sumOfQuotes,
    totalProfit,
    // Negotiated-bundle fields.
    sumOfQuotes,
    negotiatedTotal,
    quotesSumAtEntry,
    effectiveTotal,
    discount,
    discountPct,
    groupProfit,
    stale,
  };
}

export const listWithItems = query({
  handler: async (ctx) => {
    const groups = await ctx.db.query("orderGroups").collect();
    return Promise.all(
      groups.map(async (group) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", group._id))
          .collect();
        const computed = computeGroupFields(items, group);
        const customer = await ctx.db.get(group.customerId);
        return { ...group, ...computed, customerName: customer?.name ?? "", items };
      })
    ).then((results) => results.sort((a, b) => b.orderDate - a.orderDate));
  },
});

/**
 * Mixed recency feed for the dashboard. Groups appear once with computed
 * totals instead of leaking member items as loose rows. A group's recency is
 * its latest item log time, so adding an item to an old bundle resurfaces it:
 * the feed answers "what just happened", not "which record is newest".
 */
export const recentFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const groups = await ctx.db.query("orderGroups").collect();
    const groupEntries = await Promise.all(
      groups.map(async (group) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", group._id))
          .collect();
        const computed = computeGroupFields(items, group);
        const customer = await ctx.db.get(group.customerId);
        const activityAt =
          items.length > 0 ? Math.max(...items.map((i) => i.createdAt)) : group.createdAt;
        return {
          kind: "group" as const,
          activityAt,
          _id: group._id,
          customerName: customer?.name ?? "",
          itemCount: items.length,
          status: computed.status,
          effectiveTotal: computed.effectiveTotal,
        };
      })
    );

    // Solo items only — grouped items already surface through their group entry.
    const allItems = await ctx.db.query("items").order("desc").collect();
    const itemEntries = allItems
      .filter((i) => !i.orderGroupId)
      .slice(0, limit)
      .map((i) => ({
        kind: "item" as const,
        activityAt: i.createdAt,
        _id: i._id,
        name: i.name,
        category: i.category,
        status: i.status,
        sellingPrice: i.sellingPrice ?? null,
      }));

    return [...groupEntries, ...itemEntries]
      .sort((a, b) => b.activityAt - a.activityAt)
      .slice(0, limit);
  },
});

export const list = query({
  handler: async (ctx) => {
    const groups = await ctx.db.query("orderGroups").collect();
    return Promise.all(
      groups.map(async (group) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", group._id))
          .collect();
        const computed = computeGroupFields(items, group);
        const customer = await ctx.db.get(group.customerId);
        return { ...group, ...computed, customerName: customer?.name ?? "", itemCount: items.length };
      })
    ).then((results) => results.sort((a, b) => b.orderDate - a.orderDate));
  },
});

export const getById = query({
  args: { id: v.id("orderGroups") },
  handler: async (ctx, { id }) => {
    const group = await ctx.db.get(id);
    if (!group) return null;
    const items = await ctx.db
      .query("items")
      .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", id))
      .collect();
    const computed = computeGroupFields(items, group);
    const customer = await ctx.db.get(group.customerId);
    return { ...group, ...computed, customerName: customer?.name ?? "", items };
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { customerId, notes }) => {
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    return ctx.db.insert("orderGroups", {
      customerId,
      notes,
      createdAt: Date.now(),
    });
  },
});

// Promote a negotiated Bundle into a real Group Order: seeds the group, one
// item per bundle line, and the carried negotiated total — all in one
// transaction so there are no partial-failure states (a half-created group with
// some items missing). Mirrors items.create's validation + derivation per line.
export const createWithItems = mutation({
  args: {
    customerId: v.id("customers"),
    notes: v.optional(v.string()),
    // The calculator's Offer Total. Persisted as negotiatedTotal only when it is
    // an actual discount (offer < sum of quotes); at full price it is left null
    // and the group shows full price — identical to never setting it by hand.
    negotiatedTotal: v.optional(v.number()),
    items: v.array(
      v.object({
        name: v.string(),
        category: categoryValidator,
        size: v.optional(v.string()),
        seller: v.string(),
        priceCNY: v.number(),
        localShippingCNY: v.optional(v.number()),
        sellingPrice: v.number(),
        isForwarderBuy: v.boolean(),
        exchangeRateUsed: v.number(),
        forwarderRatePerKg: v.number(),
        forwarderBuyRateUsed: v.optional(v.number()),
        forwarderBuyCommissionPercent: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { customerId, notes, negotiatedTotal, items }) => {
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    if (items.length === 0) throw new Error("A group order needs at least one item");

    const now = Date.now();
    const groupId = await ctx.db.insert("orderGroups", {
      customerId,
      notes,
      createdAt: now,
    });

    let sumOfQuotes = 0;

    for (const item of items) {
      const size = normalizeSize(item.category, item.size);
      const isForwarderBuy = item.isForwarderBuy;
      const forwarderBuyRateUsed = isForwarderBuy ? item.forwarderBuyRateUsed : undefined;
      const forwarderBuyCommissionPercent = isForwarderBuy
        ? item.forwarderBuyCommissionPercent ?? 10
        : undefined;

      // Throws on missing shoe/clothes size or missing forwarder rate — the
      // single biggest correctness trap. The sheet gates Create on these, but
      // validate server-side too so a bad payload can never seed a broken item.
      validateItemRules({
        category: item.category,
        size,
        isForwarderBuy,
        forwarderBuyRateUsed,
        forwarderBuyCommissionPercent,
      });

      const hasLocalShipping = item.localShippingCNY != null && item.localShippingCNY > 0;

      const derived = computeDerivedFields({
        priceCNY: item.priceCNY,
        exchangeRateUsed: item.exchangeRateUsed,
        hasLocalShipping,
        localShippingCNY: item.localShippingCNY,
        weightKg: undefined, // unknown at quote time → forwarder fee unknown → optimistic profit
        forwarderRatePerKg: item.forwarderRatePerKg,
        isForwarderBuy,
        forwarderBuyRateUsed,
        forwarderBuyCommissionPercent,
        sellingPrice: item.sellingPrice,
      });

      sumOfQuotes += item.sellingPrice;

      await ctx.db.insert("items", {
        name: item.name,
        category: item.category,
        size,
        seller: item.seller,
        priceCNY: item.priceCNY,
        exchangeRateUsed: item.exchangeRateUsed,
        pricePHP: derived.pricePHP,
        hasLocalShipping,
        localShippingCNY: item.localShippingCNY,
        localShippingPHP: derived.localShippingPHP,
        qcStatus: "not_received",
        isBranded: true,
        forwarderRatePerKg: item.forwarderRatePerKg,
        forwarderFee: derived.forwarderFee,
        isForwarderBuy,
        forwarderBuyRateUsed,
        forwarderBuyCommissionPercent,
        forwarderBuyFeePHP: derived.forwarderBuyFeePHP,
        qcServiceFeePHP: derived.qcServiceFeePHP,
        sellingPrice: item.sellingPrice,
        customerId,
        customerName: customer.name,
        orderGroupId: groupId,
        totalCost: derived.totalCost,
        profit: derived.profit,
        status: "ordered",
        orderDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Snapshot quotesSumAtEntry alongside so the group's "stale" warning works
    // from creation (mirrors setNegotiatedTotal).
    if (negotiatedTotal != null && negotiatedTotal < sumOfQuotes) {
      await ctx.db.patch(groupId, {
        negotiatedTotal,
        quotesSumAtEntry: sumOfQuotes,
      });
    }

    return groupId;
  },
});

export const addItem = mutation({
  args: { groupId: v.id("orderGroups"), itemId: v.id("items") },
  handler: async (ctx, { groupId, itemId }) => {
    const [group, item] = await Promise.all([ctx.db.get(groupId), ctx.db.get(itemId)]);
    if (!group) throw new Error("Group not found");
    if (!item) throw new Error("Item not found");
    if (item.customerId && item.customerId !== group.customerId) {
      throw new Error("Cannot add item from a different customer to this group");
    }
    await ctx.db.patch(itemId, { orderGroupId: groupId, customerId: group.customerId });
  },
});

export const addItems = mutation({
  args: { groupId: v.id("orderGroups"), itemIds: v.array(v.id("items")) },
  handler: async (ctx, { groupId, itemIds }) => {
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const items = await Promise.all(itemIds.map((id) => ctx.db.get(id)));

    for (const item of items) {
      if (!item) throw new Error("Item not found");
      if (item.customerId && item.customerId !== group.customerId) {
        throw new Error("Cannot add item from a different customer to this group");
      }
    }

    // All validated — patch together
    await Promise.all(
      items.map((item) =>
        ctx.db.patch(item!._id, { orderGroupId: groupId, customerId: group.customerId })
      )
    );
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    await ctx.db.patch(itemId, { orderGroupId: undefined });
  },
});

export const setNegotiatedTotal = mutation({
  args: { groupId: v.id("orderGroups"), total: v.number() },
  handler: async (ctx, { groupId, total }) => {
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    // Snapshot the current sum of quotes so we can later detect when the items
    // (and therefore the full price) have drifted from what was agreed.
    const items = await ctx.db
      .query("items")
      .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", groupId))
      .collect();
    const sumOfQuotes = items.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);

    await ctx.db.patch(groupId, {
      negotiatedTotal: total,
      quotesSumAtEntry: sumOfQuotes,
    });
  },
});

export const clearNegotiatedTotal = mutation({
  args: { groupId: v.id("orderGroups") },
  handler: async (ctx, { groupId }) => {
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");
    // Revert to full price: customer pays the sum of quotes again.
    await ctx.db.patch(groupId, {
      negotiatedTotal: undefined,
      quotesSumAtEntry: undefined,
    });
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id("orderGroups"),
    mode: v.union(v.literal("dissolve"), v.literal("delete-all")),
  },
  handler: async (ctx, { groupId, mode }) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_orderGroupId", (q) => q.eq("orderGroupId", groupId))
      .collect();

    if (mode === "dissolve") {
      await Promise.all(items.map((item) => ctx.db.patch(item._id, { orderGroupId: undefined })));
    } else {
      await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    }

    await ctx.db.delete(groupId);
  },
});
