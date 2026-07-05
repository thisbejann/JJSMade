import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, EyeIcon } from "@hugeicons/core-free-icons";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { QcStatusBadge } from "./QcStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { ProfitDisplay } from "./ProfitDisplay";
import { formatPHP, formatCNY, formatWeight } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ItemRowProps {
  item: Doc<"items">;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function ItemRow({ item, selectable, selected, onSelect }: ItemRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/orders/${item._id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/orders/${item._id}`); } }}
      tabIndex={0}
      role="link"
      className={cn(
        "border-b border-border-subtle hover:bg-hover cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset",
        selected && "bg-accent-muted/30"
      )}
    >
      {/* Checkbox column — only rendered when selectable, so non-selectable
          tables (ItemTable) stay column-aligned with their headers */}
      {selectable && (
        <td className="py-3 px-4 w-px">
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={(e) => { e.stopPropagation(); onSelect?.(e.target.checked); }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${item.name}`}
            className="h-4 w-4 rounded border-border-default accent-accent cursor-pointer"
          />
        </td>
      )}
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
            aria-label={`View ${item.name}`}
            className="p-2.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={EyeIcon} size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${item._id}/edit`);
            }}
            aria-label={`Edit ${item.name}`}
            className="p-2.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Compact single-line entry for the mobile list view (table mode on small screens). */
export function ItemListRow({ item }: { item: Doc<"items"> }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/orders/${item._id}`)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{item.name}</p>
        <div className="mt-1 flex items-center gap-2 min-w-0">
          <ItemStatusBadge status={item.status} />
          <span className="min-w-0 truncate text-xs text-tertiary">{item.seller}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm text-primary">{formatPHP(item.sellingPrice)}</p>
        <ProfitDisplay profit={item.profit} className="text-xs" />
      </div>
    </div>
  );
}
