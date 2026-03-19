# Audit & Critique — Improvement Tasks

Consolidated from `/critique` and `/audit` results. Ordered by priority.
Work through each item, check the box when done.

---

## Phase 1: Critical Accessibility (a11y) — from Audit

- [x] **1. Form label associations** — Add `useId()` to Input, Select, DatePicker, Combobox so `<label htmlFor>` is linked to `<input id>`. (Audit C1)
- [x] **2. Toggle ARIA semantics** — Add `role="switch"`, `aria-checked`, connect to label. (Audit C2)
- [x] **3. Combobox ARIA pattern** — Add `role="combobox"`, `aria-expanded`, `role="listbox"`, `role="option"`, keyboard arrow nav. (Audit C3)
- [x] **4. Modal accessibility** — Add `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, return focus on close. (Audit C4)
- [x] **5. Lightbox accessibility** — Same as Modal: dialog role, focus trap, `aria-label` on all icon buttons. (Audit C5)
- [x] **6. Fix text-tertiary contrast** — Lighten `#55556a` to `#7a7a8e` (~4.5:1 ratio). (Audit C6)
- [x] **7. Icon-only button labels** — Add `aria-label` to icon-only buttons across TopBar, Sidebar, ItemRow, SellerCard, ImageUpload. (Audit C7)
- [x] **8. Reduced motion support** — Add `<MotionConfig reducedMotion="user">` at app root. (Audit C8)

## Phase 2: High-Severity Accessibility & Responsive — from Audit

- [x] **9. Tooltip keyboard + ARIA** — Add `onFocus`/`onBlur`, `role="tooltip"`, `aria-describedby`. (Audit H1)
- [x] **10. Keyboard-accessible table rows** — Add `tabIndex={0}`, `role="link"`, `onKeyDown` for Enter on `<tr>` in ItemRow. (Audit H2)
- [x] **11. Heading hierarchy** — Fix duplicate `<h1>` elements; TopBar keeps `<h1>`, pages use `<h2>`. (Audit H3)
- [x] **12. StatusTimeline mobile** — Vertical stepper on mobile, horizontal on desktop. (Audit H4)
- [x] **13. ItemTable mobile adaptation** — Card layout on mobile via `<ItemCard>`, table on desktop. (Audit H5)
- [x] **14. Touch targets 44px minimum** — Increase icon-only buttons from `p-1`/`p-1.5` to `p-2`/`p-2.5`. (Audit H6)
- [x] **15. LiveProfitCalculator on mobile** — Sticky bottom bar with cost/profit summary. (Audit H7)
- [x] **16. OrderDetail header stacking** — Stack title + actions vertically on mobile via `flex-col sm:flex-row`. (Audit H8)
- [x] **17. Skip navigation link** — Add sr-only skip-to-content link in AppLayout + `id="main-content"` on `<main>`. (Audit H9 + M7)

## Phase 3: Design & UX — from Critique

### Anti-Patterns / AI Slop Fixes (Critique Anti-Patterns Verdict)

- [ ] **18. Color/theme system overhaul** — The gold-on-dark palette (#08080a + #e8a820) is the #1 AI dashboard tell. Pick an intentional aesthetic direction — consider a light theme or a palette that doesn't scream "AI dark dashboard". Tint neutrals toward brand hue instead of pure near-black. (Critique Priority #1)
- [x] **19. Card shadow system** — Removed AI-generic inset highlight shadow from Card.tsx. Cards now use border only. (Critique Anti-Pattern)
- [x] **20. TopBar glassmorphism** — Replaced `bg-surface/80 backdrop-blur-md` with solid `bg-surface`. (Critique Anti-Pattern)
- [x] **21. Remove noise texture overlay** — Removed `body::before` SVG noise overlay entirely. (Critique Anti-Pattern)
- [x] **22. StatusPipeline hover:scale-105** — Replaced scale-on-hover with subtle brightness change. Also fixed PersonalList FAB. (Critique Anti-Pattern)
- [x] **23. Reduce font-mono overuse** — Removed `font-mono` from standalone metrics (StatCard, SellerCard, ItemCard, PriceDisplay, ProfitDisplay, SellerStats, StatusPipeline, PendingQcSection, PersonalList). Kept in tabular contexts (ItemRow, CostBreakdown, LiveProfitCalculator, ItemForm, PriceCalculator). (Critique Anti-Pattern)
- [x] **24. Staggered card grid animations** — Removed `staggerChildren` + `motion.div` wrappers from Dashboard, Analytics, OrdersList, SellersList. Removed unused motion imports. Also removed StatCard's own entrance animation. (Critique Anti-Pattern)
- [x] **25. EmptyState icon-in-rounded-box** — Removed `w-16 h-16 rounded-2xl bg-surface border` container. Icon now displays directly. (Critique Anti-Pattern)
- [ ] **26. Cards wrapping everything** — Not every section needs a card container. Evaluate which cards are adding structure vs. visual noise. Pipeline, Quick Actions, and simple info sections could live without card wrappers. (Critique Anti-Pattern)
- [ ] **27. Font choices** — "Clash Display" + "General Sans" from Fontshare are extremely popular in AI-generated designs from 2024. Consider more distinctive or less overused alternatives. (Critique Anti-Pattern)

### Priority Design Issues (Critique Priority Findings)

- [ ] **28. Analytics page hierarchy** — 10 charts in a uniform 2-col grid with zero hierarchy. Group charts by purpose (Revenue, Product, Customers), lead with 1-2 key insights, use progressive disclosure for remaining charts, vary chart sizes. (Critique Priority #2)
- [x] **29. StatCard hero-metric cleanup** — Removed decorative `bg-accent/5` circle, reduced icon container size, added truncation. Still uses 6 identical cards — consider varying sizes or replacing with a single headline metric + context. (Critique Priority #3)
- [ ] **30. Replace status modals with inline stepper** — OrderDetail uses 4 modals for status progression, hiding the core workflow behind a dropdown. Replace with an inline, always-visible status progression panel with expandable sections per stage. (Critique Priority #4)
- [x] **31. Typography hierarchy** — Upgraded all card/section `h2` headings from `text-sm` to `text-base` across 15 files (charts, dashboard sections, detail pages). Subsection `h3` (LiveProfitCalculator) kept at `text-sm`. Page titles already use `text-xl`/`text-2xl`. (Critique Priority #5)

### Minor Design Issues (Critique Minor Observations)

- [x] **32. Remove redundant "New Item" FAB** — Removed OrdersList FAB; TopBar "New Item" button is sufficient. (Critique Minor)
- [x] **33. Empty states need personality** — Improved empty state copy across OrdersList, SellersList, and PendingQcSection with contextual guidance. (Critique Minor)
- [ ] **34. Spacing rhythm** — `space-y-6` everywhere creates monotonous rhythm. Use varied spacing: tight groupings for related content, generous separation between sections. (Critique Minor)
- [x] **35. Card hover instability** — Removed `hover:-translate-y-0.5`, kept border color change only. (Critique Minor)
- [x] **36. Sidebar Personal link visibility** — Made Personal nav link match other nav items' styling (same text size, font weight, active/hover states). Kept visual separator border. (Critique Minor)
- [ ] **37. No light mode option** — Dark-by-default with no alternative is a dark-mode-as-personality crutch. Consider offering a light theme. (Critique Question)

## Phase 4: Performance & Theming — from Audit

- [x] **38. StatCard count-up perf** — Removed rAF+setState animation entirely. Values now display immediately with no re-renders. (Audit M1)
- [x] **39. Lazy-load Analytics charts** — All 10 chart components now use `React.lazy` + `Suspense` with skeleton fallbacks. (Audit M2)
- [ ] **40. ItemForm autocomplete query** — `useQuery(api.items.list, {})` fetches ALL items just for autocomplete. Create dedicated `getUniqueSellers`/`getUniqueBatches` endpoints. (Audit M3)
- [x] **41. Hard-coded colors → tokens** — Replaced `text-[#08080a]` with `text-base` in LoginPage. Still remaining: `bg-black/*`, `text-white` in Lightbox/ImageUpload/QcPhotoGallery overlays. (Audit M4)
- [x] **42. Remove !important overrides** — PendingQcSection: replaced Button with custom styled buttons. (Audit M5)
- [x] **43. Noise texture z-index** — Lowered from 9999 to 10 (full removal tracked in item 21). (Audit M6)
- [x] **44. Main landmark** — Added `id="main-content"` to `<main>` in AppLayout. (Audit M7) — done with item 17.
- [x] **45. Focus ring visibility** — Changed `focus:ring-accent/40` to `focus:ring-accent` across all form components. (Audit M9)
- [ ] **46. Batch photo URL query** — Create `api.storage.getUrls` batch endpoint to fix N+1 query pattern in QcPhotoGallery. (Audit M10)
- [x] **47. Meaningful image alt text** — Added `itemName` prop to QcPhotoGallery; alt text now reads "QC photo of [item name]". Passed from OrderDetail and PersonalDetail. (Audit M12)

## Phase 5: Low — Polish & Cleanup

- [x] **48. Settings loading skeleton** — Use Skeleton component instead of plain "Loading..." text. (Audit L1)
- [x] **49. Deduplicate SellerForm** — Merged two `<SellerForm>` instances into one with conditional props for create vs. edit mode. (Audit L2)
- [x] **50. LoginPage use Button component** — Replaced raw `<button>` with `<Button>`. (Audit L3)
- [x] **51. Combobox listener optimization** — Done as part of item 3 Combobox rewrite (listener only registers when open). (Audit L4)
- [x] **52. PageContainer animation** — Reduced to opacity-only, removed y-axis animation. (Audit L6)
