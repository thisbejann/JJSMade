import { useParams, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { ItemForm } from "../components/items/ItemForm";
import { Skeleton } from "../components/ui/Skeleton";
import type { Id } from "../../convex/_generated/dataModel";

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const groupId = searchParams.get("groupId") as Id<"orderGroups"> | null ?? undefined;
  const lockedCustomerId = searchParams.get("customerId") as Id<"customers"> | null ?? undefined;

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
        lockedCustomerId={lockedCustomerId}
        groupId={groupId}
        onSuccess={(itemId) =>
          groupId ? navigate(`/groups/${groupId}`) : navigate(`/orders/${itemId}`)
        }
      />
    </PageContainer>
  );
}
