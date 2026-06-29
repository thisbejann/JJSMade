import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/Skeleton";
import { ItemStatusBadge } from "../items/ItemStatusBadge";
import { CategoryIcon } from "../items/CategoryIcon";
import { formatRelativeDate } from "../../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function RecentOrders() {
  const items = useQuery(api.items.getRecent, { limit: 10 });
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Recent orders
        </h2>
        <button
          onClick={() => navigate("/orders")}
          className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
        >
          View all
        </button>
      </div>

      {items === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-tertiary">No orders logged yet.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => navigate(`/orders/${item._id}`)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface"
            >
              <CategoryIcon category={item.category} className="h-7 w-7" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                {item.name}
              </p>
              <span className="hidden shrink-0 text-xs tabular-nums text-tertiary sm:block">
                {formatRelativeDate(item.createdAt)}
              </span>
              <ItemStatusBadge status={item.status} className="shrink-0" />
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                strokeWidth={2}
                className="shrink-0 -translate-x-1 text-tertiary opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
