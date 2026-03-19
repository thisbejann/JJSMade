import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemTable } from "../components/items/ItemTable";
import { ItemCard } from "../components/items/ItemCard";
import { useDebounce } from "../hooks/useDebounce";
import { ALL_STATUSES, ALL_QC_STATUSES, ALL_CATEGORIES, STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG } from "../lib/constants";
import { Plus, Package, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "../lib/utils";


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

  const debouncedSearch = useDebounce(search);

  const items = useQuery(api.items.list, {
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    qcStatus: qcFilter || undefined,
    search: debouncedSearch || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  });

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-border-default bg-base pl-9 pr-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
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
              <List size={16} />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={cn("p-2 transition-colors cursor-pointer", viewMode === "grid" ? "bg-accent-muted text-accent" : "text-secondary hover:bg-hover")}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {items === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Package size={32} />}
            title="No items yet"
            description="Add your first order item and it will show up here. You'll be able to track it through the entire pipeline."
            actionLabel="Add Item"
            onAction={() => navigate("/orders/new")}
          />
        ) : viewMode === "table" ? (
          <ItemTable items={items} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>

    </PageContainer>
  );
}
