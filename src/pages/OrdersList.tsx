import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemRow, ItemListRow, ItemObjectRow } from "../components/items/ItemRow";
import { ItemCard } from "../components/items/ItemCard";
import { GroupOrderCard, GroupListRow, GroupObjectRow, GroupTableRow } from "../components/items/GroupOrderRow";
import { GroupPickerModal } from "../components/items/GroupPickerModal";
import { useDebounce } from "../hooks/useDebounce";
import { matchGroupsToFilters } from "../lib/groupMatch";
import { ALL_STATUSES, ALL_QC_STATUSES, ALL_CATEGORIES, STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG } from "../lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon, LayoutGridIcon, ListViewIcon, Search01Icon, UserGroupIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const COLUMNS = ["", "Item", "Seller", "Price", "Status", "QC", "Weight", "Selling Price", "Profit", "Actions"];
const COLUMNS_SELECTABLE = ["sel", "Item", "Seller", "Price", "Status", "QC", "Weight", "Selling Price", "Profit", "Actions"];

// Group-native columns for the Bundles segment. Every one maps to a real group
// field — no borrowed solo-item columns — so the headers can't lie.
const BUNDLE_COLUMNS: { label: string; align: "left" | "right" }[] = [
  { label: "Customer", align: "left" },
  { label: "Items", align: "left" },
  { label: "Status", align: "left" },
  { label: "Discount", align: "right" },
  { label: "Customer Pays", align: "right" },
  { label: "Profit", align: "right" },
];

type TypeFilter = "all" | "bundles" | "items";

export default function OrdersList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [qcFilter, setQcFilter] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  // Segmented lens over the one feed: All (unified) / Bundles / Items. A filter,
  // not a second route — the timeline, filters, and counts stay whole.
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const debouncedSearch = useDebounce(search);

  const groups = useQuery(api.orderGroups.listWithItems);
  const soloItems = useQuery(api.items.list, {
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    qcStatus: qcFilter || undefined,
    search: debouncedSearch || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
    soloOnly: true,
  });

  const loading = groups === undefined || soloItems === undefined;

  type GroupType = NonNullable<typeof groups>[number];
  // A group paired with the members that cleared the active filters. When
  // visibleItems is a strict subset of the membership the group renders a
  // partial reveal (see docs/adr/0003-partial-group-match).
  type MatchedGroup = { group: GroupType; visibleItems: Doc<"items">[] };

  type MixedEntry =
    | { type: "group"; orderDate: number; data: MatchedGroup }
    | { type: "item"; orderDate: number; data: Doc<"items"> };

  // Groups are fetched unfiltered (listWithItems takes no args), so the same
  // controls must be applied here for both halves of the feed to obey one set.
  // Unlike solo items, the dropdowns drill *into* a group's members rather than
  // matching the bundle whole — matchGroupsToFilters returns each surviving
  // group with its visible subset. Lifted out of `mixed` so the Bundles segment
  // and its tally can read it.
  const matchedGroups = useMemo<MatchedGroup[]>(() => {
    if (loading) return [];
    return matchGroupsToFilters(groups ?? [], {
      status: statusFilter,
      category: categoryFilter,
      qc: qcFilter,
      search: debouncedSearch,
    });
  }, [groups, loading, statusFilter, categoryFilter, qcFilter, debouncedSearch]);

  const mixed: MixedEntry[] = useMemo(() => {
    if (loading) return [];
    return [
      ...matchedGroups.map((m) => ({ type: "group" as const, orderDate: m.group.orderDate, data: m })),
      ...(soloItems ?? []).map((i) => ({ type: "item" as const, orderDate: i.orderDate, data: i })),
    ].sort((a, b) => sortOrder === "asc" ? a.orderDate - b.orderDate : b.orderDate - a.orderDate);
  }, [matchedGroups, soloItems, loading, sortOrder]);

  // Per-segment tallies for the lens control. All = the whole mixed feed.
  const bundlesCount = matchedGroups.length;
  const itemsCount = soloItems?.length ?? 0;
  const allCount = mixed.length;
  const activeCount = typeFilter === "bundles" ? bundlesCount : typeFilter === "items" ? itemsCount : allCount;

  const isEmpty = !loading && mixed.length === 0;
  // A segment can be empty while others aren't (e.g. no bundles yet). Distinct
  // from the page-level empty state, which only fires when there's nothing at all.
  const segmentEmpty = !loading && !isEmpty && activeCount === 0;

  // Derive the shared customerId of all selected items (null if mixed or none)
  const selectedItems = useMemo(
    () => (soloItems ?? []).filter((i) => selectedIds.has(i._id)),
    [soloItems, selectedIds]
  );
  const sharedCustomerId = useMemo((): Id<"customers"> | null => {
    if (selectedItems.length === 0) return null;
    const ids = new Set(selectedItems.map((i) => i.customerId).filter(Boolean));
    if (ids.size === 1) return [...ids][0] as Id<"customers">;
    return null;
  }, [selectedItems]);

  const selectionHasMixedCustomers = selectedItems.length > 0 && sharedCustomerId === null
    && new Set(selectedItems.map((i) => i.customerId).filter(Boolean)).size > 1;

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleGroupSelected = () => {
    if (selectionHasMixedCustomers) {
      toast.error("Selected items belong to different customers. Please select items from the same customer.");
      return;
    }
    setShowGroupPicker(true);
  };

  // Sort is ordering, not filtering, so it's deliberately excluded — clearing
  // resets what's shown, not how it's ordered.
  const hasActiveFilters = Boolean(search || statusFilter || categoryFilter || qcFilter);
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setQcFilter("");
  };

  const columns = selectedIds.size > 0 ? COLUMNS_SELECTABLE : COLUMNS;

  return (
    <PageContainer>
      {showGroupPicker && (
        <GroupPickerModal
          itemIds={selectedItems.map((i) => i._id)}
          sharedCustomerId={sharedCustomerId}
          onClose={() => setShowGroupPicker(false)}
          onDone={() => { setShowGroupPicker(false); clearSelection(); }}
        />
      )}

      <div className="space-y-5">
        {/* Control cluster: command row (search / view) over filter row.
            Creation lives in the TopBar's split button; this row only shapes the list. */}
        <div className="space-y-2.5">
          {/* Segmented lens — the primary control. Each segment tunes columns to
              its own shape; the mono tally reads current counts at a glance. */}
          <div className="flex h-9 w-fit items-center gap-0.5 rounded-3xl bg-input/50 p-1">
            {([
              { value: "all" as const, label: "All", count: allCount },
              { value: "bundles" as const, label: "Bundles", count: bundlesCount },
              { value: "items" as const, label: "Items", count: itemsCount },
            ]).map((seg) => {
              const active = typeFilter === seg.value;
              return (
                <button
                  key={seg.value}
                  onClick={() => setTypeFilter(seg.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors cursor-pointer",
                    active ? "bg-accent-muted text-accent" : "text-secondary hover:text-primary"
                  )}
                >
                  {seg.label}
                  <span className={cn("font-mono text-xs tabular-nums", active ? "text-accent" : "text-tertiary")}>
                    {loading ? "–" : seg.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex h-9 shrink-0 items-center gap-0.5 rounded-3xl bg-input/50 p-1">
              <button
                onClick={() => setViewMode("table")}
                aria-label="List view"
                aria-pressed={viewMode === "table"}
                className={cn(
                  "flex h-7 items-center rounded-full px-2.5 transition-colors cursor-pointer",
                  viewMode === "table" ? "bg-accent-muted text-accent" : "text-secondary hover:text-primary"
                )}
              >
                <HugeiconsIcon icon={ListViewIcon} size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "flex h-7 items-center rounded-full px-2.5 transition-colors cursor-pointer",
                  viewMode === "grid" ? "bg-accent-muted text-accent" : "text-secondary hover:text-primary"
                )}
              >
                <HugeiconsIcon icon={LayoutGridIcon} size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
              placeholder="All Statuses"
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_CONFIG[c].label }))}
              placeholder="All Categories"
            />
            <Select
              value={qcFilter}
              onChange={(e) => setQcFilter(e.target.value)}
              options={ALL_QC_STATUSES.map((q) => ({ value: q, label: QC_STATUS_CONFIG[q].label }))}
              placeholder="All QC"
            />
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}
              options={[
                { value: "orderDate-desc", label: "Newest First" },
                { value: "orderDate-asc", label: "Oldest First" },
                { value: "pricePHP-desc", label: "Price: High → Low" },
                { value: "pricePHP-asc", label: "Price: Low → High" },
                { value: "profit-desc", label: "Profit: High → Low" },
                { value: "profit-asc", label: "Profit: Low → High" },
              ]}
            />
            <div className="col-span-2 flex items-center justify-end gap-2 sm:col-auto sm:ml-auto">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-secondary transition-colors cursor-pointer hover:bg-input/50 hover:text-primary"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
                  Clear
                </button>
              )}
              {!loading && (
                <span className="hidden sm:block text-xs text-tertiary tabular-nums">
                  {mixed.length} order{mixed.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selection action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-muted/20 px-4 py-2.5">
            <span className="text-sm font-medium text-accent">{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected</span>
            <Button size="sm" onClick={handleGroupSelected}>
              <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} />
              Group Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Cancel</Button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<HugeiconsIcon icon={PackageIcon} size={32} strokeWidth={1.5} />}
            title="No items yet"
            description="Add your first order item and it will show up here. You'll be able to track it through the entire pipeline."
            actionLabel="Add Item"
            onAction={() => navigate("/orders/new")}
          />
        ) : segmentEmpty ? (
          // One segment is empty while others have orders — a light inline note,
          // not the page-level empty state.
          <div className="rounded-xl border border-border-subtle bg-surface px-4 py-12 text-center">
            <p className="text-sm text-secondary">
              {typeFilter === "bundles" ? "No bundles yet" : "No solo items"}
            </p>
            <p className="mt-1 text-xs text-tertiary">
              Switch to {typeFilter === "bundles" ? "Items or All" : "Bundles or All"} to see the rest.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <>
            {/* Desktop — columns tuned per segment */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle">
              {typeFilter === "all" ? (
                // Object rows: no shared column header, so nothing can misalign.
                // The only aligned axis is the right-hand money rail.
                <div className="divide-y divide-border-subtle">
                  {mixed.map((entry) =>
                    entry.type === "group" ? (
                      <GroupObjectRow
                        key={`group-${entry.data.group._id}`}
                        group={entry.data.group}
                        visibleItems={entry.data.visibleItems}
                      />
                    ) : (
                      <ItemObjectRow
                        key={`item-${entry.data._id}`}
                        item={entry.data}
                        selectable
                        selected={selectedIds.has(entry.data._id)}
                        onSelect={(checked) => toggleSelect(entry.data._id, checked)}
                      />
                    )
                  )}
                </div>
              ) : typeFilter === "bundles" ? (
                // Group-native table — every header maps to a real group field.
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface">
                      {BUNDLE_COLUMNS.map((col) => (
                        <th
                          key={col.label}
                          className={cn(
                            "py-3 px-4 text-xs font-medium text-secondary uppercase tracking-wider",
                            col.align === "right" ? "text-right" : "text-left"
                          )}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matchedGroups.map((m) => (
                      <GroupTableRow key={`group-${m.group._id}`} group={m.group} visibleItems={m.visibleItems} />
                    ))}
                  </tbody>
                </table>
              ) : (
                // Items — the existing solo item table, no group bands.
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface">
                      {columns.map((col, i) => (
                        <th key={i} className="py-3 px-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          {col === "sel" ? "" : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(soloItems ?? []).map((item) => (
                      <ItemRow
                        key={`item-${item._id}`}
                        item={item}
                        selectable
                        selected={selectedIds.has(item._id)}
                        onSelect={(checked) => toggleSelect(item._id, checked)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Mobile list view: compact divided rows, deliberately distinct
                from grid mode's cards so the toggle means something here too */}
            <div className="md:hidden overflow-hidden rounded-xl border border-border-subtle bg-surface divide-y divide-border-subtle">
              {typeFilter === "bundles"
                ? matchedGroups.map((m) => <GroupListRow key={`group-${m.group._id}`} group={m.group} visibleItems={m.visibleItems} />)
                : typeFilter === "items"
                  ? (soloItems ?? []).map((item) => <ItemListRow key={`item-${item._id}`} item={item} />)
                  : mixed.map((entry) =>
                      entry.type === "group" ? (
                        <GroupListRow key={`group-${entry.data.group._id}`} group={entry.data.group} visibleItems={entry.data.visibleItems} />
                      ) : (
                        <ItemListRow key={`item-${entry.data._id}`} item={entry.data} />
                      )
                    )}
            </div>
          </>
        ) : (
          // Grid view — the segment decides which cards render.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {typeFilter === "bundles"
              ? matchedGroups.map((m) => <GroupOrderCard key={`group-${m.group._id}`} group={m.group} visibleItems={m.visibleItems} />)
              : typeFilter === "items"
                ? (soloItems ?? []).map((item) => <ItemCard key={`item-${item._id}`} item={item} />)
                : mixed.map((entry) =>
                    entry.type === "group" ? (
                      <GroupOrderCard key={`group-${entry.data.group._id}`} group={entry.data.group} visibleItems={entry.data.visibleItems} />
                    ) : (
                      <ItemCard key={`item-${entry.data._id}`} item={entry.data} />
                    )
                  )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
