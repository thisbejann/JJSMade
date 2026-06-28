import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent, CardTitle, CardAction } from "../ui/Card";
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardAction>
          <button
            onClick={() => navigate("/orders")}
            className="text-xs text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            View all
          </button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {items === undefined ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-secondary py-8 text-sm">
            No recent orders yet.
          </p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {items.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/orders/${item._id}`)}
                className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/5 transition-colors text-left cursor-pointer"
              >
                <CategoryIcon category={item.category} />
                <p className="flex-1 min-w-0 truncate text-sm font-medium text-primary">{item.name}</p>
                <span className="hidden sm:block shrink-0 text-xs text-tertiary tabular-nums">
                  {formatRelativeDate(item.createdAt)}
                </span>
                <ItemStatusBadge status={item.status} className="shrink-0" />
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-tertiary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
