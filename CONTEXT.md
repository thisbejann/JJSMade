# Domain Glossary

## Item
A single product being tracked from purchase (China) to delivery (Philippines customer or personal use). The database table is `items`. The UI calls these "Orders" — the two terms are used interchangeably in the interface but **Item** is the canonical domain term for the data model.

## Order
UI-facing synonym for Item. Refers to one tracked product in the pipeline.

## Group Order
A named collection of Items that belong to a single customer transaction. The customer pays for all items together (combined selling price). Group Orders can be created at order time or retroactively by grouping existing solo Items. A Group Order does not imply a single delivery — lalamove logistics are handled separately by the customer.

## Customer
A person who buys items from the business. A first-class entity with a profile — order history, total profit, number of orders. Stored in a `customers` table with fields: `name`, `createdAt`. Items and Group Orders reference a Customer by ID, not by name string. `customerId` is **required** on all `items` (reselling orders) — no item in the orders pipeline exists without a customer. Personal items (`personalItems` table) have no customer concept. The legacy `customerName` string on `items` is the migration source for existing records.

## Lalamove Fee
The last-mile delivery fee (Lalamove courier) paid by the customer directly. Not tracked as a business cost. The `lalamoveFee` field on `items` is **soft-deprecated** — retained in the schema for historical records but excluded from all UI display and profit calculations going forward.

## Group Deletion
When deleting a Group Order, the user is prompted to choose: (1) **Dissolve** — delete the group record only, items become Solo Items; or (2) **Delete all** — delete the group and all its items permanently.

## Cross-Customer Grouping
Not allowed. All items in a Group Order must belong to the same Customer. Attempting to add an item with a different `customerId` to a group is blocked at the application level — no prompt, no override.

## Group Order Date
The display date of a Group Order — derived at query time from the latest `orderDate` among its items. Not stored on the group record.

## Group Status
The derived status of a Group Order, computed from its items at query time — never stored. Refunded and cancelled items are excluded from status computation. If all items are refunded/cancelled, group status is `cancelled`. If all remaining active items are `delivered_to_customer`, group is `completed`. Otherwise the group shows the lagging (furthest-behind) active item's status. Computed fields (total selling price, total profit) follow the same pattern — summed from items at query time.

## Customer Picker
A combobox on the ItemForm (and group creation modal) for selecting a Customer. Searches the `customers` table by name. If the typed name doesn't match any existing customer, shows a "Create '[name]'" option that creates and selects the customer in one step.

## Group Order Creation Flow
The primary path starts at a **+ New** split control in the Orders header, offering **Add Item** (solo) and **New Group Order**. "New Group Order" routes to the Quote Calculator, where you build and negotiate a [Bundle], then [Save as Group Order] → [Group Review Sheet] → the new Group Order detail page. This replaces the old empty-group flow (a low-visibility "New Group" button that created an empty group, then added items one at a time via ItemForm — **removed**).

Two secondary paths remain for adding to groups *after* a sale: **multi-select grouping** (select Solo Items in the Orders list → "Group Selected" → add to or create a group) and the group detail's **Add Item** button (one more item into an existing group via ItemForm, customer locked).

## Orders List Layout
The Orders list shows Group Orders and Solo Items in a single mixed list. A Group Order appears as a collapsible summary row (customer name, item count, lagging status, combined selling price, combined profit). The row expands minimally to reveal its items as sub-rows — each sub-row links directly to that item's detail page. Clicking the group row itself (not the expand toggle) navigates to the Group Order detail page. Collapsed by default.

## Customer Profile Page
A dedicated page per Customer. Shows: customer name, total orders, total profit, and a list of all their orders (both Solo Items and Group Orders). Accessible from a Customers section in the sidebar — similar in structure to the Sellers section. The order history list uses the same mixed layout as the main Orders list (expandable group rows + solo item rows), filtered to that customer.

## Solo Item
An Item that is not part of any Group Order. Appears as an individual row in the Orders list.

## Quote Calculator
The `/calculator` screen — a pre-sale tool for quoting a customer. Computes a single item's **suggested selling price** from its CNY price (`cost + per-category markup`). Stateless and ephemeral — nothing it produces is persisted. Distinct from creating an actual Item or Group Order.

## Bundle
An **ephemeral, calculator-only** collection of computed item quotes used to price a multi-item order *before* the sale. A Bundle exists only in the Quote Calculator screen during one session — it is **not itself** persisted and is **not** a Group Order. (A Group Order is the persisted entity in the `orderGroups` table; a Bundle is a negotiation scratchpad.) Items are added one at a time via "Add to bundle". A Bundle is **throwaway by default**, but can be **promoted** into a Group Order in one step — see [Save as Group Order]. Promotion is one-way: it seeds a brand-new Group Order from the Bundle, then the Bundle is discarded.

## Save as Group Order
The one-way action that **promotes** a Bundle into a persisted Group Order. Available on the Quote Calculator whenever the Bundle is non-empty. It opens the **Group Review Sheet**; on confirmation it creates one `orderGroups` row plus one real `items` row per Bundle line, carries the negotiated [Offer Total] across as the group's `negotiatedTotal`, then navigates to the new Group Order detail page and clears the Bundle.

## Group Review Sheet
A full-height overlay on the Quote Calculator (not a separate route, so Bundle state survives — "Cancel" returns to the untouched Bundle). It is the **finalize** step of [Save as Group Order]. Collects the one Customer for the whole group and, per Bundle line, the fields a real Item requires that the calculator never captured: **name**, **seller**, and **size** (EU number for shoes, S/M/L/XL for clothes, none for watches/accessories — enforced by `validateItemRules`). Each line's computed quote is shown read-only and becomes that Item's `sellingPrice`. The negotiated total is pre-filled from the [Offer Total] and stays editable for a last-second round number. Seeded Items are created as `status: "ordered"` with weight blank and all other fields defaulted exactly as a freshly-ordered Item; their forwarder shipping fee is therefore still unknown, so group profit is optimistic until weights are entered — the same caveat the calculator already carries.

## Bundle Quote
The sum of the suggested selling prices of all items in a Bundle, before any discount. The starting point the customer haggles down from.

## Offer Total
The negotiated bundle price the customer proposes/agrees to — typed into the calculator. The discount is derived as `Bundle Quote − Offer Total`, shown as both an amount and a percentage. The discount is **never redistributed** back onto individual item quotes — it lives only at the bundle level. (This mirrors the Group Order pricing model: a group-level override, not a per-item rewrite.) On [Save as Group Order] the Offer Total carries across verbatim as the new group's `negotiatedTotal` — but only when a discount was actually given (offer < [Bundle Quote]); at full price it is left null and the group shows full price, identical to setting it by hand. `quotesSumAtEntry` snapshots the Bundle Quote so the group's "stale" warning works from creation.

## Break-even Floor
The sum of item **costs** in a Bundle — the lowest Offer Total before the order loses money. The calculator surfaces this as the "how low can I go" anchor during negotiation.

## Pre-shipping Margin
`Offer Total − Break-even Floor`. The calculator's profit readout. **Provisional and known to be imperfect:** it excludes the weight-based **forwarder shipping fee**, which is unknown at quote time. Lightweight items therefore over-state profit and heavy items under-state it (or hide a real loss). This is intentional for now and is the motivating case for the planned **weight-aware pricing revision** — once that lands, the Bundle math inherits real shipping cost. Always labelled "excl. forwarder shipping" in the UI so it is never read as final profit.
