import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    // Item Identity
    name: v.string(),
    category: v.union(
      v.literal("shoes"),
      v.literal("clothes"),
      v.literal("watches_accessories")
    ),
    imageUrl: v.optional(v.string()),
    size: v.optional(v.string()),

    // Source Info
    seller: v.string(),
    sellerContact: v.optional(v.string()),
    batch: v.optional(v.string()),

    // Pricing
    priceCNY: v.number(),
    exchangeRateUsed: v.number(),
    pricePHP: v.number(),

    // Local CN Shipping
    hasLocalShipping: v.boolean(),
    localShippingCNY: v.optional(v.number()),
    localShippingPHP: v.optional(v.number()),

    // QC
    qcPhotoIds: v.optional(v.array(v.id("_storage"))),
    qcStatus: v.union(
      v.literal("not_received"),
      v.literal("pending_review"),
      v.literal("gl"),
      v.literal("rl")
    ),

    // Shipping & Weight
    weightKg: v.optional(v.number()),
    isBranded: v.boolean(),
    forwarderRatePerKg: v.number(),
    forwarderFee: v.optional(v.number()),
    isForwarderBuy: v.optional(v.boolean()),
    forwarderBuyRateUsed: v.optional(v.number()),
    forwarderBuyFeePHP: v.optional(v.number()),
    qcServiceFeePHP: v.optional(v.number()),

    // Selling & Delivery
    sellingPrice: v.optional(v.number()),
    lalamoveFee: v.optional(v.number()),
    customerName: v.optional(v.string()),

    // Computed Fields
    totalCost: v.optional(v.number()),
    profit: v.optional(v.number()),

    // Status
    status: v.union(
      // Current statuses
      v.literal("ordered"),
      v.literal("qc_sent"),
      v.literal("item_shipout"),
      v.literal("arrived_ph_warehouse"),
      v.literal("delivered_to_customer"),
      v.literal("refunded"),
      // Legacy statuses (kept so existing documents remain valid)
      v.literal("shipped_to_warehouse"),
      v.literal("at_cn_warehouse"),
      v.literal("shipped_to_ph"),
      v.literal("at_ph_warehouse"),
      v.literal("delivered_to_me"),
      v.literal("sold"),
      v.literal("cancelled"),
      v.literal("returned")
    ),

    // Metadata
    notes: v.optional(v.string()),
    orderDate: v.number(),
    soldDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_seller", ["seller"])
    .index("by_orderDate", ["orderDate"])
    .index("by_soldDate", ["soldDate"])
    .index("by_qcStatus", ["qcStatus"]),

  sellers: defineTable({
    name: v.string(),
    platform: v.optional(
      v.union(
        v.literal("weidian"),
        v.literal("taobao"),
        v.literal("1688"),
        v.literal("yupoo"),
        v.literal("direct")
      )
    ),
    contactInfo: v.optional(v.string()),
    storeLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  settings: defineTable({
    cnyToPhpRate: v.number(),
    forwarderBuyServiceRate: v.optional(v.number()),
    defaultForwarderRate: v.number(),
    defaultMarkupMin: v.number(),
    defaultMarkupMax: v.number(),
    updatedAt: v.number(),
  }),
});
