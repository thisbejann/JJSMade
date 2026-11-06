# Domain Glossary

## Item
A single product being tracked from purchase (China) to delivery (Philippines customer or personal use). The database table is `items`. The UI calls these "Orders" — the two terms are used interchangeably in the interface but **Item** is the canonical domain term for the data model.

## Order
UI-facing synonym for Item. Refers to one tracked product in the pipeline.

## Group Order
A named collection of Items that belong to a single customer transaction. The customer pays for all items together (combined selling price). Group Orders can be created at order time or retroactively by grouping existing solo Items. A Group Order does not imply a single delivery — lalamove logistics are handled separately by the customer.

## Category
The kind of product an Item is: **Shoes**, **Clothes**, **Watches**, **Accessories**, or **Bags**. Category drives the size rule and the pricing defaults. Bags are their own category, not an accessory, because they ship far heavier than any accessory. Watches are their own category, split from the former **Watches & Accessories**, because they are bought through a different [Sourcing Route]. Legacy `watches_accessories` Items are reclassified by hand, since nothing on the record says whether it was a watch. **Watches** means quality rep watches from a [Trusted Dealer] only. A cheap fashion watch from a regular China seller is an **Accessory**. Category alone decides the [Sourcing Route]. There is no separate route toggle.

## Sourcing Route
How an Item gets from its seller to you, which decides which costs it carries and which statuses it passes through.
- **China route** (Shoes, Clothes, Accessories, Bags): bought from a China seller, shipped to the forwarder's CN warehouse, consolidated, flown to the PH warehouse. Carries local CN shipping, the [Forwarder Shipping Fee] and any forwarder-buy commission.
- **TD route** (Watches): bought from a [Trusted Dealer], who ships straight to you. No forwarder, no weight-based cost. Carries the [TD Shipping Fee] and [TD Insurance] instead. Statuses skip the PH warehouse: `ordered → qc_sent → item_shipout → delivered_to_customer`.

QC works the same on both routes: the seller sends QC photos, you GL/RL, and an RL means the seller swaps or fixes the item.

## Trusted Dealer (TD)
A vetted rep-watch dealer you buy from directly. A TD is a **Seller** (platform: TD). Each TD has its own [TD Shipping Fee] and [TD Insurance] rate. **A TD's rates are absolute**: an order can't override them, and they change only by editing the TD on its page in Sellers. New watches copy those numbers in when they are ordered, so a rate change affects future watches only. Paid in CNY over Alipay, funded through a PHP→CNY exchanger, at the same CNY→PHP rate as China-route buys.

## TD Picker
The seller field on a Watch's order form, and the TD choice in the [Quote Calculator]. Searches only Sellers marked TD. If the typed name matches no TD, it offers "Create TD '[name]'", which asks for that TD's shipping fee and insurance % in the same step, so a new TD can be registered without leaving the order. This works like the [Customer Picker]. In the [Group Review Sheet], a watch line's TD comes prefilled from the calculator.

## TD Shipping Fee
What a [Trusted Dealer] charges to ship an order straight to you. Strictly it is charged once per TD order, but it is **recorded per watch**: every watch carries the full fee, as if each TD order held one watch. Multi-watch orders aren't split. Varies by TD, in CNY.

## TD Insurance
A seizure-protection fee paid to a [Trusted Dealer]: a percentage of the watch price (not price + shipping), with the rate varying by TD. Optional per watch, but taken by default, because in practice it is always paid. If customs seizes the parcel, the TD sends a replacement at no extra cost, so a seizure creates no new cost or status. The Item just stays in `item_shipout` until the replacement arrives. A business cost.

## Forwarder Shipping Fee
What the forwarder charges to ship an Item from China to the Philippines: **actual weight × per-kg rate** (no volumetric pricing, no rounding to a billing step). The forwarder weighs every Item on its own, even inside a Group Order, and a parcel's fee is just the sum of its Items' fees. The weight always includes the item's full original packaging (box, dust bag, fillers), because packaging is never removed, so for Bags the packaging is often a large share of the billed weight. A business cost, unlike the [Lalamove Fee].

## Weight Preset
The typical shipped weight, with full packaging, assumed for a China-route Item at quote time, before the forwarder has weighed it. Picked by category plus one quick class:
- **Shoes**: [Shoe Build] × EU size range (**≤ 42** or **43+**).
- **Bags**: [Bag Size].
- **Clothes**: [Clothing Weight].
- **Accessories**: one default.

Watches have no preset, because the TD route has no weight-based cost. Presets lean toward the heavy end of what has actually shipped, since the owner absorbs any underestimate. When the real weight is known up front (e.g. the seller lists it), a typed weight replaces the preset.

## Shoe Build
How bulky a shoe is, which together with EU size sets its [Weight Preset]. **Light**: thin, airy running-type shoes. **Regular**: low-profile everyday sneakers (e.g. Sambas, NB 530). **Chunky**: thick-soled or heavily padded sneakers (e.g. New Balance 9060/992, Kobe 6, Kayano 14). Build describes the shoe's silhouette, not its brand.

## Bag Size
**Small**: crossbody bags, minis, pouches, wallet-on-chain, anything worn crossbody or held in one hand. **Large**: everything else, including totes, backpacks, and medium-or-bigger handbags. A "Medium" bag counts as Large, because its box makes it ship nearly as heavy as a backpack.

## Clothing Weight
**Light**: tees, shirts, polos, shorts. **Heavy**: knitwear, cardigans, jackets, and sets.

## Estimated Shipping
[Weight Preset] (or a typed weight) × forwarder rate: the [Forwarder Shipping Fee] expected at quote time. Part of every China-route quote. A Bundle's Estimated Shipping is the plain sum of its lines. Recorded on the Item, so it can be compared with the actual fee once the forwarder weighs it. Any gap is the owner's: the customer was told a final price and is never re-billed.

## Profit Target
The single per-item profit added on top of cost and [Estimated Shipping] to form a quote. One value for every China-route category. **Watches have their own, higher Profit Target**, because a TD watch costs many times more than anything else and carries more risk. It replaces the old per-category markups, which were rough stand-ins that mixed shipping and profit together.

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
The Orders list shows Group Orders and Solo Items in a single mixed list. A Group Order appears as an opaque summary row (customer name, item count, lagging status, combined selling price, combined profit). Clicking the group row navigates to the Group Order detail page. There is **no manual expand toggle** — a group is opaque by default and reveals its items inline only under a [Partial Group Match]. Each revealed sub-row links directly to that item's detail page.

## Partial Group Match
How the Orders list filters *into* a Group Order rather than treating it as one atomic unit. The three item-level dropdown filters — **Status**, **Category**, **QC** — match against a group's individual member items (an item qualifies only if it matches *every* active dropdown). This replaces the older "a group matches or hides whole" rule, whose status filter compared against the group's single derived [Group Status] and so hid a group whenever its lagging item disagreed (e.g. a group of 3 `qc_sent` + 2 `ordered` items vanished under a `qc_sent` filter).

Rendering depends on how many members match:
- **No dropdown active** — opaque summary row, full bundle money. (Search alone never drills: a search hit reveals the *whole* group, because searching a customer name means "show this customer's entire bundle.")
- **Full match** (every member qualifies) — identical to no-filter: opaque row, full money. An expanded row is therefore always a reliable signal that *some members are hidden*.
- **Partial match** (some members qualify) — the group auto-reveals, listing **only** the matching items as read-only sub-rows, with a "N of M match" marker. **Money is hidden** in this state on both the band and the sub-rows — a subset of a bundle has no honest price, since the customer pays one negotiated total for the whole group that is never redistributed to items (see [Offer Total]). Money returns when the filter is cleared.

The reveal is **filter-driven only** — there is no persistent expand affordance — and applies across every group surface (All feed, Bundles table, mobile list, grid card).

## Customer Profile Page
A dedicated page per Customer. Shows: customer name, total orders, total profit, and a list of all their orders (both Solo Items and Group Orders). Accessible from a Customers section in the sidebar — similar in structure to the Sellers section. The order history list uses the same mixed layout as the main Orders list (expandable group rows + solo item rows), filtered to that customer.

## Solo Item
An Item that is not part of any Group Order. Appears as an individual row in the Orders list.

## Quote Calculator
The `/calculator` screen — a pre-sale tool for quoting a customer. Computes a single item's **suggested selling price**: `cost + [Estimated Shipping] + [Profit Target]`. Watches carry no Estimated Shipping, since TD-route costs are fully known. Stateless and ephemeral — nothing it produces is persisted. Distinct from creating an actual Item or Group Order.

## Bundle
An **ephemeral, calculator-only** collection of computed item quotes used to price a multi-item order *before* the sale. A Bundle exists only in the Quote Calculator screen during one session — it is **not itself** persisted and is **not** a Group Order. (A Group Order is the persisted entity in the `orderGroups` table; a Bundle is a negotiation scratchpad.) Items are added one at a time via "Add to bundle". A Bundle is **throwaway by default**, but can be **promoted** into a Group Order in one step — see [Save as Group Order]. Promotion is one-way: it seeds a brand-new Group Order from the Bundle, then the Bundle is discarded.

## Save as Group Order
The one-way action that **promotes** a Bundle into a persisted Group Order. Available on the Quote Calculator whenever the Bundle is non-empty. It opens the **Group Review Sheet**; on confirmation it creates one `orderGroups` row plus one real `items` row per Bundle line, carries the negotiated [Offer Total] across as the group's `negotiatedTotal`, then navigates to the new Group Order detail page and clears the Bundle.

## Group Review Sheet
A full-height overlay on the Quote Calculator (not a separate route, so Bundle state survives — "Cancel" returns to the untouched Bundle). It is the **finalize** step of [Save as Group Order]. Collects the one Customer for the whole group and, per Bundle line, the fields a real Item requires that the calculator never captured: **name**, **seller**, and **size** (EU number for shoes, S/M/L/XL for clothes, none for watches/accessories/bags — enforced by `validateItemRules`). A shoe's EU size is already entered in the calculator, because it picks the [Weight Preset], so it arrives prefilled. Each line's [Shoe Build] and [Estimated Shipping] also carry onto the new Item. Each line's computed quote is shown read-only and becomes that Item's `sellingPrice`. The negotiated total is pre-filled from the [Offer Total] and stays editable for a last-second round number. Seeded Items are created as `status: "ordered"` with weight blank and all other fields defaulted exactly as a freshly-ordered Item; their actual forwarder shipping fee stays unknown until they are weighed, and until then their profit rests on [Estimated Shipping].

## Bundle Quote
The sum of the suggested selling prices of all items in a Bundle, before any discount. The starting point the customer haggles down from.

## Offer Total
The negotiated bundle price the customer proposes/agrees to — typed into the calculator. The discount is derived as `Bundle Quote − Offer Total`, shown as both an amount and a percentage. The discount is **never redistributed** back onto individual item quotes — it lives only at the bundle level. (This mirrors the Group Order pricing model: a group-level override, not a per-item rewrite.) On [Save as Group Order] the Offer Total carries across verbatim as the new group's `negotiatedTotal` — but only when a discount was actually given (offer < [Bundle Quote]); at full price it is left null and the group shows full price, identical to setting it by hand. `quotesSumAtEntry` snapshots the Bundle Quote so the group's "stale" warning works from creation.

## Break-even Floor
The sum of item **costs plus [Estimated Shipping]** in a Bundle: the lowest Offer Total before the order is expected to lose money. The calculator surfaces this as the "how low can I go" anchor during negotiation.

## Estimated Margin
`Offer Total − Break-even Floor`. The calculator's profit readout. It counts [Estimated Shipping], so it is a real expectation rather than an optimistic one. It only turns final once the forwarder has weighed every China-route line. An all-watch Bundle's margin is already final, since TD-route costs are fully known.

Formerly the **Pre-shipping Margin**, which left shipping out entirely. That made light items look more profitable than they were and hid losses on heavy ones like Bags and chunky shoes. The weight-aware revision ([ADR 0005](docs/adr/0005-estimated-shipping-in-quote.md)) replaced it.
