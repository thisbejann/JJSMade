import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { PersonalItemForm } from "../components/personal/PersonalItemForm";
import { Skeleton } from "../components/ui/Skeleton";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existingItem = useQuery(
    api.personalItems.getById,
    id ? { id: id as Id<"personalItems"> } : "skip"
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
      <div className="space-y-4">
        <div>
          <button
            onClick={() => navigate("/personal")}
            className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer mb-4"
          >
            ← Back to Personal Items
          </button>
          <h1 className="font-display font-bold text-2xl text-primary">
            {isEdit ? "Edit Personal Item" : "New Personal Item"}
          </h1>
        </div>
        <PersonalItemForm
          key={id ?? "new"}
          existingItem={isEdit && existingItem ? existingItem : undefined}
          onSuccess={(itemId) => navigate(`/personal/${itemId}`)}
        />
      </div>
    </PageContainer>
  );
}
