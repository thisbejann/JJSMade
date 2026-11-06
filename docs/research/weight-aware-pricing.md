# Research: Weight-aware pricing for the Quote Calculator

_Researched 2026-11-06. Scope: how to price the [Forwarder Shipping Fee] into an all-in quote that is final up front, for a one-person China→PH reseller who wants as few settings as possible. Vocabulary follows `CONTEXT.md`._

## TL;DR

**Recommendation: use Option A, kept small, and have it learn from your own data over time (D) once there is enough of it.**

```
quote = cost + roundUp(estimatedKg, billingStep) × forwarderRate + profitTarget
```

- **Replace the three category markups with one setting, `profitTarget`.** `forwarderRate` already exists, so the total number of pricing settings goes down from 3 to 1.
- **Estimated kg comes from a per-category default kept in code, not in Settings.** Bags get a **Small / Large** chip. Every category also gets an optional "kg" field you can type into, for the odd item you can actually guess.
- **Round the estimate up to the forwarder's billing step.** Carriers almost always bill in 0.5 kg or 1 kg steps (see Finding 1), so rounding up is your safety buffer. You don't need a separate buffer percentage.
- **Phase 2 (D):** once a category has about 8 or more Items with a recorded `weightKg`, its default becomes the **75th percentile** of those weights (a value 75% of past items came in under), not the median. Before that, it falls back to the hardcoded default. You maintain nothing; the defaults sharpen as you enter weights, which you already do.
- **Why this over the alternatives.** Weight is the only cost that varies at quote time, and it is 30–60% of the markup. A flat markup (B) or a percentage (E) can't follow it. Bands (C) amount to A with coarser rounding, and the bag chips already work as bands.

**The one open fact that changes the numbers:** how *your* forwarder rounds billed weight (0.1 / 0.5 / 1 kg, any first-kg minimum) and whether it rounds per Item or per consolidated parcel. Every official carrier source found rounds up. No PH China-forwarder terms could be verified online (see Finding 1).

## Today's math (why it breaks)

At ₱480/kg, shipping takes this much out of the flat markup (current numbers from `src/lib/constants.ts` `DEFAULTS`):

| Item (actual kg) | Flat markup | Shipping @ ₱480 | Real profit | If billed rounded up to 0.5 kg |
|---|---|---|---|---|
| Clothes 0.4 | 750 | 192 | **558** | 240 → 510 |
| Watch 0.4 | 850 | 192 | **658** | 240 → 610 |
| Shoes 1.0 | 850 | 480 | **370** | 480 → 370 |
| Shoes 1.3 | 850 | 624 | **226** | 720 → 130 |
| Shoes 1.7 | 850 | 816 | **34** | 960 → **−110** |
| Bag 2.5 | 850 | 1,200 | **−350** | 1,200 → −350 |

Profit across these items runs from −₱350 to +₱658 under one "markup", which is the problem `CONTEXT.md` [Pre-shipping Margin] already describes.

## Options comparison

| Option | Accuracy | Maintenance | Effort in this codebase | Risk of loss |
|---|---|---|---|---|
| **A. cost + est.kg × rate + profit** (in-code defaults, bag S/L chip, optional kg) | High for shoes and clothes; medium for bags (S/L covers most of the spread) | **Lowest**: 1 setting (`profitTarget`); defaults live in code | Medium: add `bags` category (schema union in `items` and `personalItems`, `CATEGORY_CONFIG`, `validateItemRules` size rule "none"), change calculator formula, migrate 3 settings → 1 | Low; only when the actual weight beats the rounded-up estimate |
| **B. Flat markup + new Bags markup** | Low; still weight-blind within a category (1.0 vs 1.7 kg shoes = ₱336 swing) | 4 settings to tune by feel | Small: new category plus one setting | Medium: heavy shoes and large bags can still lose money |
| **C. Weight bands** (≤1 / 1–2 / 2–3 kg → fixed add-on) | Medium; error up to one band width (₱480) | You keep a band table, or hardcode it | Medium, same as A plus a band picker | Low if you pick the band conservatively |
| **D. Self-calibrating default** (stat of past `weightKg` per category) | Highest over time; poor at cold start | **Zero** | Medium: one Convex query over `items` by `by_category`, fallback constants | Low with P75; higher with the median (half of items land above it) |
| **E. % markup / max(floor, %)** | Low; tracks *price*, not weight (a cheap bag is still 2.5 kg) | 1–2 settings | Small | **High** for cheap heavy items, the exact failing case |
| **Recommended: A + rounding, then D** | High | 1 setting, defaults self-update | A now, D as a small follow-up | Low |

Notes:
- **C vs A.** When you quote you rarely know the weight to 0.1 kg anyway, so A's "Small / Large" chips *are* bands. The difference is that A's bands are `kg × rate`, so they follow the rate setting automatically, while C's peso add-ons need re-tuning every time the rate changes.
- **E fails the core case.** A percentage markup scales with item cost, and bag weight comes mostly from packaging (`CONTEXT.md` [Forwarder Shipping Fee]), not price. A max(fixed floor, %) hybrid is still blind to weight.
- **Variable cost pass-through is the textbook-appropriate structure here.** Variable cost-plus pricing "adds a markup to the total amount of variable costs incurred". It suits businesses where variable costs are most of the cost, and its cost basis "makes pricing decisions easier to explain" to customers ([AccountingTools](https://www.accountingtools.com/articles/variable-cost-plus-pricing.html)). Shipping is a variable cost per Item, so it belongs *inside* the cost base, not hidden in the markup. The known weakness is that pure cost-plus ignores what the market will pay ([AccountingTools](https://www.accountingtools.com/articles/variable-cost-plus-pricing.html); see also Dholakia, ["When Cost-Plus Pricing Is a Good Idea", HBR 2018](https://hbr.org/2018/07/when-cost-plus-pricing-is-a-good-idea), which notes cost-plus "remains the most widespread pricing method"; only the intro was readable). The Offer Total negotiation is where that market check already happens, so this weakness matters less for this app.

## Findings

### 1. How carriers and forwarders bill weight

- **Every official carrier source found rounds billed weight *up*, usually to the next 0.5 kg.**
  - DHL Express (UK): "Parcel weight is rounded up to the nearest half kilo", and "the greater of the two weights [actual vs volumetric] will be used" ([DHL UK measuring & weighing advice](https://uk.express.dhl.com/measuring-and-weighing-advice/)).
  - DHL's Brazil guide (seen in search results only; the page timed out when fetched) says billing weight rounds up to the next 0.5 kg up to 30 kg, then to the next 1 kg, and each piece rounds separately ([DHL Brazil](https://www.dhl.com/discover/en-br/logistics-advice/essential-guides/volumetric-weight-brazil)). _Unverified directly._
  - UPS: actual weight is rounded up to the next half kg up to 20 kg, then to the next whole kg, for Express services; Expedited services round to the next whole kg. Billable weight is the greater of actual and dimensional ([UPS SG Rate & Service Guide](https://ups.com/assets/resources/webcontent/en_GB/Rates_and_Service_Guide_preview_SG.pdf); [UPS PH dimensions & weight](https://www.ups.com/ph/en/support/shipping-support/shipping-dimensions-weight)). _Read via search snippets; ups.com blocked direct fetch._
  - FedEx: the official pages blocked fetching. A copy of a FedEx international rate document says any fraction of a kg rounds up to the next weight break ([Scribd copy of FedEx PH 2022 rates](https://www.scribd.com/document/639022702/fedex-rates-ipd-en-ph-2022)). _Secondary; unverified._
- **China proxy-buyer pricing uses a "first weight + additional weight" structure.** Superbuy's official fee page gives an example: "CN¥ 320 (First Weight 500g) + CN¥ 50 (Continued Weight 500g)". It charges shipping "based on the estimated weight of your parcel", then reconciles against the carrier's bill, refunding overpayment or "collect[ing] the balance for any underpayment" ([Superbuy fee composition](https://www.superbuy.com/en/page/guide/feecomposition)). Your customers can't be re-billed, so you carry the underpayment side yourself. That asymmetry is the case for rounding up.
- **Charging on actual weight, as your forwarder does, is a real PH model.** Buyandship PH says it charges on actual weight rather than volumetric weight ([buyandship.ph shipping](https://www.buyandship.ph/features/shipping); [weight & size guide](https://www.buyandship.ph/blog/buyandship-weight-size-guide)). _Seen in search snippets only; the site is behind Cloudflare. Rates and rounding there are per-lb and not China-specific._
- **No official terms for small PH "China forwarders" (Guangzhou warehouse → Manila, per-kg) could be found.** These usually publish rates on Facebook or Viber, not on crawlable pages. **Ask your own forwarder** (see Open questions).
- **Effect of rounding on the estimate:** rounding up to 0.5 kg adds ₱0–240 per parcel (about ₱120 on average) at ₱480/kg. Rounding to 1 kg adds ₱0–480 (about ₱240 on average). If several Items ship as **one consolidated parcel**, the rounding hits once per parcel, not once per Item, so rounding each Item up over-reserves a little on Bundles. That is a safe-side error, and it gives you room to discount the Offer Total.

### 2. How cross-border sellers put shipping into a price

- **Weight-class defaults plus a packaging allowance is the standard e-commerce pattern.** Shopify's weight-based rates add a *default package weight* to each product's weight, then look the total up in weight tiers. A cart that falls between tiers goes to the next-highest tier, and products with no weight count as weightless and under-charge ([Shopify: packages & weights](https://help.shopify.com/en/manual/fulfillment/setup/packaging/packages-and-weights); [Shopify: troubleshooting rates](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting)). _Read via search summaries._ Lessons for this app: (a) the per-category default must *include packaging*, which `CONTEXT.md` already requires; (b) a missing estimate must never silently count as 0 kg.
- **Quoting one all-in price is "landed cost", and the seller who guarantees it charges for the risk.** Zonos defines landed cost as the total cost of an international purchase by the time it arrives, shown before payment. Under its guarantee, "if customs charges more than we quoted, we pay the difference", for a fee of 2 USD + 10% of duties and fees ([Zonos landed cost guarantee](https://zonos.com/docs/global-ecommerce/landed-cost/guarantee); [pricing](https://zonos.com/docs/global-ecommerce/landed-cost/pricing); [inclusive pricing](https://zonos.com/inclusive-pricing)). Your no-re-billing promise is the same guarantee, so the round-up (or P75) is your version of that risk fee.
- **Proxy buyers (Superbuy) avoid the risk by billing shipping in a second stage after weighing** ([Superbuy](https://www.superbuy.com/en/page/guide/feecomposition)). That option is ruled out here (final price up front), which is why the estimate has to sit on the safe side.

### 3. Handling estimate error

- **The losses are lopsided.** Under-estimating by 0.5 kg costs ₱240 straight off profit with no recourse. Over-estimating by 0.5 kg makes the quote ₱240 higher, and part of that usually comes back as Offer Total room. So aim at an upper value, not the average: round up to the billing step and, in phase D, use P75 rather than the median. This is my reasoning from the constraints, not a cited rule. The closest cited analogue is the carriers' own round-up rules and Zonos charging a fee for guaranteeing landed cost (above).
- **Keep it to one buffer.** Rounding up *and* adding a percentage buffer double-counts. Rounding up to 0.5 kg already adds about 0.25 kg on average.

### 4. Typical boxed weights (weak data; mark as placeholders)

No brand or retailer publishes official shipping-weight specs for boxed shoes or bags. Everything found is secondary:
- Boxed sneakers: ~1.45–1.6 kg with outer carton for retail Air Jordan 1 ([comgateway blog](https://www.comgateway.com/blogs/buying-the-2026-nike-air-jordan-1-bred-from-us-retailers-is-cheaper-than-local-belgian-resale/)); ~0.95 kg box-only per a rep-buyer estimator ([jordanspreadsheet](https://jordanspreadsheet-org.pages.dev/tools/shipping-estimator.html)). **Weak.**
- Boxed handbags: "1–4 lbs" (~0.45–1.8 kg) per a shipping-label vendor ([shippinglabel.co](https://shippinglabel.co/how-to-ship/handbags)). This sits below your observed 2.5 kg, which suggests box-plus-filler packaging from China sellers is heavier than Western retail. **Weak.**
- **Your own `weightKg` history is the best data source available, far better than any of the above.** It is exactly why Option D works. Starting defaults below are placeholders until the owner checks them against recorded weights.

Suggested starting defaults (in code, already rounded to 0.5 kg):

| Category | Default kg | Source |
|---|---|---|
| Shoes | 1.5 | Owner: 1.3–1.7 kg typical; secondary sneaker data above |
| Clothes | 0.5 | _Guess; verify against history_ |
| Watches & Accessories | 0.5 | _Guess; watch boxes vary; verify_ |
| Bags (Small / Large) | 1.5 / 2.5 | Owner's 2.5 kg example; Small is a guess |

Illustration with `profitTarget = ₱400`. The ₱400 figure comes from the March 2026 revision notes and is to be confirmed. Markup-equivalent: shoes 720+400 = ₱1,120 (+₱270 vs today); clothes and accessories 240+400 = ₱640 (−₱110 / −₱210 vs today); bags ₱1,120 / ₱1,600. **Light items get cheaper under this formula.** See Open questions.

## Implementation sketch (for when it's built; not a spec)

- `src/lib/pricing.ts` (new, pure): `estimateShippingPHP(category, sizePreset?, kgOverride?, rate, step)` → the calculator and any test share one function.
- Calculator: `customerQuote = totalCost + estShipping + profitTarget`. The Bundle's Break-even Floor and [Pre-shipping Margin] then *include* estimated shipping, which removes the "excl. forwarder shipping" caveat. That changes a documented glossary term, so update `CONTEXT.md` and consider an ADR.
- Settings: replace `calculatorMarkup*` (3 fields) with `calculatorProfitTarget` in `convex/schema.ts` and `convex/settings.ts`. Keep old fields optional for history.
- D (phase 2): a Convex query over `items` using the existing `by_category` index, filtered to `weightKg > 0`. Return P75 per category when n ≥ 8, otherwise null → fallback constant. Bags S/L can't self-calibrate unless the preset is stored on the Item. Store it, or keep bag defaults hardcoded.

## Open questions for the owner

1. **Forwarder rounding:** does your forwarder bill per 0.1 kg, per 0.5 kg, or per whole kg? Is there a minimum or first-kg charge? Is it rounded **per Item or per consolidated parcel**? This sets `billingStep`.
2. **Profit target:** is ₱400 per Item still the number, and should it be one value for all categories? (One value is what keeps Settings minimal.)
3. **Lighter items getting cheaper:** with one profit target, clothes and accessories quotes drop about ₱110–210. Do you want that (more competitive), or a floor of "never below today's price" (keeps the bigger margins, adds a rule)?
4. **Your real weights:** can you export or eyeball recorded `weightKg` by category (Settings or Orders) to replace the guessed defaults? This research did not touch the live deployment.
5. **Bags:** are Small / Large enough, or do you regularly see very different bag weights (mini bag ~1 kg vs large tote 3 kg+)?
6. **Bundles:** do multi-item Group Orders usually ship as one parcel? If so, per-Item rounding over-reserves, which is fine, but worth knowing when you set the Offer Total.
7. **Forwarder-buy mode:** does the forwarder-buy path have the same ₱/kg rate and rounding as regular mode?
