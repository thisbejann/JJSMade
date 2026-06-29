---
name: JJSMade
description: Personal order pipeline and profit tracker for a solo reseller operation.
colors:
  void-night: "#0b0c10"
  night-surface: "#12131a"
  elevated-void: "#1b1c25"
  hover-state: "#23242e"
  primary-text: "#f0f0f0"
  secondary-text: "#a0a0b0"
  tertiary-text: "#86869a"
  live-coal: "#e07850"
  live-coal-hover: "#e88a68"
  success: "#22c55e"
  danger: "#ef4444"
  warning: "#f59e0b"
  info: "#3b82f6"
typography:
  display:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  title:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  nav: "10px"
  md: "22px"
  pill: "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.live-coal}"
    textColor: "#fef3ec"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 12px"
  button-primary-hover:
    backgroundColor: "{colors.live-coal-hover}"
    textColor: "#fef3ec"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 12px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 12px"
  input-default:
    backgroundColor: "rgba(255,255,255,0.075)"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  badge-accent:
    backgroundColor: "rgba(224,120,80,0.10)"
    textColor: "{colors.live-coal}"
    rounded: "{rounded.md}"
    height: "20px"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "rgba(34,197,94,0.10)"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
    height: "20px"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "rgba(239,68,68,0.10)"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    height: "20px"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "rgba(245,158,11,0.10)"
    textColor: "{colors.warning}"
    rounded: "{rounded.md}"
    height: "20px"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.pill}"
    padding: "24px"
---

# Design System: JJSMade

## 1. Overview: The Control Room

**Creative North Star: "The Control Room"**

JJSMade is a personal command instrument built by an operator, for themselves. No onboarding placeholders, no concessions to the unfamiliar. The interface assumes competence and rewards daily use. Every screen is laid out so the operator can assess the situation without scanning: hierarchy is explicit, data is immediately legible, and nothing on screen is decorative.

The palette is deliberately cool and dim. Void Night backgrounds recede. Night Surface cards organize. A single warm accent (Live Coal) surfaces only what needs attention. The contrast between the cold substrate and the warm coral is the system's core tension: data feels alive against a calm room. This is an environment built for clear thinking, not for impressing visitors.

The system explicitly rejects every generic SaaS pattern. No glassmorphism. No hero-metric grids where six identical cards carry identical visual weight. No purple-to-blue gradients borrowed from crypto dashboards or SaaS marketing. This tool was built with taste, and the design proves it.

**Key Characteristics:**
- Dark substrate, warm signal: Live Coal is rare and therefore loud
- Pill-shaped interactive elements that feel smooth under repeated daily operation
- Tonal depth through surface color, not shadow drama
- Semantic color as data: green means delivered, red means rejected, coral means actionable
- Typography hierarchy carries the reading order without decoration

## 2. Colors: The Forge Palette

One warm color in a cold room. Everything else is dark, neutral, and structured to recede. Live Coal earns its name by being the only warm signal: it marks primary actions, active states, the brand wordmark, and focus rings.

### Primary

- **Live Coal** (`#e07850`): The sole warm accent. Reserved for primary CTAs, active nav states, the wordmark, and focus rings. Its muted form (`rgba(224,120,80,0.12)`) tints active nav backgrounds and stat card icon containers. Used sparingly — its rarity is the point.
- **Live Coal Hover** (`#e88a68`): The interactive state of the accent. Used exclusively as the hover color for coral-filled elements.

### Neutral (Backgrounds)

- **Void Night** (`#0b0c10`): The deepest background. The page canvas. Nothing sits directly on it except the layout shell.
- **Night Surface** (`#12131a`): Primary surface. Cards, sidebar, and contained content sit on this layer.
- **Elevated Void** (`#1b1c25`): Raised elements: popovers, dropdown panels, modal backgrounds, muted-background tints.
- **Hover State** (`#23242e`): The hover background for interactive elements at rest. The uppermost background layer before gaining a semantic color.

### Neutral (Text)

- **Primary Text** (`#f0f0f0`): Main content: values, headings, active labels. High contrast against all background layers.
- **Secondary Text** (`#a0a0b0`): Supporting labels, metadata, nav items at rest, form labels, descriptions.
- **Tertiary Text** (`#86869a`): Disabled states, placeholder text, pipeline stages with zero items.

### Semantic

- **Success** (`#22c55e`): Delivered status, positive profit deltas, QC approved. Appears at 10% opacity for badge backgrounds and 20% for badge borders.
- **Danger** (`#ef4444`): Errors, QC rejected, destructive actions. Same 10%/20% treatment.
- **Warning** (`#f59e0b`): Pending states, QC in progress, items awaiting action.
- **Info** (`#3b82f6`): Neutral informational states (e.g. "Purchased" stage before action is needed).

### Named Rules

**The One Warm Signal Rule.** Live Coal appears on at most 10% of any given screen. The moment coral becomes common, it loses its ability to direct attention. If you need more coral, the hierarchy is broken — fix the structure.

**The Opacity Border Rule.** Borders are never solid on dark surfaces. All dividers use white at 6% (subtle), 10% (default), or 16% (strong) opacity. A hard white line on a dark background reads as a mistake.

**The Semantic-Only Color Rule.** Success green, danger red, warning amber, and info blue appear exclusively as status signals. Never use them for decoration, branding, or visual interest.

## 3. Typography

**Display/Body/Label Font:** Geist Variable (sans-serif fallback)
**Mono Font:** JetBrains Mono (monospace fallback)

**Character:** One variable font family handles every role in the system. Hierarchy is built entirely from weight and size contrast, not family changes. Geist reads neutral at 400 and assertive at 700 — it spans the full range from sidebar metadata to dashboard stat values. JetBrains Mono appears exclusively where column alignment or code precision matters.

### Hierarchy

- **Display** (700, clamp(1.25–1.5rem), leading 1.2, tracking -0.01em): Large numeric values — total profit, order counts, stat card figures. Numbers the operator must read instantly without focusing.
- **Headline** (500, 1rem, leading 1.4): Section titles, card headings, page-level labels.
- **Title** (500, 0.9375rem, leading 1.4): Sub-section labels, table column headers, form group names.
- **Body** (400, 0.875rem, leading 1.5): All general content, table rows, form values, descriptions. Cap at 65–75ch.
- **Label** (500, 0.75rem, leading 1.3, tracking 0.01em): Metadata, badge text, secondary callouts, timestamps, status labels.
- **Mono** (JetBrains Mono, 400, 0.8125rem, leading 1.6): Prices, weights, numerical data requiring tabular alignment.

### Named Rules

**The Weight-First Rule.** Reach for font weight before reaching for color or icons to establish hierarchy. A 700-weight stat value beside a 400-weight label communicates importance without any color. Color carries semantic meaning; weight carries structural meaning.

**The Single Family Rule.** Geist Variable only. Do not introduce a second sans or a serif for emphasis. Emphasis comes from weight, not from family contrast.

## 4. Elevation

This system uses tonal layering exclusively. Depth is communicated by surface lightness relative to the base — not by cast shadows. The four background layers form a complete vocabulary.

**The four layers (ascending):**
1. **Void Night** (`#0b0c10`) — the page canvas
2. **Night Surface** (`#12131a`) — cards, sidebar, primary content containers
3. **Elevated Void** (`#1b1c25`) — floating layers: popovers, dropdowns, modals
4. **Hover State** (`#23242e`) — transient hover highlight; not a permanent layer

Cards receive a single compound treatment: `shadow-md` (diffuse drop shadow) plus `ring-1 ring-white/5` (hairline perimeter) to lift them off a flat Night Surface background. This is the only shadow in the system.

### Named Rules

**The Flat-By-Default Rule.** All interactive elements sit flat at rest. The only non-flat elements are Cards (which always sit on a surface). Never use `box-shadow` to lift a card that isn't floating.

**The Four-Layer Rule.** There are exactly four background values. If a design requires a fifth, the layout is wrong. Resolve it by restructuring — not by adding a new surface color.

## 5. Components

### Buttons

Precise and tactile. Pill-shaped across all variants (26px radius) so they feel smooth under repeated daily operation. The default variant is coral-filled: unambiguously the primary action on any given screen.

- **Shape:** Fully pill (26px radius)
- **Height:** 36px default; 32px small; 40px large
- **Primary:** Live Coal fill (`#e07850`), cream text (`#fef3ec`). Hover: `#e88a68`. Active: 1px Y-axis drop.
- **Outline:** Transparent background, border at `rgba(255,255,255,0.10)`. Hover fills Night Surface. For secondary confirmations alongside a primary.
- **Ghost:** No background, no border. Hover fills Hover State (`#23242e`). For toolbar actions and low-priority controls.
- **Destructive:** Danger at 10% opacity background, danger-colored text. Hover at 20%. Never a solid red button.
- **Focus:** 3px coral ring at 30% opacity on all variants.
- **Transition:** `transition-all` 150ms ease-out.

### Inputs

Same pill language as buttons — forms feel continuous with the rest of the interface. Fields are transparent-muted at rest, bordered only on focus.

- **Shape:** 22px radius (rounded-3xl)
- **Height:** 36px
- **Background:** `rgba(255,255,255,0.075)` at rest (barely-there fill, surface visible through)
- **Border:** Transparent at rest. Focus: coral border + 3px coral ring at 30% opacity.
- **Error:** Danger-colored border + danger ring.
- **Prefix/suffix:** Secondary-text slots at field edges for currency symbols, units, search icons.
- **Labels:** 0.875rem, 500 weight, secondary-text, 6px gap above the field.

### Badges

The semantic color vocabulary in compact form. Ten variants, all pill-shaped. Semantic variants use 10% opacity backgrounds with fully saturated text — legible without competing with primary actions.

- **Shape:** 22px radius, 20px height, 8px horizontal padding, 12px font
- **Default:** Live Coal fill with cream text. Use only where the badge itself is a primary action (rare).
- **Semantic variants (success/danger/warning/info/accent):** 10% opacity background, 20% opacity border, full-saturation text.
- **Secondary/Outline:** Muted surface or border-only, for non-semantic categorization labels.

### Cards

The primary grouping container. Used only when a boundary genuinely helps the operator distinguish a self-contained unit of information.

- **Corner Style:** Fully pill (26px radius — matches the interactive element language)
- **Background:** Night Surface (`#12131a`)
- **Elevation:** `shadow-md` diffuse drop + `ring-1 ring-white/5` hairline perimeter
- **Internal Padding:** 24px default, 16px small variant
- **Nested cards:** Forbidden. Content within a card that needs grouping gets spacing and typography — not another card.

### Navigation (Sidebar)

Fixed left sidebar, collapsible to a 64px icon rail on desktop. Mobile renders as a full-width overlay drawer.

- **Background:** Night Surface (`#12131a`)
- **Width:** 240px expanded, 64px collapsed
- **Items at rest:** Secondary-text, 40px tap target, 10px radius, `px-3 py-2.5`
- **Items on hover:** Primary-text, Hover State background
- **Items active:** Live Coal text, accent-muted background (`rgba(224,120,80,0.12)`). No side stripe — the tinted background alone conveys selection.
- **Logo:** 700 weight, Live Coal, 64px header height, `tracking-tight`
- **Transition:** 300ms on sidebar width; 150ms on item states.

### Status Pipeline (Signature Component)

A horizontal flow tracker mapping order lifecycle: Purchased → QC → Delivered. Each stage displays a count; zero-count stages dim to tertiary opacity. Clicking a stage filters the order list.

- **Layout:** Single-row flex track, `gap-1`. On `sm+` the stages stretch to equal segments (`flex-1`) that span the full container, so the filled segments read as one continuous flow rather than a left-clustered row. On narrow viewports stages fall back to content-sized and the track scrolls horizontally with the scrollbar hidden (`scrollbar-hide` utility) — the swipe affordance stays, the chrome doesn't.
- **Stage button:** 10px radius, `px-3.5 py-2`, content centered (`justify-center`), semantic-color background at 8% opacity, 15% on hover
- **Stage count:** 700 weight, 1.125rem, tabular nums, full semantic color when nonzero, tertiary when zero
- **Stage label:** 0.75rem, 500 weight, secondary-text when nonzero, tertiary when zero
- **Separator:** Right-arrow icon at 14px stroke, `rgba(255,255,255,0.16)` color, sitting flush between segments (no horizontal margin)
- **Semantic mapping:** Purchased = info, QC pending = warning, Delivered = success, Cancelled = danger

## 6. Do's and Don'ts

### Do:

- **Do** treat Live Coal as a signal, not a style choice. It belongs on primary buttons, active nav items, the wordmark, and focus rings — nowhere else.
- **Do** communicate depth through the four-layer surface system. Void Night → Night Surface → Elevated Void is the complete elevation vocabulary.
- **Do** use 10% opacity backgrounds with 20% borders and full-saturation text for all semantic badge and status variants.
- **Do** build hierarchy with weight contrast before reaching for color. 700 next to 400 reads like a headline next to body copy.
- **Do** use pill shapes (22–26px radius) for all interactive elements. Nav items and icon containers get 10px radius.
- **Do** cap body text at 65–75ch, even in dense data views. Line length is legibility infrastructure.
- **Do** animate meaningful moments only: status changes, QC approvals, data loads. Every animation conveys state.

### Don't:

- **Don't** use generic SaaS dashboard patterns: no six-identical-stat-card grids, no hero-metric templates with a big number, small label, and gradient accent.
- **Don't** use glassmorphism. No blurred translucent backgrounds as a visual style.
- **Don't** use neon glow effects or purple-to-blue gradients. This system lives in the same design language as Linear and Raycast, not a crypto dashboard.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, nav items, or callouts. Active states use tinted backgrounds; stripes are prohibited.
- **Don't** use gradient text (`background-clip: text`). Emphasis comes from weight and size, never from decorative gradients.
- **Don't** add shadows beyond the single `shadow-md + ring-1` on Cards. Floating layers (popovers, modals) earn their elevation from the Elevated Void surface color.
- **Don't** default to modals. Most actions can be inline, a slide-in panel, or a contextual row expansion. Modals are the last resort.
- **Don't** add a fifth background layer. If the layout needs one, the structure is wrong.
- **Don't** use semantic colors (success green, danger red, warning amber, info blue) for decoration. They are data signals exclusively.
