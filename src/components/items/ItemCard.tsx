import { useNavigate } from "react-router";
import { Card } from "../ui/Card";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { ProfitDisplay } from "./ProfitDisplay";
import { formatPHP } from "../../lib/formatters";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ItemCardProps {
  item: Doc<"items">;
}

export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      hover
      className="p-4 space-y-3"
      onClick={() => navigate(`/orders/${item._id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary truncate">
            {item.name}
          </h3>
          <p className="text-xs text-secondary">{item.seller}</p>
        </div>
        <CategoryBadge category={item.category} />
      </div>

      <div className="flex items-center justify-between">
        <ItemStatusBadge status={item.status} />
        <span className="font-mono text-sm text-primary">
          {formatPHP(item.pricePHP)}
        </span>
      </div>

      {item.status === "sold" && (
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <span className="text-xs text-secondary">Profit</span>
          <ProfitDisplay profit={item.profit} />
        </div>
      )}
    </Card>
  );
}
