# PRD: Dashboard Overhaul

## Problem

The current dashboard is an analytics display that the user doesn't need. They don't monitor the app daily — they open it when there's an order to make. The dashboard shows 6 stat cards of equal weight, two chart panels, and a sidebar feed. It's slow to update, visually generic (AI slop), and doesn't match how the app is actually used.

## User Context

- **Who**: Single operator running a personal shopping/reselling business (China → Philippines)
- **When they open the app**: On-demand, when an order comes in — not for morning monitoring
- **What they need at a glance**: Pipeline state, profit this month, avg profit
- **Primary action**: Create a new order, check pending QC, track existing orders

## Design Direction

Dense, refined, alive. Linear/Raycast energy. No hero metric grids, no identical card layouts, no decorative elements. Typography and spacing do the heavy lifting. Animate meaningful moments only.

---

## Changes

### 1. Strip stat cards from 6 → 3

**Current**: 6 identical `StatCard` components in a uniform grid — Total Items, In Pipeline, Delivered This Month, Revenue, Profit, Avg Profit.

**New**: 3 metrics only, with visual hierarchy:
- **Profit This Month** — primary, largest, most prominent
- **Avg Profit** — secondary
- **In Pipeline** — secondary

Remove: Total Items, Delivered This Month, Revenue (Month). These are analytics — they belong on `/analytics`.

**Design**: Break the identical-card pattern. The primary metric (Profit) should be visually dominant — larger type, more vertical space. The two secondary metrics should be compact and subordinate. No icon-in-rounded-box treatment.

**Files**: `src/pages/Dashboard.tsx`, `src/components/dashboard/StatCard.tsx`

### 2. Add a prominent "New Order" action

**Current**: No way to create an order from the dashboard. User must navigate to `/orders/new` via sidebar.

**New**: A clear, primary call-to-action on the dashboard to create a new order. This is the most common reason the user opens the app.

**Design**: Should be immediately visible — not buried. Use the coral accent. Could be a button in the top section or integrated into the dashboard header area. Keep it sharp and minimal, not a big hero CTA.

**Files**: `src/pages/Dashboard.tsx`

### 3. Redesign the Pipeline section

**Current**: `StatusPipeline` is functionally good — colored stage buttons with counts, clickable to filter. But the UI is a flat horizontal scroll with uniform sizing and a generic "Pipeline Overview" header.

**New**: Keep the same data and click-to-filter behavior. Redesign the visual treatment:
- Remove the "Pipeline Overview" section header (the component is self-explanatory)
- Create visual emphasis on stages that have items (non-zero counts should stand out)
- De-emphasize empty stages (zero-count stages should recede)
- Consider making the connectors between stages more intentional
- Animate count changes when items move between stages

**Files**: `src/components/items/StatusPipeline.tsx`, `src/pages/Dashboard.tsx`

### 4. Move charts to Analytics page

**Current**: `ProfitOverTimeChart` and `CategoryBreakdownChart` live on the dashboard in a two-column layout alongside RecentOrders and PendingQC.

**New**: Remove both charts from the dashboard entirely. They're analytics that update slowly and don't serve the on-demand workflow. The `/analytics` page already exists — these charts belong there (check if they're already duplicated there; if so, just remove from dashboard).

**Files**: `src/pages/Dashboard.tsx`, possibly `src/pages/Analytics.tsx`

### 5. Elevate Pending QC section

**Current**: `PendingQcSection` is buried in a sidebar column, capped at 5 items with no "view all," and GL/RL buttons have no animation feedback.

**New**:
- Move PendingQC to a more prominent position — it's an actionable section, not a sidebar afterthought
- Remove the 5-item cap or add a "view all" link to the orders list filtered by QC status
- Add exit animation (Framer Motion `AnimatePresence`) when an item is GL'd or RL'd — the item should animate out, not just vanish
- The empty state copy is already good ("All clear — no items waiting for QC review right now.")

**Files**: `src/components/dashboard/PendingQcSection.tsx`, `src/pages/Dashboard.tsx`

### 6. Improve Recent Orders section

**Current**: A card with a list of 8 recent orders. Empty state says "No orders yet" — generic.

**New**:
- Keep the recent orders list but tighten it — 5 most recent is enough for a dashboard
- Improve the empty state copy to be contextual (e.g., "No recent orders — tap + to start one")
- Add a subtle link/button to view all orders

**Files**: `src/components/dashboard/RecentOrders.tsx`

### 7. Fix typography and font issues

**Current**: `--font-display: "Plus Jakarta Sans"` is declared in CSS but never imported. `font-display` class references a font that doesn't exist. Geist Variable is imported but only used as `--font-sans`.

**New**: Remove the Plus Jakarta Sans declaration. Standardize on Geist Variable for both display and body. Use weight variation (300–700) for hierarchy instead of font-family switching.

**Files**: `src/index.css`

### 8. Rework the dashboard layout

**Current**: Vertical stack — stat cards → pipeline → two-column (charts + sidebar). Very standard.

**New layout** (top to bottom):
1. **Header row**: Page title/greeting + "New Order" CTA
2. **Metrics row**: 3 metrics with Profit dominant
3. **Pipeline**: Full-width, redesigned
4. **Two-column below**: Pending QC (left, wider) + Recent Orders (right)

No charts. Tighter vertical spacing. The whole dashboard should fit above the fold on a standard screen.

**Files**: `src/pages/Dashboard.tsx`

---

## Out of Scope

- Navigation/sidebar changes
- Order creation flow itself (just adding a link to it)
- Analytics page redesign
- Backend/Convex query changes (reuse existing queries, just consume fewer)

---

## Commands to Run

Each section maps to a skill command. Execute in this order:

| Step | Command | Target | What it does |
|------|---------|--------|--------------|
| 1 | `/distill` | Dashboard stat cards | Strip 6 cards → 3, remove icon boxes, create visual hierarchy |
| 2 | `/arrange` | Dashboard layout | Rework the page layout: header + CTA, metrics, pipeline, QC + recent |
| 3 | `/bolder` | Pipeline section | Redesign StatusPipeline — emphasize non-zero stages, de-emphasize empty |
| 4 | `/animate` | PendingQC section | Add AnimatePresence exit animations on GL/RL actions |
| 5 | `/clarify` | Empty states + microcopy | Fix "No orders yet" and section headers |
| 6 | `/polish` | Full dashboard | Final pass — spacing, typography, font cleanup, visual cohesion |
