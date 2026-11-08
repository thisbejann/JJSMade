# Exchange rate setting

The owner sets the CNY to PHP rate and the defaults in Settings. New orders pick up the saved rate. Existing items keep the rate they were saved with.

## Sub-features

- `settings-save`: `Save Settings` saves, and the toast reads `Settings saved`.
- `settings-new-order`: the Add Item form's `Exchange Rate (CNY to PHP)` uses the new rate.
- `settings-snapshot`: rows saved earlier keep their `exchangeRateUsed`.

## How to get to it (user POV)

- Top bar `Settings` link (`/settings`).

## Driving it with verify.mjs

Preconditions:

- Baseline, signed in. Visit any page that reads settings first, so the row exists. `/settings` itself does this.

- **Edit.** Run `V browser goto --route settings`, then `V browser fill --role spinbutton --name "CNY to PHP Rate" --value 8.1`.
- **Save.** Run `V browser click --role button --name "Save Settings"` and `V browser expect --text "Settings saved"`.
- **Stored.** Run `V data settings`. The output includes `"cnyToPhpRate": 8.1`.
- **New order uses it.** Run `V browser goto --route orders/new` and `V browser snapshot --path settings/new-order.aria.txt`. The snapshot shows `spinbutton "Exchange Rate (CNY to PHP)": "8.1"`.
- **Old rows unchanged.** If an item existed before the change, `V data items` still shows its original `exchangeRateUsed`.

## Gotchas

- This changes shared state for the rest of the run. Later recipes that assume 7.8 need it set back, or a fresh `up`.
