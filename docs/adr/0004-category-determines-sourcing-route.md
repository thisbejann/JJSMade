# Category determines the sourcing route

## Status

Accepted

## Context

Rep watches are bought from a [Trusted Dealer] who ships straight to the owner, with no forwarder, no weight-based fee, TD shipping and insurance instead, and no PH-warehouse step. Every other product goes China seller → forwarder → PH warehouse. Each Item needs to know which of these two cost models and status flows applies to it.

## Decision

The Item's **Category** decides the [Sourcing Route]: **Watches** is the TD route, and every other category (Shoes, Clothes, Accessories, Bags) is the China route. There's no route field or toggle on an Item. `watches_accessories` is split into `watches` and `accessories`, and "Watches" is narrowed to quality reps from a TD. A cheap fashion watch from a China seller is filed as an Accessory.

## Considered Options

- **A route toggle on each Item, separate from category.** More flexible (a TD could in theory sell a bracelet, or a watch could come through the forwarder), but it adds a choice to every order and allows nonsense combinations like a TD-route shoe. Rejected, because in practice the owner only buys watches from TDs, and only watches.
- **A separate table for watches**, like `personalItems`. Rejected: watches still need Customers, Group Orders, profit totals and the Orders list, and a second table would duplicate all of that.

## Consequences

- Quoting a watch: cost (price + TD shipping + insurance) + the **Watches Profit Target**, starting at ₱1,500. This is a deliberate exception to ADR-0005's single Profit Target, which still applies to every China-route category.

- If a TD ever sells something other than a watch, or a quality watch arrives through the forwarder, this model can't represent it without moving to a route field, which would mean backfilling every Item.
- Legacy `watches_accessories` Items have to be reclassified by hand, since nothing on the record says whether one was a watch.
