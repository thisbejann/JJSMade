# Orders list partial group match

The Orders list mixes solo items and group rows. The Status, Category, and QC dropdowns match a group's individual items. A group with only some matching items reveals just those items, marked `N of M match`, and hides money.

## Sub-features

- `filter-none`: with no dropdown set, a group is one row that shows its money.
- `filter-partial`: some items match. The group row shows `N of M match`, and only the matching items appear as links.
- `filter-full`: all items match. The row looks the same as with no filter.
- `filter-clear`: `Clear` restores the unfiltered list.
- `filter-tabs`: the `All`, `Bundles`, and `Items` lens buttons.

## How to get to it (user POV)

- Sidebar `Orders`, then the dropdowns above the list.

## Driving it with verify.mjs

Preconditions:

- Signed in, with the group from [group-order-from-calculator](./group-order-from-calculator.md): `Verify Dunk Low` (shoes) and `Verify Hoodie` (clothes) for `Verify Customer`.

- **Unfiltered.** Run `V browser goto --route orders` and `V browser expect --text "Verify Customer"`.
- **Partial match.** Run `V browser click --text "All Categories" --exact` and then `V browser click --role option --name "Clothes"`. Then run `V browser expect --text "1 of 2 match"` and `V browser expect --role link --name "Verify Hoodie"`.
- **Hidden member.** Run `V browser expect --role link --name "Verify Dunk Low" --absent`.
- **Proof.** Run `V browser snapshot --path orders-filter/partial.aria.txt` and `V browser screenshot --path orders-filter/partial.png`. The group link reads `... Verify Customer Ordered bundle 1 of 2 match` with no ₱ amount.
- **Clear.** Run `V browser click --role button --name "Clear"` and `V browser expect --text "1 of 2 match" --absent`.

## Gotchas

- The dropdowns have no accessible name. Address them by their current text (`All Statuses`, `All Categories`, `All QC`).
- Search alone never reveals a group's items. Only the dropdowns do.
- Below the `sm` breakpoint a different mobile list renders. The harness window is 1440 px wide, so these recipes cover the desktop list only.
