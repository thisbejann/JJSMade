# JJSMade — Project Tasks

## Phase 1: Foundation
- [x] 1. Initialize Vite + React + TypeScript project
- [x] 2. Install all dependencies
- [x] 3. Configure Vite with Tailwind v4 plugin
- [x] 4. Initialize Convex (manual _generated files — run `npx convex dev` to connect)
- [x] 5. Set up index.html with font CDN links
- [x] 6. Create src/index.css with Tailwind v4 @theme config + noise texture + dark styles
- [x] 7. Create src/lib/utils.ts — cn() helper
- [x] 8. Create src/lib/formatters.ts — formatPHP(), formatCNY(), formatDate()
- [x] 9. Create src/lib/constants.ts — STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG
- [x] 10. Create src/hooks/useDebounce.ts
- [x] 11. Clean up Vite boilerplate, set up ConvexProvider + BrowserRouter in main.tsx

## Phase 2: Convex Backend
- [x] 12. Define full schema in convex/schema.ts
- [x] 13. Create convex/helpers.ts — computeDerivedFields()
- [x] 14. Implement convex/settings.ts — initialize, get, update
- [x] 15. Implement convex/items.ts — create, update, updateStatus, updateQcStatus, remove, bulkUpdateStatus
- [x] 16. Implement item listing queries — list, getById, getRecent, getByStatus
- [x] 17. Implement analytics queries — getDashboardStats, getMonthlyProfitData, etc.
- [x] 18. Implement convex/sellers.ts — CRUD + list with computed stats
- [x] 19. Implement convex/storage.ts — generateUploadUrl, getUrl
- [ ] 20. Test backend via Convex dashboard (requires `npx convex dev`)

## Phase 3: Layout & Base UI
- [x] 21. Set up React Router routes in App.tsx
- [x] 22. Build AppLayout.tsx — sidebar + topbar + content wrapper
- [x] 23. Build Sidebar.tsx — collapsible with nav links
- [x] 24. Build TopBar.tsx — page title + quick actions
- [x] 25. Build PageContainer.tsx — max-width wrapper + page transition
- [x] 26. Build UI primitives Part 1: Button, Input, Select, Toggle
- [x] 27. Build UI primitives Part 2: Badge, Card, Modal, Skeleton, Tooltip
- [x] 28. Build UI primitives Part 3: DatePicker, Combobox, EmptyState
- [x] 29. Build ImageUpload.tsx — drag-and-drop with react-dropzone
- [x] 30. Build Lightbox.tsx — full-screen photo viewer
- [x] 31. Verify all components render correctly with dark theme (build passes)

## Phase 4: Core Pages
- [x] 32. Create hooks/useSettings.ts — settings query + mutation + auto-initialize
- [x] 33. Create hooks/useComputedCosts.ts — live cost/profit preview
- [x] 34. Build Settings page
- [x] 35. Build item display components: ItemStatusBadge, QcStatusBadge, CategoryBadge, PriceDisplay, ProfitDisplay
- [x] 36. Build LiveProfitCalculator.tsx + MarkupIndicator.tsx
- [x] 37. Build ItemForm.tsx — 5-section form + OrderForm.tsx page wrapper
- [x] 38. Build ItemTable.tsx, ItemRow.tsx, ItemCard.tsx
- [x] 39. Build Orders List page
- [x] 40. Build Item Detail page

## Phase 5: Sellers
- [x] 41. Build SellerCard.tsx
- [x] 42. Build SellerForm.tsx
- [x] 43. Build Sellers List page
- [x] 44. Build Seller Detail page

## Phase 6: Dashboard
- [x] 45. Build StatCard.tsx — animated counter
- [x] 46. Build StatusPipeline.tsx
- [x] 47. Build RecentOrders.tsx
- [x] 48. Build PendingQcSection.tsx
- [x] 49. Build ProfitOverTimeChart.tsx
- [x] 50. Build CategoryBreakdownChart.tsx
- [x] 51. Build Dashboard page

## Phase 7: Analytics
- [x] 52. Create src/lib/chartTheme.ts
- [x] 53. Build RevenueCostProfitChart.tsx
- [x] 54. Build TopSellersChart.tsx
- [x] 55. Build TopBatchesChart.tsx
- [x] 56. Build CostDistributionChart.tsx
- [x] 57. Build ItemsSoldChart.tsx
- [x] 58. Build ProfitDistributionChart.tsx
- [x] 59. Build CumulativeProfitChart.tsx
- [x] 60. Build TopCustomersChart.tsx
- [x] 61. Build Analytics page
- [ ] 62. Test analytics with sample data (requires Convex connection)

## Phase 8: Polish
- [x] 63. Add loading skeleton states to every page
- [x] 64. Add empty states for all lists
- [x] 65. Add toast notifications for all CRUD operations
- [x] 66. Add Framer Motion page transitions
- [x] 67. Add card stagger animations
- [x] 68. Add hover effects and micro-interactions
- [ ] 69. Full responsive design pass
- [x] 70. Form validation and error handling
- [ ] 71. Performance optimizations
- [ ] 72. Final QA
