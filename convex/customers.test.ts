import { describe, it, expect } from "vitest";
import { computeCustomerStats } from "./customers";

describe("computeCustomerStats", () => {
  it("returns zeros for a customer with no items", () => {
    expect(computeCustomerStats([])).toEqual({ orderCount: 0, totalProfit: 0, totalRevenue: 0 });
  });

  it("counts all items for orderCount regardless of status", () => {
    const items = [
      { status: "ordered", profit: 0, sellingPrice: 0 },
      { status: "arrived_ph_warehouse", profit: 0, sellingPrice: 0 },
    ];
    expect(computeCustomerStats(items).orderCount).toBe(2);
  });

  it("only sums profit from realized (delivered_to_customer / sold) items", () => {
    const items = [
      { status: "delivered_to_customer", profit: 300, sellingPrice: 1000 },
      { status: "ordered", profit: 200, sellingPrice: 800 },
    ];
    const result = computeCustomerStats(items);
    expect(result.totalProfit).toBe(300);
    expect(result.totalRevenue).toBe(1000);
  });

  it("includes legacy 'sold' status as realized", () => {
    const items = [{ status: "sold", profit: 150, sellingPrice: 500 }];
    expect(computeCustomerStats(items).totalProfit).toBe(150);
  });

  it("sums profit from multiple sold items", () => {
    const items = [
      { status: "delivered_to_customer", profit: 200 },
      { status: "delivered_to_customer", profit: 350 },
    ];
    expect(computeCustomerStats(items).totalProfit).toBe(550);
  });

  it("handles items in a group: they still count toward totals", () => {
    const items = [
      { status: "delivered_to_customer", profit: 100 },
      { status: "delivered_to_customer", profit: 200 },
      { status: "delivered_to_customer", profit: 300 },
    ];
    const result = computeCustomerStats(items);
    expect(result.orderCount).toBe(3);
    expect(result.totalProfit).toBe(600);
  });

  it("mix of solo and grouped items produces correct combined totals", () => {
    const items = [
      { status: "delivered_to_customer", profit: 100 },   // solo
      { status: "delivered_to_customer", profit: 200 },   // in group
      { status: "ordered", profit: 0 },                   // solo, in-flight
    ];
    const result = computeCustomerStats(items);
    expect(result.orderCount).toBe(3);
    expect(result.totalProfit).toBe(300);
  });

  it("handles undefined profit fields gracefully", () => {
    const items = [{ status: "delivered_to_customer" }];
    expect(computeCustomerStats(items).totalProfit).toBe(0);
  });
});
