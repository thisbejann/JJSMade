import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { ItemForm } from "../components/items/ItemForm";
import { Skeleton } from "../components/ui/Skeleton";
import type { Id } from "../../convex/_generated/dataModel";

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existingItem = useQuery(
    api.items.getById,
    id ? { id: id as Id<"items"> } : "skip"
  );

  if (isEdit && existingItem === undefined) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ItemForm
        key={id ?? "new"}
        existingItem={isEdit && existingItem ? existingItem : undefined}
        onSuccess={(itemId) => navigate(`/orders/${itemId}`)}
      />
    </PageContainer>
  );
}
