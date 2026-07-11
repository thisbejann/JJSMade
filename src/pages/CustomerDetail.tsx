import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { MetricTiles } from "../components/ui/MetricTiles";
import { ItemTable } from "../components/items/ItemTable";
import { formatPHP, formatDate } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PackageIcon, UserGroupIcon } from "@hugeicons/core-free-icons";

// Turn a group's first item names into a compact one-line label, e.g.
// "Jordan 1, Yeezy 350 +2". Returns null when the group has no items.
function groupPreview(names: string[] = [], count = 0): string | null {
  if (names.length === 0) return null;
  const shown = names.join(", ");
  const extra = count - names.length;
  return extra > 0 ? `${shown} +${extra}` : shown;
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
          <MetricTiles
            className="grid-cols-2 sm:grid-cols-3"
            metrics={[
              { label: "Total Orders", value: String(orderCount) },
              { label: "Lifetime Profit", value: formatPHP(totalProfit) },
              { label: "Lifetime Revenue", value: formatPHP(totalRevenue) },
            ]}
          />
        </div>

        {/* Group Orders */}
        {groups.length > 0 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Group Orders <span className="font-normal text-tertiary">({groups.length})</span>
            </h2>
            <div className="rounded-lg border border-border-default overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-subtle">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-secondary uppercase tracking-wide">Group</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-secondary uppercase tracking-wide">Value</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-secondary uppercase tracking-wide">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, i) => {
                    const itemCount = group.itemCount ?? 0;
                    const preview = groupPreview(group.previewNames, itemCount);
                    // The note is a group's human-given name; when it exists it leads.
                    // Otherwise the item preview becomes the identity so no two rows
                    // read alike, and the count/value/date columns disambiguate the rest.
                    const title = group.notes?.trim() || preview || "Empty group";
                    const subtitle = group.notes?.trim() && preview ? preview : null;
                    return (
                      <tr
                        key={group._id}
                        className={`cursor-pointer transition-colors hover:bg-hover ${i !== 0 ? "border-t border-border-default" : ""}`}
                      >
                        <td className="px-4 py-3 align-top">
                          <Link to={`/groups/${group._id}`} className="group flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                              <HugeiconsIcon icon={UserGroupIcon} size={13} strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0 flex flex-col gap-0.5">
                              <span className="truncate font-medium text-primary group-hover:text-accent transition-colors">
                                {title}
                              </span>
                              <span className="truncate text-xs text-tertiary">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                                {subtitle && <span className="text-secondary"> · {subtitle}</span>}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right align-top font-mono text-primary tabular-nums">
                          {formatPHP(group.value ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right align-top text-secondary whitespace-nowrap">
                          {formatDate(group.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Solo Items */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Solo Items {soloItems.length > 0 && <span className="font-normal text-tertiary">({soloItems.length})</span>}
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
