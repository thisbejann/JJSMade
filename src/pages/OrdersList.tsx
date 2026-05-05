import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";
import { ItemRow } from "../components/items/ItemRow";
import { ItemCard } from "../components/items/ItemCard";
import { GroupOrderRow, GroupOrderCard } from "../components/items/GroupOrderRow";
import { GroupPickerModal } from "../components/items/GroupPickerModal";
import { CustomerPicker } from "../components/items/CustomerPicker";
import { useDebounce } from "../hooks/useDebounce";
import { ALL_STATUSES, ALL_QC_STATUSES, ALL_CATEGORIES, STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG } from "../lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, PackageIcon, LayoutGridIcon, ListViewIcon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { cn } from "../lib/utils";
import { toast } from "sonner";

function NewGroupOrderModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<Id<"customers"> | null>(null);
  const [notes, setNotes] = useState("");
  const createGroup = useMutation(api.orderGroups.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    try {
      const groupId = await createGroup({ customerId, notes: notes.trim() || undefined });
      onClose();
      navigate(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group order");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base border border-border-default rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-primary mb-4">New Group Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Customer</label>
            <CustomerPicker value={customerId} onChange={setCustomerId} placeholder="Search or create customer..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Batch Jan 2026" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Group</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [showGroupModal, setShowGroupModal] = useState(false);

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
      checked ? next.add(id) : next.delete(id);
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
      {showGroupModal && <NewGroupOrderModal onClose={() => setShowGroupModal(false)} />}
      {showGroupPicker && (
        <GroupPickerModal
          itemIds={selectedItems.map((i) => i._id)}
          sharedCustomerId={sharedCustomerId}
          onClose={() => setShowGroupPicker(false)}
          onDone={() => { setShowGroupPicker(false); clearSelection(); }}
        />
      )}

      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-border-default bg-base pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            />
          </div>
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
          <div className="flex border border-border-default rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")}
              className={cn("p-2 transition-colors cursor-pointer", viewMode === "table" ? "bg-accent-muted text-accent" : "text-secondary hover:bg-hover")}>
              <HugeiconsIcon icon={ListViewIcon} size={16} strokeWidth={1.5} />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={cn("p-2 transition-colors cursor-pointer", viewMode === "grid" ? "bg-accent-muted text-accent" : "text-secondary hover:bg-hover")}>
              <HugeiconsIcon icon={LayoutGridIcon} size={16} strokeWidth={1.5} />
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowGroupModal(true)}>
            <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} />
            New Group
          </Button>
          <Button size="sm" onClick={() => navigate("/orders/new")}>
            <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
            Add Item
          </Button>
        </div>

        {/* Selection action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent-muted/20 px-4 py-2.5">
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
                      <GroupOrderRow key={`group-${entry.data._id}`} group={entry.data} />
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
            {/* Mobile fallback */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {mixed.map((entry) =>
                entry.type === "group" ? (
                  <GroupOrderCard key={`group-${entry.data._id}`} group={entry.data} />
                ) : (
                  <ItemCard key={`item-${entry.data._id}`} item={entry.data} />
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
