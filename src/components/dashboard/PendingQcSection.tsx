import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Id } from "../../../convex/_generated/dataModel";

export function PendingQcSection() {
  const items = useQuery(api.items.list, { qcStatus: "pending_review" });
  const updateQcStatus = useMutation(api.items.updateQcStatus);

  const handleQc = async (id: string, status: "gl" | "rl") => {
    try {
      await updateQcStatus({ id: id as Id<"items">, qcStatus: status });
      toast.success(status === "gl" ? "GL approved!" : "RL rejected");
    } catch {
      toast.error("Failed to update QC status");
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-semibold text-sm text-primary">
          Pending QC Review
          {items && items.length > 0 && (
            <span className="ml-2 text-xs text-accent font-mono">({items.length})</span>
          )}
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        {items === undefined ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-secondary py-8 text-sm">No items pending review</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {items.slice(0, 5).map((item) => (
              <div key={item._id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{item.name}</p>
                  <p className="text-xs text-tertiary">{item.seller}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => handleQc(item._id, "gl")}
                    className="!text-success hover:!bg-success-muted">
                    <Check size={14} /> GL
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleQc(item._id, "rl")}
                    className="!text-danger hover:!bg-danger-muted">
                    <X size={14} /> RL
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
