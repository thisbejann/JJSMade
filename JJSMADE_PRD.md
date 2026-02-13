# JJSMade — Product Requirements Document

> **Version:** 1.0  
> **Last Updated:** February 2026  
> **Tech Stack:** React · Vite · Convex · Tailwind CSS  
> **Purpose:** Internal business tool for tracking rep item orders, QC, shipping, and profit

---

## 1. Product Overview

### 1.1 What is JJSMade?

JJSMade is a personal business management web application for a small reselling operation that imports replica shoes, clothes, watches, and accessories from Chinese sellers and resells them locally in the Philippines. The app tracks the **full lifecycle** of every item — from initial order placement and QC photo review, through international shipping and local delivery, to final sale and profit calculation.

### 1.2 Problem Statement

Currently, tracking orders across multiple Chinese sellers, managing QC photos, calculating costs across multiple currencies (CNY → PHP), and computing profit margins is done manually or across scattered spreadsheets. This leads to lost information, miscalculated profits, and no visibility into business performance over time.

### 1.3 Target User

A single business owner (the developer) who needs a fast, visual, all-in-one tool to manage their reselling pipeline. The app is **not** customer-facing — it's an internal operations dashboard.

### 1.4 Key Workflows

1. **Order an item** → Record seller, batch, price in CNY, local shipping
2. **Receive QC photos** → Upload photos, review, mark GL (green light) or RL (red light)
3. **Item ships to PH** → Update status through transit stages
4. **Item arrives at PH warehouse** → Record weight, calculate forwarder fee
5. **Item delivered to me** → Record Lalamove fee, set selling price
6. **Item sold** → Record customer, confirm profit
7. **Analyze business** → View dashboards, charts, profit trends

---

## 2. Data Architecture (Convex Schema)

### 2.1 \`items\` Table

This is the core table. Every item/order is a single record.

\`\`\`typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    // — Item Identity —
    name: v.string(),                    // e.g. "Jordan 4 Military Black Size 42"
    category: v.union(
      v.literal("shoes"),
      v.literal("clothes"),
      v.literal("watches_accessories")
    ),
    imageUrl: v.optional(v.string()),    // Primary/thumbnail image (first QC photo or manually set)

    // — Source Info —
    seller: v.string(),                  // Seller name (e.g. "Passerby", "GTR", "Lol2021")
    sellerContact: v.optional(v.string()), // WeChat ID, Weidian link, Taobao link
    batch: v.optional(v.string()),       // Batch/factory name (e.g. "HP Batch", "LJR", "Clean Factory", "VS Factory")

    // — Pricing —
    priceCNY: v.number(),               // Item price in Chinese Yuan
    exchangeRateUsed: v.number(),       // The CNY→PHP rate used at time of order (snapshot)
    pricePHP: v.number(),               // Item price converted to PHP (priceCNY × exchangeRateUsed)

    // — Local CN Shipping —
    hasLocalShipping: v.boolean(),       // Does the seller charge domestic CN shipping?
    localShippingCNY: v.optional(v.number()),  // Domestic shipping fee in CNY
    localShippingPHP: v.optional(v.number()),  // Converted to PHP

    // — QC (Quality Control) —
    qcPhotoIds: v.optional(v.array(v.id("_storage"))), // Convex storage IDs for uploaded QC photos
    qcStatus: v.union(
      v.literal("not_received"),
      v.literal("pending_review"),
      v.literal("gl"),                   // Green Light — approved
      v.literal("rl")                    // Red Light — rejected, requesting exchange/refund
    ),

    // — Shipping & Weight —
    weightKg: v.optional(v.number()),    // Actual weight once at PH warehouse
    isBranded: v.boolean(),             // Branded/sensitive item? Affects forwarder rate
    forwarderRatePerKg: v.number(),     // PHP per kg (default 480 for branded, adjustable)
    forwarderFee: v.optional(v.number()), // Computed: weightKg × forwarderRatePerKg

    // — Selling & Delivery —
    sellingPrice: v.optional(v.number()),  // What the customer pays in PHP
    lalamoveFee: v.optional(v.number()),   // Lalamove delivery fee to owner's location in PHP
    customerName: v.optional(v.string()),  // Customer name/alias

    // — Computed Fields (store for query efficiency) —
    totalCost: v.optional(v.number()),     // pricePHP + localShippingPHP + forwarderFee + lalamoveFee
    profit: v.optional(v.number()),        // sellingPrice - totalCost

    // — Status Tracking —
    status: v.union(
      v.literal("ordered"),              // Just placed the order with CN seller
      v.literal("shipped_to_warehouse"), // Seller shipped to CN forwarder warehouse
      v.literal("at_cn_warehouse"),      // Arrived at CN forwarder warehouse
      v.literal("shipped_to_ph"),        // Forwarder shipped the parcel to PH
      v.literal("at_ph_warehouse"),      // Arrived at PH warehouse
      v.literal("delivered_to_me"),      // Received by owner via Lalamove or pickup
      v.literal("sold"),                 // Sold to customer
      v.literal("cancelled"),            // Order cancelled/refunded
      v.literal("returned")             // Customer returned item
    ),

    // — Metadata —
    notes: v.optional(v.string()),
    orderDate: v.number(),               // When the order was placed (timestamp ms)
    soldDate: v.optional(v.number()),    // When it was sold (timestamp ms)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_seller", ["seller"])
    .index("by_orderDate", ["orderDate"])
    .index("by_soldDate", ["soldDate"])
    .index("by_qcStatus", ["qcStatus"]),

  // — Sellers Directory —
  sellers: defineTable({
    name: v.string(),                    // Seller name (unique identifier)
    platform: v.optional(v.union(
      v.literal("weidian"),
      v.literal("taobao"),
      v.literal("1688"),
      v.literal("yupoo"),
      v.literal("direct")
    )),
    contactInfo: v.optional(v.string()), // WeChat, WhatsApp, link
    storeLink: v.optional(v.string()),   // Store URL
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"]),

  // — App Settings (single document pattern) —
  settings: defineTable({
    cnyToPhpRate: v.number(),            // Current exchange rate (default ~7.8)
    defaultForwarderRate: v.number(),    // Default PHP/kg for branded (default 480)
    defaultMarkupMin: v.number(),        // Target min markup in PHP (default 700)
    defaultMarkupMax: v.number(),        // Target max markup in PHP (default 850)
    updatedAt: v.number(),
  }),
});
\`\`\`

### 2.2 Convex Functions to Implement

#### Mutations
- \`items.create\` — Create a new item with auto-computed PHP prices, totalCost
- \`items.update\` — Update any field(s), auto-recompute derived fields (pricePHP, totalCost, profit)
- \`items.updateStatus\` — Quick status change with timestamp
- \`items.updateQcStatus\` — Set GL/RL status
- \`items.remove\` — Delete an item
- \`items.bulkUpdateStatus\` — Update status for multiple items at once
- \`sellers.create\` — Add a new seller
- \`sellers.update\` — Edit seller info
- \`sellers.remove\` — Delete a seller
- \`settings.update\` — Update app settings (exchange rate, defaults)
- \`settings.initialize\` — Create default settings if none exist (run on first load)

#### Queries
- \`items.list\` — List all items with filters (status, category, seller, dateRange, qcStatus, search text)
- \`items.getById\` — Get single item with all details
- \`items.getRecent\` — Get last N items ordered/updated
- \`items.getByStatus\` — Get items grouped by status (for pipeline view)
- \`items.getDashboardStats\` — Aggregated stats: total items, total profit, avg profit, counts by status/category
- \`items.getMonthlyProfitData\` — Profit aggregated by month for charts
- \`items.getProfitByCategory\` — Profit broken down by category
- \`items.getProfitBySeller\` — Profit broken down by seller
- \`items.getCostBreakdown\` — Average cost breakdown across all sold items
- \`sellers.list\` — All sellers with computed stats (item count, avg profit)
- \`sellers.getById\` — Single seller details
- \`settings.get\` — Get current settings

#### File Storage (for QC Photos)
- \`storage.generateUploadUrl\` — Convex mutation to get a signed upload URL
- \`storage.getUrl\` — Convex query to get the serving URL for a stored file
- Use Convex's built-in file storage (\`ctx.storage.generateUploadUrl()\` and \`ctx.storage.getUrl()\`)

### 2.3 Important Computation Logic

All monetary computations should happen server-side in Convex mutations for consistency. The form can show live *previews* client-side, but the saved values must be computed in the mutation.

\`\`\`
pricePHP = priceCNY × exchangeRateUsed
localShippingPHP = localShippingCNY × exchangeRateUsed  (if hasLocalShipping)
forwarderFee = weightKg × forwarderRatePerKg            (if weight entered)
totalCost = pricePHP + (localShippingPHP || 0) + (forwarderFee || 0) + (lalamoveFee || 0)
profit = (sellingPrice || 0) - totalCost
\`\`\`

---

## 3. Application Pages & Routes

Use React Router v6+ for client-side routing.

\`\`\`
/                     → Dashboard
/orders               → Orders list (main inventory table)
/orders/new           → Add new item form
/orders/:id           → Item detail view
/orders/:id/edit      → Edit item form
/sellers              → Sellers directory
/sellers/:id          → Seller detail (items from this seller)
/analytics            → Analytics & charts page
/settings             → App settings
\`\`\`

---

## 4. Page-by-Page Specifications

### 4.1 Dashboard (\`/\`)

The command center. Dense with information but elegantly organized.

**Layout:** Full-width with a grid of cards and charts.

**Components:**

1. **Header area** — App logo "JJSMade" with current date, quick-add button
2. **Stat cards row** (4-6 cards):
   - Total items tracked (all time)
   - Items currently in pipeline (not sold/cancelled)
   - Items sold this month
   - Total revenue this month (sum of sellingPrice for items sold this month)
   - Total profit this month (sum of profit for items sold this month)
   - Average profit per item this month
3. **Profit over time chart** — Area/line chart showing profit aggregated by week or month. Use Recharts. Toggleable between weekly/monthly. Last 6 months default view.
4. **Pipeline overview** — A horizontal pipeline/funnel showing count of items at each status stage. Visually represent: Ordered → Shipped to Warehouse → At CN Warehouse → Shipped to PH → At PH Warehouse → Delivered → Sold. Each stage is clickable (navigates to /orders filtered by that status).
5. **Category breakdown** — Donut or segmented bar chart: shoes vs clothes vs watches/accessories (by count and by profit)
6. **Recent orders** — A compact table/list of the 8 most recent items with: name, category icon, status badge, date. Each row clickable.
7. **Pending QC** — A small section showing items with \`qcStatus: "pending_review"\` that need attention, with thumbnail and quick GL/RL action buttons.

### 4.2 Orders List (\`/orders\`)

The main workhorse page.

**Layout:** Full-width table with a sticky filter/search bar at top.

**Filter bar:**
- Search input (searches name, seller, batch, customer name)
- Category filter dropdown (All / Shoes / Clothes / Watches & Accessories)
- Status filter dropdown (All / each status option)
- QC Status filter dropdown
- Seller filter dropdown (populated from existing sellers)
- Date range picker (order date)
- Sort by: Order Date (newest/oldest), Price (high/low), Profit (high/low)
- View toggle: Table view / Card grid view

**Table columns:**

| Column | Content |
|---|---|
| Item | Name + category icon/badge + thumbnail (first QC photo) |
| Seller | Seller name, batch name in smaller text below |
| Price | CNY amount + PHP amount below |
| Status | Color-coded pill badge |
| QC | GL/RL/Pending badge |
| Weight | Kg value or "—" |
| Selling Price | PHP amount or "—" |
| Profit | PHP amount with color (green positive, red negative) or "—" |
| Actions | Edit / View / Quick status update |

**Card grid view (alternative):**
Each item as a card showing thumbnail, name, seller, status, profit. Good for visual scanning.

**Floating action button:** "+ Add Item" button that navigates to \`/orders/new\`

**Empty state:** Beautiful empty state when no items exist yet with a CTA to add the first item.

### 4.3 Add New Item (\`/orders/new\`)

A multi-section form that is visually organized and satisfying to fill out. NOT a boring flat form — use sectioned cards with clear visual hierarchy.

**Section 1: Item Details**
- Item name (text input, required)
- Category selector — 3 large clickable cards with icons: 👟 Shoes, 👕 Clothes, ⌚ Watches & Accessories
- Seller — Combobox/autocomplete that searches existing sellers from the \`sellers\` table. Option to type a new seller name. Required.
- Seller contact — Text input, optional, auto-filled if seller selected from existing
- Batch / Factory — Combobox/autocomplete from previously used batch names. Optional.
- Order date — Date picker, defaults to today
- Notes — Textarea, optional

**Section 2: Pricing**
- Price in CNY — Number input, required
- Exchange rate — Pre-filled from settings, editable per-item (shows "Current rate: ₱X.XX per ¥1")
- **Auto-calculated price in PHP** displayed prominently (updates live as CNY or rate changes)
- Has local shipping? — Toggle switch
- Local shipping fee in CNY — Number input (shown only when toggle is on)
- **Auto-calculated local shipping in PHP** displayed (updates live)

**Section 3: QC Photos**
- Drag-and-drop upload zone (accepts multiple images: jpg, png, webp)
- Upload progress indicator
- Uploaded photos gallery with reorder and delete capabilities
- QC Status selector: 4 options as styled buttons:
  - ⏳ Not Received (default)
  - 🔍 Pending Review
  - ✅ GL (Green Light)
  - ❌ RL (Red Light)

**Section 4: Shipping & Fees**
- Is branded/sensitive? — Toggle (defaults to true, since most rep items are branded)
- Forwarder rate per kg — Number input, pre-filled with default (480 PHP/kg for branded)
- Weight in kg — Number input (can be left empty initially, filled later when item arrives at PH warehouse)
- **Auto-calculated forwarder fee** displayed
- Lalamove fee — Number input in PHP (can be left empty, filled later)

**Section 5: Sale Info**
- Selling price in PHP — Number input
- **Markup indicator:** Live-updating visual indicator:
  - Shows computed markup (sellingPrice - totalCost)
  - Color-coded: 🟢 Green if within 700-850 range, 🟡 Yellow if outside but close, 🔴 Red if below 700 or way above 850
  - Text: "Markup: ₱XXX" with the color
- Customer name — Text input (optional, for when item is sold)
- Status — Dropdown defaulting to "Ordered"

**Sticky bottom bar / Sidebar: Live Cost & Profit Calculator**
Always visible as the user fills the form. Shows:
\`\`\`
Item Price:           ₱ X,XXX.XX
Local Shipping:       ₱ XXX.XX
Forwarder Fee:        ₱ XXX.XX
Lalamove Fee:         ₱ XXX.XX
────────────────────────────────
Total Cost:           ₱ X,XXX.XX
Selling Price:        ₱ X,XXX.XX
────────────────────────────────
Profit:               ₱ XXX.XX  ← (green/red)
Markup:               XX.X%
\`\`\`

**Form submission:** "Save Item" button. On success, navigate to the item detail page.

### 4.4 Item Detail View (\`/orders/:id\`)

A rich, visual detail page.

**Hero section:** Item name as large heading, category badge, status badge, seller + batch info

**QC Photo Gallery:**
- Large main photo display
- Thumbnail strip below for switching between photos
- Click on main photo to open a full-screen lightbox/modal with navigation arrows
- If no photos: placeholder with upload prompt

**Info Grid:** Two or three columns of info cards:
- **Source card:** Seller, contact link, batch/factory, order date
- **Pricing card:** CNY price, exchange rate, PHP price, local shipping
- **Shipping card:** Weight, forwarder rate, forwarder fee, branded badge
- **Sale card:** Selling price, customer name, Lalamove fee, sold date

**Cost Breakdown Visualization:**
A horizontal stacked bar chart or visual breakdown showing the composition of the selling price:
- Item cost (segment)
- Local shipping (segment)
- Forwarder fee (segment)
- Lalamove fee (segment)
- Profit (segment — green if positive, red if negative)
Each segment labeled with PHP amount and percentage.

**Status Timeline:**
A visual horizontal or vertical timeline showing the item's progress through statuses. Completed stages are filled/highlighted, current stage is pulsing/active, future stages are dimmed.

**Action buttons:**
- Edit (navigate to edit form)
- Quick status update (dropdown)
- Delete (with confirmation modal)
- Back to orders list

### 4.5 Edit Item (\`/orders/:id/edit\`)

Same layout as Add New Item but pre-populated with existing data. Title: "Edit: [Item Name]".

### 4.6 Analytics (\`/analytics\`)

A page with multiple chart cards. Use **Recharts** for all charts.

**Date range selector** at the top — filter all charts by date range. Presets: This Month, Last 30 Days, Last 3 Months, Last 6 Months, This Year, All Time.

**Charts to include:**

1. **Profit Over Time** — Area chart with gradient fill. X-axis: months. Y-axis: PHP. Shows total profit per month.
2. **Revenue vs Total Cost vs Profit** — Grouped bar chart by month. Three bars per month: revenue (sellingPrice sum), total cost, profit.
3. **Profit by Category** — Horizontal bar chart or donut chart. Shows total profit for shoes, clothes, watches/accessories.
4. **Top Sellers by Profit** — Horizontal bar chart. Top 10 sellers ranked by total profit from their items.
5. **Top Batches/Factories** — Horizontal bar chart. Top batches ranked by total profit (useful for shoes).
6. **Cost Breakdown (Average)** — Donut/pie chart showing the average percentage of total cost that goes to: item price, local shipping, forwarder fee, Lalamove.
7. **Items Sold Per Month** — Simple bar chart showing volume of sales over time.
8. **Profit Distribution** — Histogram showing how individual item profits are distributed (e.g., how many items made ₱500-600 profit, ₱600-700, ₱700-800, etc.)
9. **Cumulative Profit** — Running total line chart of all profit over time.
10. **Top Customers** — Ranked list/bar of customers by total amount spent.

**Summary stat cards at top of analytics:**
- Total Revenue (all time)
- Total Profit (all time)
- Total Items Sold (all time)
- Average Profit Per Item
- Best Month (highest profit month)
- Best Seller (highest total profit)

### 4.7 Sellers Directory (\`/sellers\`)

**List view** of all sellers as cards or table rows.

Each seller card shows:
- Seller name (large)
- Platform badge (Weidian / Taobao / 1688 / Yupoo / Direct)
- Contact info
- Store link (clickable)
- Stats: Total items ordered, items sold, total profit, average profit per item

**Actions:** Add new seller, edit seller, delete seller, click into seller detail.

**Seller Detail (\`/sellers/:id\`):**
- Seller info at top
- Full table of all items from this seller (reuse the Orders table component with seller pre-filtered)
- Summary stats specific to this seller: total spent, total profit, avg profit, best item

### 4.8 Settings (\`/settings\`)

Clean, simple settings page.

**Exchange Rate section:**
- Current CNY → PHP rate input (number, 2 decimal places)
- Show: "¥1 = ₱X.XX"
- Note: "This rate will be used for new items. Existing items keep the rate they were created with."

**Forwarder Defaults section:**
- Default forwarder rate for branded items (PHP/kg) — default 480
- Note: "This will pre-fill the forwarder rate when adding new items."

**Markup Targets section:**
- Minimum target markup (PHP) — default 700
- Maximum target markup (PHP) — default 850
- Note: "Used for the markup indicator when setting selling prices."

**Save button** with success feedback.

---

## 5. Design System & Visual Identity

### 5.1 Design Direction: Premium Dark Industrial

**Concept:** High-end streetwear brand meets fintech dashboard. This app manages replica sneakers and luxury goods — the UI should feel premium, confident, and bold. Think: the interior of a high-end sneaker consignment shop crossed with a Bloomberg terminal.

**What makes this unforgettable:** The combination of luxury dark aesthetics with punchy gold accents, crisp data visualization, and subtle texture/grain that gives the interface a tactile, almost physical quality — like looking at a premium watch face.

### 5.2 Color Palette

Use Tailwind CSS custom theme colors:

\`\`\`
Background layers:
  bg-base:      #08080a    (deepest black, page background)
  bg-surface:   #111114    (card/panel backgrounds)
  bg-elevated:  #1a1a1f    (elevated elements, modals, popovers)
  bg-hover:     #222228    (hover states on surfaces)

Text:
  text-primary:   #f0f0f0  (primary text, high contrast)
  text-secondary: #8a8a9a  (secondary/muted text)
  text-tertiary:  #55556a  (disabled, placeholder text)

Accent — Gold/Amber (primary action color):
  accent:         #e8a820  (primary gold accent)
  accent-hover:   #f0b830  (hover state)
  accent-muted:   rgba(232, 168, 32, 0.12)  (subtle gold backgrounds)

Semantic:
  success:        #22c55e  (GL, profit positive, sold status)
  success-muted:  rgba(34, 197, 94, 0.12)
  danger:         #ef4444  (RL, negative profit, cancelled)
  danger-muted:   rgba(239, 68, 68, 0.12)
  warning:        #f59e0b  (pending states)
  warning-muted:  rgba(245, 158, 11, 0.12)
  info:           #3b82f6  (informational, in-transit)
  info-muted:     rgba(59, 130, 246, 0.12)

Borders:
  border-subtle:  rgba(255, 255, 255, 0.06)
  border-default: rgba(255, 255, 255, 0.10)
  border-strong:  rgba(255, 255, 255, 0.16)
\`\`\`

### 5.3 Typography

Load from Google Fonts or Fontshare CDN:

- **Display / Headings:** \`"Clash Display"\` (from Fontshare) — Bold, geometric, modern. Weights: 600, 700. Fallback: \`"Plus Jakarta Sans", sans-serif\`
- **Body / UI:** \`"General Sans"\` (from Fontshare) — Clean, excellent readability. Weights: 400, 500, 600. Fallback: \`"Plus Jakarta Sans", sans-serif\`
- **Monospace / Numbers / Prices:** \`"JetBrains Mono"\` (from Google Fonts) — Crisp, aligned numbers. Weight: 400, 500.

**Sizing scale:**
- Page titles: 2rem / 32px, Clash Display 700
- Section headings: 1.25rem / 20px, Clash Display 600
- Card titles: 1rem / 16px, General Sans 600
- Body text: 0.875rem / 14px, General Sans 400
- Small/caption: 0.75rem / 12px, General Sans 400
- Stat numbers: 1.5-2.5rem, JetBrains Mono 500
- Price displays: JetBrains Mono 500, always

### 5.4 Component Styling

**Cards:**
\`\`\`css
background: #111114;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03);
\`\`\`
On hover: subtle border glow with accent color (\`box-shadow: 0 0 0 1px rgba(232, 168, 32, 0.2)\`)

**Buttons:**
- Primary: Gold accent background, dark text, slight inner shadow for depth
- Secondary: Transparent with border-default, text-primary
- Ghost: No border, text-secondary, hover shows bg-hover
- Danger: Red variant for destructive actions
- All buttons: \`border-radius: 8px\`, \`font-weight: 500\`, \`padding: 8px 16px\`
- Hover transitions: \`transition: all 150ms ease\`

**Inputs:**
- Background: \`bg-base\` or slightly darker than parent surface
- Border: \`border-default\`, focus: \`accent\` colored ring
- Rounded: \`border-radius: 8px\`
- Placeholder text in \`text-tertiary\`

**Badges/Pills:**
- Small, rounded-full, using the muted semantic colors as background
- Text in the corresponding bright semantic color
- Font: General Sans 500, 12px
- Examples: Status "Sold" → success-muted bg + success text. "RL" → danger-muted bg + danger text.

**Table rows:**
- No alternating row backgrounds (too noisy on dark themes)
- Instead: subtle \`border-bottom: 1px solid border-subtle\` between rows
- Hover: row background becomes \`bg-hover\`
- Clickable rows show cursor pointer

### 5.5 Background & Texture

- Apply a very subtle CSS noise/grain texture overlay to the \`bg-base\` background using an inline SVG filter at ~3-5% opacity. This adds a tactile, premium quality.
- Accent areas (like the dashboard header or stat cards) can have a very subtle radial gradient glow of the accent-muted color to create warmth.
- Example noise overlay:
\`\`\`css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: 0.4;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: overlay;
}
\`\`\`

### 5.6 Motion & Animation

Use \`framer-motion\` for React animations:

- **Page transitions:** Fade-in with slight upward slide (y: 10 → 0, opacity: 0 → 1, duration: 200ms)
- **Card stagger:** When a grid of cards loads, stagger each card's entrance by 50ms delay
- **Number counters:** Dashboard stat numbers should count up from 0 to their value on first load
- **Status changes:** When a status badge updates, brief scale pulse (1 → 1.05 → 1)
- **Hover states:** Cards lift slightly on hover (\`transform: translateY(-2px)\`, \`transition: 150ms\`)
- **Modal/drawer entry:** Slide up from bottom with backdrop fade
- **Chart animations:** Recharts built-in animations enabled with \`isAnimationActive={true}\`
- **Loading skeletons:** Animated pulse skeletons while Convex queries load

### 5.7 Layout & Navigation

**Sidebar navigation** (collapsible):
- Fixed left sidebar, 240px wide (64px when collapsed to icon-only)
- App logo "JJSMade" at top (stylized in Clash Display, accent gold color)
- Nav links with Lucide React icons:
  - Dashboard (\`LayoutDashboard\`)
  - Orders (\`Package\`)
  - Sellers (\`Users\`)
  - Analytics (\`BarChart3\`)
  - Settings (\`Settings\`)
- Active state: accent-muted background + accent text + left border indicator
- Collapse button at bottom

**Top bar** (within main content area):
- Page title (left)
- Quick actions (right): "+ New Item" button, global search

**Main content:** Scrollable area to the right of the sidebar. Max-width container (1400px) centered with padding.

**Responsive:**
- Desktop (>1024px): Full sidebar, multi-column layouts, full tables
- Tablet (768-1024px): Collapsed sidebar (icons only), slightly compressed
- Mobile (<768px): Bottom tab navigation replacing sidebar, single-column, tables become cards

### 5.8 Icons

Use **Lucide React** (\`lucide-react\` package) for all icons.

### 5.9 Charts (Recharts)

Style all Recharts components to match the dark theme:
- Chart background: transparent (sits on card surface)
- Grid lines: \`rgba(255, 255, 255, 0.04)\`
- Axis labels: \`text-secondary\` color, General Sans 12px
- Tooltip: \`bg-elevated\` background, \`border-default\` border
- Area fills: Gradient from accent color to transparent
- Bar fills: Solid accent or semantic colors with rounded tops (\`radius={[4, 4, 0, 0]}\`)
- Line strokes: 2px, accent color with dot highlights

---

## 6. Component Architecture

### 6.1 Project Structure

\`\`\`
src/
├── components/
│   ├── ui/                          # Base UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Tooltip.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Combobox.tsx             # Autocomplete select (for sellers, batches)
│   │   ├── ImageUpload.tsx          # Drag-and-drop multi-image upload
│   │   ├── Lightbox.tsx             # Full-screen photo viewer
│   │   └── EmptyState.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx              # Main navigation sidebar
│   │   ├── TopBar.tsx               # Page header bar
│   │   ├── AppLayout.tsx            # Sidebar + TopBar + content wrapper
│   │   └── PageContainer.tsx        # Max-width centered content wrapper
│   │
│   ├── items/
│   │   ├── ItemForm.tsx             # Shared form for create/edit
│   │   ├── ItemCard.tsx             # Card view for grid display
│   │   ├── ItemRow.tsx              # Table row for list display
│   │   ├── ItemTable.tsx            # Full table with sorting/filtering
│   │   ├── ItemStatusBadge.tsx      # Color-coded status pill
│   │   ├── QcStatusBadge.tsx        # GL/RL/Pending badge
│   │   ├── CategoryBadge.tsx        # Shoes/Clothes/Watches badge with icon
│   │   ├── PriceDisplay.tsx         # Formatted price with currency symbol
│   │   ├── ProfitDisplay.tsx        # Profit with color coding
│   │   ├── CostBreakdown.tsx        # Visual cost breakdown chart
│   │   ├── StatusTimeline.tsx       # Visual status progression
│   │   ├── QcPhotoGallery.tsx       # Photo grid + lightbox
│   │   ├── LiveProfitCalculator.tsx # Sticky calculator for forms
│   │   ├── MarkupIndicator.tsx      # Green/yellow/red markup meter
│   │   └── StatusPipeline.tsx       # Dashboard pipeline visualization
│   │
│   ├── charts/
│   │   ├── ProfitOverTimeChart.tsx
│   │   ├── RevenueCostProfitChart.tsx
│   │   ├── CategoryBreakdownChart.tsx
│   │   ├── TopSellersChart.tsx
│   │   ├── CostDistributionChart.tsx
│   │   ├── ItemsSoldChart.tsx
│   │   ├── ProfitDistributionChart.tsx
│   │   └── CumulativeProfitChart.tsx
│   │
│   ├── sellers/
│   │   ├── SellerCard.tsx
│   │   ├── SellerForm.tsx
│   │   └── SellerStats.tsx
│   │
│   └── dashboard/
│       ├── StatCard.tsx             # Animated number stat card
│       ├── RecentOrders.tsx
│       ├── PendingQcSection.tsx
│       └── QuickActions.tsx
│
├── pages/
│   ├── Dashboard.tsx
│   ├── OrdersList.tsx
│   ├── OrderDetail.tsx
│   ├── OrderForm.tsx                # Handles both /new and /:id/edit
│   ├── SellersList.tsx
│   ├── SellerDetail.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
│
├── hooks/
│   ├── useSettings.ts               # Hook to get/update settings
│   ├── useComputedCosts.ts          # Hook for live cost/profit calculation
│   └── useDebounce.ts               # For search input debouncing
│
├── lib/
│   ├── formatters.ts                # formatPHP(), formatCNY(), formatDate()
│   ├── constants.ts                 # Status labels/colors, category labels, defaults
│   └── utils.ts                     # cn() helper (clsx + tailwind-merge)
│
├── App.tsx                          # Router setup
├── main.tsx                         # Entry point with ConvexProvider
└── index.css                        # Tailwind directives + CSS variables + noise texture
\`\`\`

---

## 7. Key UX Details

### 7.1 Currency Formatting
- PHP: Always show as \`₱1,234.56\` (peso sign, comma thousands, 2 decimal places)
- CNY: Always show as \`¥123.45\` (yuan sign, 2 decimal places)
- Use \`JetBrains Mono\` font for all price/number displays
- Negative amounts show in \`danger\` color with a minus sign

### 7.2 Status Flow
\`\`\`
ordered → shipped_to_warehouse → at_cn_warehouse → shipped_to_ph → at_ph_warehouse → delivered_to_me → sold
                                                                                                     ↘ cancelled
                                                                                                     ↘ returned
\`\`\`
Users can skip stages. The status dropdown should show all options but highlight the logical "next" status.

### 7.3 Status Colors & Labels

| Status | Color | Label |
|---|---|---|
| ordered | \`info\` (blue) | Ordered |
| shipped_to_warehouse | \`info\` (blue) | Shipped to CN |
| at_cn_warehouse | \`warning\` (amber) | At CN Warehouse |
| shipped_to_ph | \`info\` (blue) | Shipped to PH |
| at_ph_warehouse | \`warning\` (amber) | At PH Warehouse |
| delivered_to_me | \`accent\` (gold) | Delivered |
| sold | \`success\` (green) | Sold |
| cancelled | \`danger\` (red) | Cancelled |
| returned | \`danger\` (red) | Returned |

### 7.4 QC Status Colors & Labels

| QC Status | Color | Label |
|---|---|---|
| not_received | \`text-tertiary\` (gray) | Not Received |
| pending_review | \`warning\` (amber) | Pending Review |
| gl | \`success\` (green) | GL ✅ |
| rl | \`danger\` (red) | RL ❌ |

### 7.5 Category Icons (Lucide)
- Shoes: \`Footprints\` icon
- Clothes: \`Shirt\` icon
- Watches & Accessories: \`Watch\` icon

### 7.6 Empty States
Every list/table should have a beautiful empty state with a relevant large muted icon, short descriptive text, and a CTA button.

### 7.7 Loading States
- Animated skeleton loaders matching content layout
- Dark theme pulse animation
- Dashboard stat numbers: counter animation on load

### 7.8 Confirmation Dialogs
- Delete actions always require a confirmation modal
- Status changes to "cancelled" or "returned" require confirmation
- Modal styling: \`bg-elevated\` background, centered, backdrop blur

### 7.9 Toast Notifications
Use \`react-hot-toast\` or custom solution:
- Success/Error toasts for all CRUD actions
- Dark toast cards matching theme with semantic color left border

### 7.10 Responsive Design
- **Desktop (>1024px):** Full sidebar, multi-column, full tables
- **Tablet (768-1024px):** Collapsed sidebar, compressed layouts
- **Mobile (<768px):** Bottom tab nav, single-column, tables become cards

---

## 8. Dependencies

\`\`\`json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "convex": "latest",
    "recharts": "^2",
    "framer-motion": "^11",
    "lucide-react": "latest",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "date-fns": "^4",
    "react-hot-toast": "^2",
    "react-dropzone": "latest"
  },
  "devDependencies": {
    "vite": "^6",
    "@vitejs/plugin-react": "latest",
    "tailwindcss": "^4",
    "typescript": "^5",
    "@types/react": "latest",
    "@types/react-dom": "latest"
  }
}
\`\`\`

---

## 9. Implementation Phases

Build in this order to ensure a solid foundation:

### Phase 1: Foundation
1. Initialize Vite + React + TypeScript project
2. Install and configure Convex (\`npx convex init\`)
3. Set up Tailwind CSS with full custom theme (all colors, fonts, variables from Section 5)
4. Add Fontshare CDN links for Clash Display + General Sans, Google Fonts for JetBrains Mono
5. Create \`index.css\` with noise texture overlay, CSS variables, base dark styles
6. Create \`lib/utils.ts\` with \`cn()\` helper
7. Create \`lib/formatters.ts\` with \`formatPHP()\`, \`formatCNY()\`, \`formatDate()\`
8. Create \`lib/constants.ts\` with all status/category label/color mappings

### Phase 2: Convex Backend
9. Define the full schema in \`convex/schema.ts\` (exact schema from Section 2.1)
10. Implement all item mutations with server-side computation of derived fields
11. Implement all item queries including filtered list, stats, and aggregations
12. Implement seller mutations and queries
13. Implement settings mutations and queries with initialization
14. Implement file storage upload URL generation and URL retrieval

### Phase 3: Layout & Base UI
15. Build all base UI components in \`components/ui/\`
16. Build \`Sidebar\`, \`TopBar\`, \`AppLayout\` with responsive behavior
17. Set up React Router with all routes in \`App.tsx\`
18. Wrap app with \`ConvexProvider\` in \`main.tsx\`

### Phase 4: Core Pages
19. Build Settings page (simplest — validates settings CRUD)
20. Build the ItemForm component with all 5 sections and live profit calculator
21. Build the Orders List page with table, filters, search, and card grid toggle
22. Build the Item Detail page with QC gallery, cost breakdown, status timeline
23. Wire up edit functionality (reuse ItemForm with pre-populated data)

### Phase 5: Sellers
24. Build Sellers List page with cards and stats
25. Build Seller Form (add/edit modal or page)
26. Build Seller Detail page with filtered item list

### Phase 6: Dashboard
27. Build StatCard with animated number counter
28. Build dashboard layout with all stat cards, pipeline, recent orders, pending QC
29. Build the profit over time chart for the dashboard

### Phase 7: Analytics
30. Build all analytics chart components one by one
31. Build the analytics page layout with date range filter
32. Connect all charts to Convex query data

### Phase 8: Polish
33. Add loading skeleton states to every page and component
34. Add empty states for all lists and tables
35. Add toast notifications for all CRUD actions
36. Add framer-motion page transitions and card stagger animations
37. Full responsive design pass — test all breakpoints
38. Error handling, edge cases, form validation
39. Performance: React.memo where needed, lazy loading for Analytics page

---

## 10. Critical Implementation Notes

1. **Convex is reactive.** All \`useQuery\` hooks automatically update the UI when data changes. No manual refetching needed.

2. **File uploads in Convex** use a two-step process: (a) call a mutation to get a signed upload URL via \`ctx.storage.generateUploadUrl()\`, (b) \`fetch(uploadUrl, { method: "POST", body: file })\`, (c) the response contains the \`storageId\` — save it to the document. Use \`ctx.storage.getUrl(storageId)\` in queries to get serving URLs.

3. **Exchange rate snapshotting.** When creating an item, snapshot the current exchange rate into \`exchangeRateUsed\`. Historical items keep accurate cost records even if the global rate changes later.

4. **Computed fields must be stored** (not just computed on read) for efficient querying and aggregation. Recompute them in mutations whenever relevant source fields change.

5. **Single-user app.** No authentication needed for v1. Convex project runs in dev mode without auth.

6. **All monetary values** stored as numbers (not strings). Format to 2 decimal places only for display.

7. **For the Combobox/autocomplete** (seller and batch fields), query distinct values from existing items and allow typing new values.

8. **Recharts responsive containers**: Always wrap charts in \`<ResponsiveContainer width="100%" height={300}>\`.

9. **Tailwind v4** uses CSS-first configuration. Define theme extensions in \`@theme\` blocks in CSS rather than \`tailwind.config.js\`. If using Tailwind v3, use \`tailwind.config.js\`.

10. **framer-motion** — use \`<AnimatePresence>\` for route transitions and \`motion.div\` with \`initial\`, \`animate\`, \`exit\` props for element animations. Use \`staggerChildren\` in parent variants for card grid animations.
