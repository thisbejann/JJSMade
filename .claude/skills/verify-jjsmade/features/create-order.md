# Create an order

The owner records one bought item for a customer on the Add Item form. The form computes PHP cost and profit, saves an `items` row with `customerId`, and opens the order detail page.

## Sub-features

- `order-open`: open the blank form from each entry point.
- `order-customer-create`: type a new customer name and choose `Create "<name>"`.
- `order-save`: save. The toast reads `Item created` and the app opens `/orders/<id>`.
- `order-costs`: the detail page and the stored row agree on `pricePHP`, `localShippingPHP`, `totalCost`, and `profit`.
- `order-list`: the new order appears in the Orders list.

## How to get to it (user POV)

- Choose the `Add Item` split button in the Orders header (desktop).
- Choose `More create options`, then `Add Item`.
- Open `/orders/new` directly.

## Driving it with verify.mjs

Preconditions:

- Baseline, signed in. The exchange rate is the default 7.8.

- **Open form.** Run `V browser goto --route orders` and then `V browser click --role button --name "Add Item" --exact`. Then run `V browser url --matches '^orders/new$'` and `V browser expect --label "Item Name *"`.
- **Item details.** Run `V browser fill --label "Item Name *" --value "Verify Jordan 4"`, `V browser fill --label "EU Size *" --value 42`, and `V browser fill --label "Seller *" --value "Verify Seller"`.
- **Pricing.** Run `V browser fill --label "Price in CNY *" --value 500`, `V browser fill --label "Local Shipping (CNY, Optional)" --value 10`, and `V browser fill --label "Selling Price (PHP)" --value 6000`.
- **Create customer.** Run `V browser fill --label "Customer *" --value "Verify Customer"` and then `V browser click --role option --name 'Create "Verify Customer"'`. The combobox now reads `Verify Customer`.
- **Before save.** Run `V browser snapshot --path create-order/filled.aria.txt`.
- **Save.** Run `V browser click --role button --name "Save Item"`, `V browser expect --text "Item created"`, and `V browser url --matches '^orders/[a-z0-9]+$'`.
- **Detail page.** Run `V browser snapshot --path create-order/detail.aria.txt` and `V browser screenshot --path create-order/detail.png --full`. The snapshot shows heading `Verify Jordan 4`, `Profit ₱2,022.00`, `₱3,978.00` as the paragraph before `Total Cost`, `Item Price ₱3,900.00`, `Local Shipping ₱78.00`, and `Size 42`.
- **Stored row.** Run `V data items > .verify/artifacts/create-order/items.jsonl` and `V data customers > .verify/artifacts/create-order/customers.jsonl`. The item has `pricePHP: 3900`, `localShippingPHP: 78`, `totalCost: 3978`, `profit: 2022`, `status: "ordered"`, and a `customerId` equal to the `_id` of `Verify Customer`.
- **List.** Run `V browser goto --route orders` and `V browser expect --role link --name "Verify Jordan 4"`.

## Gotchas

- Known bug at 7e84368, tracked in #40: the detail page's `Sale → Customer` shows `--` for orders created on this form. `OrderDetail.tsx` shows the legacy `customerName`, and `ItemForm` saves only `customerId`. Items seeded from a calculator bundle do get `customerName`. Report this. Do not fix it as part of verification.
- `Has Local Shipping?` starts switched on. Weight is blank, so `forwarderFee` is absent and profit leaves out shipping.
- Shoes require a numeric EU size and clothes require S, M, L, or XL. The form shows a toast and refuses to save otherwise.
- The Customers page's `Total Profit` counts only `delivered_to_customer` and `sold` items, so a new order shows ₱0.00 there by design.
