import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPHP } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { Contact01Icon } from "@hugeicons/core-free-icons";

export default function CustomersList() {
  const navigate = useNavigate();
  const customers = useQuery(api.customers.listWithStats);

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary">Customers</h1>
        </div>

        {customers === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={Contact01Icon} size={32} strokeWidth={1.5} />}
            title="No customers yet"
            description="Customers are created automatically when you add an item or create a group order."
          />
        ) : (
          <div className="rounded-lg border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-subtle">
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Total Profit</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <tr
                    key={customer._id}
                    onClick={() => navigate(`/customers/${customer._id}`)}
                    className={`cursor-pointer transition-colors hover:bg-hover ${i !== 0 ? "border-t border-border-default" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-primary">{customer.name}</td>
                    <td className="px-4 py-3 text-right text-secondary">{customer.orderCount}</td>
                    <td className={`px-4 py-3 text-right font-medium ${customer.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatPHP(customer.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
