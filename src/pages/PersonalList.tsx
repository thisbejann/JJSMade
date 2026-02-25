import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { CategoryBadge } from "../components/items/CategoryBadge";
import { useDebounce } from "../hooks/useDebounce";
import {
  ALL_PERSONAL_STATUSES,
  ALL_CATEGORIES,
  PERSONAL_STATUS_CONFIG,
  CATEGORY_CONFIG,
} from "../lib/constants";
import { formatPHP, formatCNY, formatDate } from "../lib/formatters";
import { Plus, ShoppingBag, Search } from "lucide-react";
import { cn } from "../lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";

export default function PersonalList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(search);

  const items = useQuery(api.personalItems.list, {
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    search: debouncedSearch || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  });

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-primary">Personal Items</h1>
            <p className="text-sm text-tertiary mt-0.5">Items bought for personal use</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-border-default bg-base pl-9 pr-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={ALL_PERSONAL_STATUSES.map((s) => ({
              value: s,
              label: PERSONAL_STATUS_CONFIG[s].label,
            }))}
            placeholder="All Statuses"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_CONFIG[c].label }))}
            placeholder="All Categories"
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
            ]}
          />
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
            icon={<ShoppingBag size={32} />}
            title="No personal items yet"
            description="Track items you've bought for yourself — no sale or profit fields."
            actionLabel="Add Personal Item"
            onAction={() => navigate("/personal/new")}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <PersonalItemRow key={item._id} item={item} onClick={() => navigate(`/personal/${item._id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/personal/new")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-base shadow-lg hover:bg-accent-hover transition-all hover:scale-105 flex items-center justify-center cursor-pointer z-40"
      >
        <Plus size={24} />
      </button>
    </PageContainer>
  );
}

function PersonalItemRow({
  item,
  onClick,
}: {
  item: Doc<"personalItems">;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl border border-border-subtle bg-surface",
        "hover:border-border-default hover:bg-hover cursor-pointer transition-all"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-primary truncate">{item.name}</span>
          <CategoryBadge category={item.category} />
        </div>
        <p className="text-xs text-tertiary mt-0.5">
          {item.seller}
          {item.batch && ` · ${item.batch}`}
          {" · "}
          {formatDate(item.orderDate)}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="font-mono text-sm text-primary">{formatPHP(item.pricePHP)}</p>
          <p className="text-xs text-tertiary">{formatCNY(item.priceCNY)}</p>
        </div>
        <ItemStatusBadge status={item.status} />
      </div>
    </div>
  );
}
