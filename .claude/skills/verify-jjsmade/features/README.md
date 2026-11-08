# JJSMade verification map

This directory is the maintained source for verifying what the owner sees in JJSMade. Read this index, then follow the matching feature file as the recipe. `V` means `node .claude/skills/verify-jjsmade/scripts/verify.mjs`, run from the repo root.

## Baseline preconditions

- `V up` printed `READY`, and `V doctor` printed `HEALTHY`. The backend is the local scratch deployment, never the cloud deployment in `.env.local`.
- The database is empty. `up` always starts fresh. Recipes create the customers and sellers they need through the UI.
- The browser is signed in. Follow [sign-in](./sign-in.md) once per `up`.
- Never drive an instance that this run did not start.

## Driving conventions

- Start each recipe from the baseline unless its preconditions say otherwise. Recipes that build on one another say so.
- Prefer roles and accessible names, then labels, then placeholders. Fall back to text only where the app gives no name, as with the Orders filter dropdowns.
- Treat every command as literal. Routes and `--matches` patterns have no leading slash.
- Confirm saved data with `V data <table>`. Use `V run` only for preconditions the UI cannot reach.

## Proof and skip reporting

- Capture the user action and the resulting state: a snapshot before submitting and a snapshot after.
- UI proof is an ARIA snapshot plus a screenshot, both under `.verify/artifacts/<feature-id>/`.
- If the change touches what the owner sees, also follow "Visual verification" in [SKILL.md](../SKILL.md). Capture desktop and 390 px mobile screenshots, open every PNG, and report what it shows.
- Saving proof also includes the stored row from `V data <table>`, read separately from the UI.
- Record the commit printed by `V doctor` with the artifacts.
- If a step cannot run, report the command you tried and the precondition that was missing. Do not report an entry point as verified because a different path worked.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph that describes the behavior. It then has exactly four H2 sections, in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify.mjs`, and `Gotchas`.

## Features

- [Sign in](./sign-in.md) covers the admin password gate, a wrong password, and redirecting protected routes.
- [Create an order](./create-order.md) covers the Add Item form, creating a customer inline, computed cost and profit, and the order detail page.
- [Group order from the calculator](./group-order-from-calculator.md) covers building a bundle, an offer below the quote, the review sheet, and the stored group with its items.
- [Orders list partial group match](./orders-filter.md) covers dropdown filters that reveal only the matching members of a group and hide group money.
- [Exchange rate setting](./settings-exchange-rate.md) covers saving Settings and new orders picking up the rate.
