---
name: verify-jjsmade
description: Drive the real JJSMade web app (React + Vite + Convex) in a headless browser against a throwaway local Convex backend, and capture evidence. Use to prove a UI or Convex change works the way the owner uses it, such as creating an order, saving a calculator bundle as a group order, filtering Orders, or changing Settings. Never touches the cloud deployment in .env.local.
---

# Verify JJSMade

JJSMade is a single-user admin app. The user signs in with one admin password, then works in the sidebar pages (`/orders`, `/customers`, `/sellers`, `/analytics`, `/personal`) and the top-bar pages (`/calculator`, `/settings`). Every surface is the web UI. There is no CLI or public API.

All commands run from the repo root. They work in Git Bash and PowerShell. `V` below means `node .claude/skills/verify-jjsmade/scripts/verify.mjs`.

## Isolation: read this first

The repo's `.env.local` points at the owner's cloud dev deployment, which holds real business data. Never run `npx convex dev`, `npx convex run`, or `npm run dev` for verification. Use only this harness:

- The backend is an anonymous local Convex backend. It runs from a scratch copy of `convex/` in `%TEMP%\jjsmade-verify\run\project`, with a scratch home directory. That directory has no Convex login and no copy of the repo's `.env.local`, so the CLI has no way to reach the cloud.
- Vite runs from the repo itself, so frontend edits hot-reload. `VITE_CONVEX_URL` is set in the process env, which takes priority over `.env.local`.
- Fixed ports: Convex 3310, Convex site 3311, Vite 5199, Chrome debugging 9333. Only one instance can run at a time. `up` refuses if any port is busy. Never drive or kill an instance you did not start. If `up` reports a busy port, find out who owns it before you do anything.

## Launch

```bash
V up
```

`up` does the following:

1. Wipes the previous scratch run, so the database starts empty.
2. Copies `convex/`, `package.json`, and `tsconfig.json` into scratch, and links the repo's `node_modules` into it.
3. Starts `convex dev --local` there and waits for `Convex functions ready`.
4. Sets `ADMIN_PASSWORD=verify-password` on the local deployment.
5. Starts Vite on 5199 and headless Chrome on 9333.

The command is ready when it prints `READY app=http://127.0.0.1:5199 ...`. On first use it installs `playwright-core` into `%TEMP%\jjsmade-verify\tools` and downloads the Convex backend binary into `%TEMP%\jjsmade-verify\appdata`. Both are kept for later runs, and the first run takes about a minute.

Chrome is located automatically on the usual install paths. Set `VERIFY_CHROME_PATH` to point at a different binary.

After editing anything in `convex/`, run `V sync`. It copies the functions into scratch and waits until the local backend has pushed them. Frontend edits need no sync.

## Doctor

```bash
V doctor
```

This check is read-only. It verifies that:

- all three processes started by this run are alive;
- the backend, Vite, and the Chrome debug port answer;
- the app served by Vite talks to `127.0.0.1:3310`, not `*.convex.cloud`;
- the scratch deployment is `anonymous:` (local);
- the scratch functions match the working tree's `convex/`;
- the admin password is accepted.

It also prints the git commit and whether there are uncommitted changes, and it ends with `HEALTHY`. Run it first, and again whenever something looks off. If only the functions check is `BAD`, run `V sync`. If anything else is `BAD`, run `V down` and then `V up`.

## Drive

Each `V browser <action>` call attaches to the one headless Chrome tab, acts, and detaches. Page state carries over between calls, including the sign-in stored in localStorage. Actions:

| Action | Flags | Meaning |
|---|---|---|
| `goto` | `--route orders/new` | Open `http://127.0.0.1:5199/<route>`. Use `--route .` for the dashboard |
| `click` / `fill` / `expect` | a locator, plus `--value` for fill and `--absent` for expect | Act on, or wait for, the first match |
| `url` | `--matches '<regex>'` | Wait until the pathname without its leading `/` matches, then print it |
| `press` | `--key Escape` | Keyboard |
| `snapshot` | `--path <feature>/<name>.aria.txt` | Write the page's ARIA tree under `.verify/artifacts/` |
| `screenshot` | `--path <feature>/<name>.png`, plus optional `--full` (whole page), `--width <px> --height <px>` (viewport for this shot only), or a locator (just that element) | Write a PNG under `.verify/artifacts/` |

Locators:

- `--role <role> --name "<accessible name>"`, which matches a substring unless you add `--exact`;
- `--label "<exact label>"`;
- `--placeholder "<exact>"`;
- `--text "<text>"`, with optional `--exact`.

Add `--within "<dialog name>"` to search only inside a dialog, `--nth <i>` to pick a later match, and `--timeout <ms>` to change the 10 s default. A failed action exits 1 and saves a screenshot to `.verify/artifacts/failures/`.

Two rules come from Git Bash, which turns arguments that start with `/` into Windows paths:

- write routes and URL patterns without the leading slash (`--route orders/new`, `--matches '^orders/[a-z0-9]+$'`);
- use `--matches '^$'` for the dashboard.

Sign in first, as every journey needs it. The database is empty after `up`.

```bash
V browser goto --route login
V browser fill --label Password --value verify-password
V browser click --role button --name "Sign in"
V browser url --matches '^$'
```

To read stored rows, which is the second view a proof needs, use `V data <table>`. It prints JSON lines for `items`, `customers`, `orderGroups`, `sellers`, `settings`, or `personalItems`. `V run <module:function> '<json>'` calls a function on the local backend. Use it only to set up a precondition that the UI cannot reach, never as the proof.

The per-feature recipes are in [features/README.md](features/README.md). If a change touches a feature listed there, drive every entry point that file lists.

## Evidence

Put proof in `.verify/artifacts/<feature>/`. The directory is gitignored and survives `down`. A proof must meet all of these standards:

- **Real user path.** Drive the UI the way the owner would. Do not call mutations as a shortcut for the step under test.
- **Action and result.** Take a snapshot or screenshot of the filled form or the opened dialog before you submit, and another of the resulting page.
- **Side effects.** For anything that saves, also show the stored row with `V data <table>`, and check the computed fields: `pricePHP`, `totalCost`, `profit`, `customerId`, `orderGroupId`, `negotiatedTotal`.
- **Build identity.** Note the commit from `V doctor` together with the artifacts.

ARIA snapshots (`.aria.txt`) prove structure and text. Screenshots prove what the UI looks like, and for UI changes they are required (see below). The headless window is 1440×900, and its PNGs come out about 1424×805 once the window frame is removed. The app is always dark (`color-scheme: dark` in `src/index.css`). It has no light theme to check.

## Visual verification (UI changes)

Do this whenever a change touches what the owner sees: anything in `src/pages/`, `src/components/`, `src/index.css`, Tailwind classes, copy, or layout. Structural proof alone is not enough here. A page can have a perfect ARIA tree and still overflow, clip, or misalign.

1. **Capture every state the change affects, at both widths.** Desktop is the default viewport. Mobile is `--width 390 --height 844`. The owner works on both, and the layout changes at the `md` and `lg` breakpoints.

   ```bash
   V browser screenshot --path <feature>/desktop.png
   V browser screenshot --path <feature>/mobile.png --width 390 --height 844 --full
   V browser screenshot --path <feature>/row.png --role row --name "Jordan 4"   # crop to the changed element
   ```

   Also capture the states the change can reach: an open dialog or dropdown, an empty list, a validation error, long text such as a 60-character product name or a 7-digit ₱ amount, and a hover state if the change styles one.
2. **Look at every PNG.** Open each one with the Read tool. Do not just report the path. Check it against the Design Direction in the repo's `CLAUDE.md`, which aims for dark, dense, and refined in the style of Linear and Raycast. Look for text clipped or overflowing its container, rows wrapping where they should truncate, misalignment against neighboring elements, coral `#e07850` used only for accents, key numbers (prices, profit, status) easy to scan, and nothing that looks broken or unstyled.
3. **For a visual fix, show before and after.** Capture the broken state before you edit, if it can be reproduced, then capture the same state after. Vite hot-reloads, so neither capture needs a restart.
4. **Report what you saw,** not just that screenshots exist. Name each image and say in one line what it shows. List any visual defects, even ones outside the change, as findings.

Never fix a visual defect in product code just to make a verification pass. Report it.

## Cleanup

```bash
V down          # stop the processes this run started; delete the scratch run and its data
V down --purge  # also delete the cached tools and the Convex binary
```

`down` kills only the process IDs recorded in `%TEMP%\jjsmade-verify\run\state.json`, each with its child processes. It detaches the `node_modules` link before deleting scratch, so it never deletes inside the repo. It never touches `.verify/artifacts/`. Run `down` after every session, including failed ones.

## Gotchas

- Schema changes: `V sync` pushes the new schema to the local backend, but the repo's `convex/_generated/` is regenerated only by a real `npx convex dev` against the cloud. Vite does not type-check, so the app still runs. `npm run build` may fail with TS2339 until the owner regenerates. Report this. Do not run the cloud command yourself.
- The `settings` row is created the first time a page that reads settings loads, such as `/orders/new` or `/calculator`. `V data settings` is empty before that.
- Comboboxes (Customer, Seller, Batch) keep their option list open after `fill`, and the open list blocks clicks underneath it. Click the option, either the existing name or `Create "<name>"`, before you click anything else.
- `--full` screenshots draw fixed and sticky elements at their viewport position, so on mobile the Add Item form's bottom bar (`Cost ₱… / Save`) appears in the middle of the page image. That is an artifact of the capture, not a layout bug. Take a plain viewport shot to see where the bar really sits.
- A `--width` screenshot sets the viewport for that one call only. The next command is back at 1440×900, so pass the flags again on every mobile shot.
- The Orders filter dropdowns (`All Statuses`, `All Categories`, `All QC`, `Newest First`) have no accessible name. Open them with `click --text "All Categories" --exact`, then click the `option`.
