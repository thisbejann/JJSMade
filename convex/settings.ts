import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return settings;
  },
});

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("settings").first();
    if (existing) return existing._id;

    const id = await ctx.db.insert("settings", {
      cnyToPhpRate: 7.8,
      defaultForwarderRate: 480,
      defaultMarkupMin: 700,
      defaultMarkupMax: 850,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    cnyToPhpRate: v.optional(v.number()),
    defaultForwarderRate: v.optional(v.number()),
    defaultMarkupMin: v.optional(v.number()),
    defaultMarkupMax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) throw new Error("Settings not initialized");

    const updates: Record<string, number> = { updatedAt: Date.now() };
    if (args.cnyToPhpRate !== undefined) updates.cnyToPhpRate = args.cnyToPhpRate;
    if (args.defaultForwarderRate !== undefined) updates.defaultForwarderRate = args.defaultForwarderRate;
    if (args.defaultMarkupMin !== undefined) updates.defaultMarkupMin = args.defaultMarkupMin;
    if (args.defaultMarkupMax !== undefined) updates.defaultMarkupMax = args.defaultMarkupMax;

    await ctx.db.patch(settings._id, updates);
  },
});
