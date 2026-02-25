import { action } from "./_generated/server";
import { v } from "convex/values";

export const validatePassword = action({
  args: { password: v.string() },
  handler: async (_ctx, { password }) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error("ADMIN_PASSWORD env variable not set");
    return { valid: password === adminPassword };
  },
});
