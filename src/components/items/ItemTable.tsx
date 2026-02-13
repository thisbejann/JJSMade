import { ItemRow } from "./ItemRow";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ItemTableProps {
  items: Doc<"items">[];
}

const COLUMNS = [
  "Item",
  "Seller",
  "Price",
  "Status",
  "QC",
  "Weight",
  "Selling Price",
  "Profit",
  "Actions",
];

export function ItemTable({ items }: ItemTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-surface">
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="py-3 px-4 text-left text-xs font-medium text-secondary uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ItemRow key={item._id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
