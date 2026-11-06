# Estimated shipping is part of the quote, from in-code weight presets

## Status

Accepted

## Context

The Quote Calculator priced every item as `cost + flat per-category markup` (Shoes ₱850, Clothes ₱750, Watches & Accessories ₱850). That markup had to cover both the [Forwarder Shipping Fee] and profit, but the fee scales with weight (₱480/kg, actual weight, full packaging, no rounding, each Item weighed on its own). So profit swung with weight. On real past orders, at today's rate:

| Item | Markup | Shipping | Profit |
|---|---|---|---|
| Accessory 0.2 kg | 850 | 96 | +754 |
| Shoes 1.7 kg | 850 | 816 | +34 |
| Bag 3.3–3.4 kg | 850 | ~1,600 | about −750 |

Bags had no category of their own (they were filed under Clothes, Shoes and Watches & Accessories) and lost money on almost every order. The customer must be told one final price up front and is never re-billed. The owner also wants as little upkeep as possible: few settings, and nothing to tune by feel.

Research and the weight history behind the presets are in `docs/research/weight-aware-pricing.md`.

## Decision

- **Quote = cost + [Estimated Shipping] + [Profit Target]** for China-route Items. Watches (TD route) add no estimated shipping.
- **Estimated Shipping = [Weight Preset] × forwarder rate.** It is not rounded, and a Bundle's estimate is the plain sum of its lines, matching how the forwarder bills.
- **Weight Presets live in code, not in Settings.** Starting values, taken from the owner's recorded weights and leaning heavy:

  | Category | Class | Preset |
  |---|---|---|
  | Shoes | Light ≤ 42 / 43+ | 0.8 / 0.9 kg (no data yet; guess) |
  | Shoes | Regular ≤ 42 / 43+ | 1.1 / 1.2 kg |
  | Shoes | Chunky ≤ 42 / 43+ | 1.5 / 1.7 kg |
  | Bags | Small / Large | 1.5 / 3.5 kg |
  | Clothes | Light / Heavy | 0.5 / 1.0 kg |
  | Accessories | — | 0.5 kg |

  A typed weight overrides the preset for one quote.
- **One Profit Target (₱400) replaces the per-category markups** in Settings.
- **Bags becomes its own category**, with no size and on the China route. The 6 past bag orders are reclassified into it.
- **Each Item records its estimate**: the shoe size, [Shoe Build] and estimated weight carry from the calculator through the [Group Review Sheet] onto the Item. Once the real weight is entered, the Item shows estimated vs. actual shipping.
- **The owner absorbs any underestimate.** Presets are tuned by hand, in code, when a gap keeps recurring.

## Considered Options

- **Keep flat markups and add a bigger Bags markup.** Rejected: it still ignores weight within a category. Chunky and slim shoes differ by about ₱240, and Small and Large bags by about ₱960.
- **Percentage markup, or max(floor, %).** Rejected: it follows the item's price, not its weight. A cheap heavy bag is exactly the case that loses.
- **Fixed peso shipping bands per weight range.** Rejected: it's the same idea as presets with coarser steps, and every band needs re-tuning whenever the forwarder rate changes.
- **Weight presets editable in Settings.** Rejected: the owner explicitly doesn't want more settings to maintain, and the presets rarely change.
- **Self-calibrating presets** (P75 of recorded weights per class). Deferred, not rejected. It needs a few weighed Items per class first, which is why each Item now records its estimate and build.
- **Rounding estimates up to a billing step as a safety buffer.** Rejected: the forwarder doesn't round, so the buffer lives in the presets instead.

## Consequences

- Prices shift. Clothes and accessories quotes fall by about ₱100–250, while shoes rise by about ₱100–300 and bags by about ₱300–1,300. The owner accepted this; to earn more overall, raise the single Profit Target.
- The calculator's margin now includes estimated shipping. **Pre-shipping Margin** is renamed **[Estimated Margin]**, the "excl. forwarder shipping" caveat goes away, and the [Break-even Floor] rises to include shipping.
- Shoe quoting needs the EU size and a Build up front, which is one extra choice per shoe line. The size carries into the Group Review Sheet, so it's still entered only once.
- Changing a preset is a code change and a deploy, not a settings edit. That is deliberate.
- Items created through ItemForm (outside the calculator) have no recorded estimate, so they show no estimate-vs-actual gap.
