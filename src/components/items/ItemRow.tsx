import { useNavigate } from "react-router";
import { Edit, Eye } from "lucide-react";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { QcStatusBadge } from "./QcStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { ProfitDisplay } from "./ProfitDisplay";
import { formatPHP, formatCNY, formatWeight } from "../../lib/formatters";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ItemRowProps {
  item: Doc<"items">;
}

export function ItemRow({ item }: ItemRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/orders/${item._id}`)}
      className="border-b border-border-subtle hover:bg-hover cursor-pointer transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate max-w-[200px]">
              {item.name}
            </p>
            <CategoryBadge category={item.category} />
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-primary">{item.seller}</p>
        {item.batch && (
          <p className="text-xs text-tertiary">{item.batch}</p>
        )}
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-mono text-primary">{formatCNY(item.priceCNY)}</p>
        <p className="text-xs font-mono text-secondary">{formatPHP(item.pricePHP)}</p>
      </td>
      <td className="py-3 px-4">
        <ItemStatusBadge status={item.status} />
      </td>
      <td className="py-3 px-4">
        <QcStatusBadge qcStatus={item.qcStatus} />
      </td>
      <td className="py-3 px-4 font-mono text-sm text-secondary">
        {formatWeight(item.weightKg)}
      </td>
      <td className="py-3 px-4 font-mono text-sm text-primary">
        {formatPHP(item.sellingPrice)}
      </td>
      <td className="py-3 px-4">
        <ProfitDisplay profit={item.profit} />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${item._id}`);
            }}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${item._id}/edit`);
            }}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <Edit size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
