import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { ItemTable } from "../components/items/ItemTable";
import { formatPHP, formatDate } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PackageIcon, UserGroupIcon } from "@hugeicons/core-free-icons";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-subtle px-4 py-3">
      <p className="text-xs text-secondary mb-1">{label}</p>
      <p className="text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useQuery(api.customers.getProfile, { id: id as Id<"customers"> });

  if (profile === undefined) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (profile === null) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-secondary text-sm">Customer not found.</p>
          <Button variant="ghost" onClick={() => navigate("/customers")} className="mt-4">Back</Button>
        </div>
      </PageContainer>
    );
  }

  const { groups, soloItems, orderCount, totalProfit, totalRevenue } = profile;

  return (
    <PageContainer>
      <div className="space-y-6">
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} /> Back to Customers
        </button>

        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-primary mb-4">{profile.name}</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Total Orders" value={String(orderCount)} />
            <StatCard label="Lifetime Profit" value={formatPHP(totalProfit)} />
            <StatCard label="Lifetime Revenue" value={formatPHP(totalRevenue)} />
          </div>
        </div>

        {/* Group Orders */}
        {groups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Group Orders</h2>
            <div className="rounded-lg border border-border-default overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-subtle">
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Group</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Notes</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, i) => (
                    <tr
                      key={group._id}
                      className={`cursor-pointer transition-colors hover:bg-hover ${i !== 0 ? "border-t border-border-default" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/groups/${group._id}`}
                          className="flex items-center gap-2 font-medium text-primary hover:text-accent transition-colors"
                        >
                          <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-secondary" />
                          Group Order
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary">{group.notes ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-secondary">{formatDate(group.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Solo Items */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Solo Items {soloItems.length > 0 && <span className="text-secondary font-normal">({soloItems.length})</span>}
          </h2>
          {soloItems.length === 0 ? (
            <div className="rounded-lg border border-border-default bg-subtle p-8 text-center">
              <HugeiconsIcon icon={PackageIcon} size={24} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-secondary text-sm">No solo items — all orders are grouped.</p>
            </div>
          ) : (
            <ItemTable items={soloItems} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
