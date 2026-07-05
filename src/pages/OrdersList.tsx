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
import { ItemRow, ItemListRow } from "../components/items/ItemRow";
import { ItemCard } from "../components/items/ItemCard";
import { GroupOrderRow, GroupOrderCard, GroupListRow } from "../components/items/GroupOrderRow";
import { GroupPickerModal } from "../components/items/GroupPickerModal";
import { useDebounce } from "../hooks/useDebounce";
import { ALL_STATUSES, ALL_QC_STATUSES, ALL_CATEGORIES, STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG } from "../lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon, LayoutGridIcon, ListViewIcon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const COLUMNS = ["", "Item", "Seller", "Price", "Status", "QC", "Weight", "Selling Price", "Profit", "Actions"];
const COLUMNS_SELECTABLE = ["sel", "Item", "Seller", "Price", "Status", "QC", "Weight", "Selling Price", "Profit", "Actions"];

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

  type MixedEntry =
    | { type: "group"; orderDate: number; data: NonNullable<typeof groups>[number] }
    | { type: "item"; orderDate: number; data: Doc<"items"> };

  const mixed: MixedEntry[] = useMemo(() => {
    if (loading) return [];
    return [
      ...(groups ?? []).map((g) => ({ type: "group" as const, orderDate: g.orderDate, data: g })),
      ...(soloItems ?? []).map((i) => ({ type: "item" as const, orderDate: i.orderDate, data: i })),
    ].sort((a, b) => sortOrder === "asc" ? a.orderDate - b.orderDate : b.orderDate - a.orderDate);
  }, [groups, soloItems, loading, sortOrder]);

  const isEmpty = !loading && mixed.length === 0;

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
            {!loading && (
              <span className="hidden sm:block sm:ml-auto text-xs text-tertiary tabular-nums">
                {mixed.length} order{mixed.length !== 1 ? "s" : ""}
              </span>
            )}
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
        ) : viewMode === "table" ? (
          <>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle">
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
                  {mixed.map((entry) =>
                    entry.type === "group" ? (
                      <GroupOrderRow key={`group-${entry.data._id}`} group={entry.data} colSpan={columns.length} />
                    ) : (
                      <ItemRow
                        key={`item-${entry.data._id}`}
                        item={entry.data}
                        selectable
                        selected={selectedIds.has(entry.data._id)}
                        onSelect={(checked) => toggleSelect(entry.data._id, checked)}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile list view: compact divided rows, deliberately distinct
                from grid mode's cards so the toggle means something here too */}
            <div className="md:hidden overflow-hidden rounded-xl border border-border-subtle bg-surface divide-y divide-border-subtle">
              {mixed.map((entry) =>
                entry.type === "group" ? (
                  <GroupListRow key={`group-${entry.data._id}`} group={entry.data} />
                ) : (
                  <ItemListRow key={`item-${entry.data._id}`} item={entry.data} />
                )
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mixed.map((entry) =>
              entry.type === "group" ? (
                <GroupOrderCard key={`group-${entry.data._id}`} group={entry.data} />
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
