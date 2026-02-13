import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { ItemStatusBadge } from "../items/ItemStatusBadge";
import { CategoryBadge } from "../items/CategoryBadge";
import { formatRelativeDate } from "../../lib/formatters";

export function RecentOrders() {
  const items = useQuery(api.items.getRecent, { limit: 8 });
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">Recent Orders</h2>
      </CardHeader>
      <CardContent className="p-0">
        {items === undefined ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-secondary py-8 text-sm">No orders yet</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {items.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/orders/${item._id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{item.name}</p>
                  <p className="text-xs text-tertiary">{formatRelativeDate(item.createdAt)}</p>
                </div>
                <CategoryBadge category={item.category} />
                <ItemStatusBadge status={item.status} />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
