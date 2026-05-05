# ADR-0001: Customer as a first-class entity

## Status
Accepted

## Context
Items originally stored the buyer's name as a free-text `customerName` string. This was sufficient for labelling orders but made it impossible to query order history, profit, or repeat-buyer metrics per customer without fragile string matching.

## Decision
Introduce a `customers` table. Items and Group Orders reference a Customer by `customerId` (a Convex document ID), not by name string. `customerId` is required on all `items` — no reselling order exists without a customer. Personal items (`personalItems`) are exempt. The existing `customerName` string on `items` becomes the migration source — existing records are matched by name to create or link Customer documents.

## Consequences
- Enables customer profiles: order history, total profit, number of orders per customer
- `TopCustomersChart` and any customer-name queries must be updated to join through `customerId`
- Migration needed for existing `items` records that carry a `customerName` string — handled via a one-time internal Convex mutation that creates Customer records per unique name and backfills `customerId` on items
- The legacy `customerName` field on `items` should be retained during migration, then removed once all records are verified to have a `customerId`
