import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
