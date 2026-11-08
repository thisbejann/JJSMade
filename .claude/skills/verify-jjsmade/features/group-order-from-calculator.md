# Group order from the calculator

The owner quotes items in the Quote Calculator, collects them in a bundle, and types a discounted offer. With `Save as Group Order` and the review sheet, the bundle becomes one `orderGroups` row plus one `items` row per line, all for one customer.

## Sub-features

- `bundle-add`: `Add to bundle` adds a quote. The `Bundle` tab shows the count.
- `bundle-offer`: an offer below the bundle quote shows the discount.
- `bundle-review`: the review sheet needs a customer and each line's name, seller, and size before it can submit.
- `bundle-save`: `Create group order` opens `/groups/<id>` with the negotiated total.
- `bundle-stored`: the group has `negotiatedTotal` and `quotesSumAtEntry`, and its items share its `customerId`.

## How to get to it (user POV)

- Orders header: choose `More create options`, then `New Group Order`. This opens `/calculator`.
- Top bar `Quote Calculator` link.

## Driving it with verify.mjs

Preconditions:

- Baseline, signed in. The default markups apply: shoes +850 and clothes +750. Local shipping defaults to 10 CNY.
- If no customer exists yet, choose `Create "Verify Customer"` in the review-sheet step instead of the existing option.

- **Quote shoes.** Run `V browser goto --route calculator`, `V browser fill --label "Item Price (CNY)" --value 500`, and `V browser click --role button --name "Add to bundle"`.
- **Quote clothes.** Run `V browser fill --label "Item Price (CNY)" --value 300`, `V browser click --role button --name "Clothes +750"`, and `V browser click --role button --name "Add to bundle"`.
- **Offer.** Run `V browser click --role button --name "Bundle"`, `V browser fill --placeholder "0.00" --value 7500`, and `V browser expect --text "Discount ₱496.00"`. The bundle quote is ₱7,996.00, made of ₱4,828.00 and ₱3,168.00.
- **Review sheet.** Run `V browser click --role button --name "Save as Group Order"` and `V browser expect --role dialog --name "Review group order"`. Then pick the customer with `V browser fill --within "Review group order" --role combobox --name "Customer" --value "Verify Customer"` and `V browser click --role option --name "Verify Customer"`.
- **Line 1 (shoes, open by default).** Run `V browser fill --within "Review group order" --role textbox --name "Item name" --value "Verify Dunk Low"`, `V browser fill --within "Review group order" --role combobox --name "Seller" --value "Verify Seller"`, and `V browser fill --within "Review group order" --role spinbutton --name "EU" --value 43`, then `V browser press --key Enter` to move on to line 2. Typing never advances; to check that, click the EU field and `press` each digit instead of using `fill`.
- **Line 2 (clothes).** Run `V browser fill --within "Review group order" --role textbox --name "Item name" --value "Verify Hoodie"` and `V browser fill --within "Review group order" --role combobox --name "Seller" --value "Verify Seller"`. Then run `V browser click --within "Review group order" --role option --name "Verify Seller"` and `V browser click --within "Review group order" --role button --name "M" --exact`.
- **Before save.** Run `V browser snapshot --path group-order/sheet.aria.txt`. It shows `Items ready 2 / 2` and the `Create group order` button.
- **Save.** Run `V browser click --within "Review group order" --role button --name "Create group order"` and `V browser url --matches '^groups/[a-z0-9]+$'`.
- **Proof.** Run `V browser snapshot --path group-order/detail.aria.txt`. It shows heading `Verify Customer`, `Negotiated bundle total` 7500, `List total (sum of quotes) ₱7,996.00`, `Bundle discount (6.2%) −₱496.00`, and rows for `Verify Dunk Low` and `Verify Hoodie`. Then run `V data orderGroups` and `V data items`. The group has `negotiatedTotal: 7500` and `quotesSumAtEntry: 7996`, and both items have its `orderGroupId`, the same `customerId`, and `status: "ordered"`.

## Gotchas

- If a line is already expanded, clicking its header collapses it. Enter or a clothes-size tap moves to the next incomplete line, so do not click the line 2 header after line 1 is complete.
- A Seller combobox list that is still open blocks the size buttons. Click the seller option first.
- The offer field's accessible name is its placeholder, `0.00`. In the Bundle view it is the only field with that placeholder.
- An offer equal to the bundle quote saves no `negotiatedTotal`. That is the documented full-price case, not a bug.
- The bundle exists only in browser state. Reloading the page or calling `goto` clears it.
