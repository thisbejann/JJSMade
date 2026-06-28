import { useNavigate } from "react-router";
import { Card } from "../ui/Card";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { CategoryIcon } from "./CategoryIcon";
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
      className="cursor-pointer p-4 space-y-3 transition-colors hover:border-primary/30"
      onClick={() => navigate(`/orders/${item._id}`)}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <CategoryIcon category={item.category} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary truncate">
            {item.name}
          </h3>
          <p className="text-xs text-secondary truncate">{item.seller}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <ItemStatusBadge status={item.status} />
        <span className="text-sm font-semibold text-primary">
          {formatPHP(item.pricePHP)}
        </span>
      </div>

      {(item.status === "delivered_to_customer" || item.status === "sold") && (
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <span className="text-xs text-secondary">Profit</span>
          <ProfitDisplay profit={item.profit} />
        </div>
      )}
    </Card>
  );
}
