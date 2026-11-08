import { query, mutation, type QueryCtx } from "./_generated/server";
import { ConvexError, v, type Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { sellerPlatformValidator } from "./schema";

const REALIZED_SALE_STATUSES = new Set(["delivered_to_customer", "sold"]);

type SellerInput = {
  name: string;
  platform?: Infer<typeof sellerPlatformValidator>;
  tdShippingCNY?: number;
  tdInsurancePct?: number;
};

function requireRate(value: number | undefined, label: string): number {
  if (value === undefined) throw new ConvexError(`${label} is required`);
  if (!Number.isFinite(value) || value < 0) throw new ConvexError(`${label} must be 0 or higher`);
  return value;
}

const normalizeName = (name: string) => name.trim().toLowerCase();

export function validateSellerInput(input: SellerInput, otherTdNames: string[]): SellerInput {
  const name = input.name.trim();
  const platform = input.platform;
  if (!name) throw new ConvexError("Seller name is required");
  if (platform !== "td") {
    return { name, platform, tdShippingCNY: undefined, tdInsurancePct: undefined };
  }
  const tdShippingCNY = requireRate(input.tdShippingCNY, "TD shipping fee");
  const tdInsurancePct = requireRate(input.tdInsurancePct, "TD insurance %");
  if (otherTdNames.some((other) => normalizeName(other) === normalizeName(name))) {
    throw new ConvexError(`A TD named "${name}" already exists`);
  }
  return { name, platform, tdShippingCNY, tdInsurancePct };
}

async function otherTdNames(ctx: QueryCtx, excludeId?: Id<"sellers">) {
  const sellers = await ctx.db.query("sellers").collect();
  return sellers.filter((s) => s.platform === "td" && s._id !== excludeId).map((s) => s.name);
}

const sellerFields = {
  platform: v.optional(sellerPlatformValidator),
  tdShippingCNY: v.optional(v.number()),
  tdInsurancePct: v.optional(v.number()),
  contactInfo: v.optional(v.string()),
  storeLink: v.optional(v.string()),
  notes: v.optional(v.string()),
};

export const create = mutation({
  args: { name: v.string(), ...sellerFields },
  handler: async (ctx, args) => {
    const seller = validateSellerInput(args, await otherTdNames(ctx));
    return await ctx.db.insert("sellers", { ...args, ...seller, createdAt: Date.now() });
  },
});

export const createTrustedDealer = mutation({
  args: { name: v.string(), tdShippingCNY: v.number(), tdInsurancePct: v.number() },
  handler: async (ctx, args) => {
    const seller = validateSellerInput({ ...args, platform: "td" }, await otherTdNames(ctx));
    return await ctx.db.insert("sellers", { ...seller, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: { id: v.id("sellers"), name: v.optional(v.string()), ...sellerFields },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError("Seller not found");
    const seller = validateSellerInput({ ...existing, ...updates }, await otherTdNames(ctx, id));
    await ctx.db.patch(id, { ...updates, ...seller });
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
      const soldItems = sellerItems.filter((i) =>
        REALIZED_SALE_STATUSES.has(i.status)
      );
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
