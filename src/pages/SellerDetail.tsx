import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemTable } from "../components/items/ItemTable";
import { SellerStats } from "../components/sellers/SellerStats";
import { PLATFORM_CONFIG } from "../lib/constants";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const seller = useQuery(api.sellers.getById, { id: id as Id<"sellers"> });
  const items = useQuery(api.items.list, seller ? { seller: seller.name } : "skip");

  if (seller === undefined) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-48 w-full" />
      </PageContainer>
    );
  }

  if (seller === null) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-secondary">Seller not found</p>
          <Button variant="ghost" onClick={() => navigate("/sellers")} className="mt-4">Back</Button>
        </div>
      </PageContainer>
    );
  }

  const soldItems = (items ?? []).filter((i) => i.status === "sold");
  const totalProfit = soldItems.reduce((sum, i) => sum + (i.profit ?? 0), 0);
  const avgProfit = soldItems.length > 0 ? totalProfit / soldItems.length : 0;
  const totalSpent = (items ?? []).reduce((sum, i) => sum + (i.pricePHP ?? 0), 0);

  return (
    <PageContainer>
      <div className="space-y-6">
        <button onClick={() => navigate("/sellers")} className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer">
          <ArrowLeft size={14} /> Back to Sellers
        </button>

        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-primary">{seller.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {seller.platform && (
                  <Badge>{PLATFORM_CONFIG[seller.platform as keyof typeof PLATFORM_CONFIG]?.label ?? seller.platform}</Badge>
                )}
              </div>
              {seller.contactInfo && <p className="text-sm text-secondary mt-2">{seller.contactInfo}</p>}
            </div>
            {seller.storeLink && (
              <a href={seller.storeLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors">
                <ExternalLink size={14} /> Store
              </a>
            )}
          </CardContent>
        </Card>

        <SellerStats
          totalItems={(items ?? []).length}
          soldItems={soldItems.length}
          totalProfit={Math.round(totalProfit * 100) / 100}
          avgProfit={Math.round(avgProfit * 100) / 100}
          totalSpent={Math.round(totalSpent * 100) / 100}
        />

        {items === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : items.length > 0 ? (
          <ItemTable items={items} />
        ) : (
          <p className="text-center text-secondary py-8">No items from this seller yet.</p>
        )}
      </div>
    </PageContainer>
  );
}
