import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardContent, CardTitle, CardAction } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Id } from "../../../convex/_generated/dataModel";

export function PendingQcSection() {
  const items = useQuery(api.items.list, { qcStatus: "pending_review" });
  const updateQcStatus = useMutation(api.items.updateQcStatus);
  const navigate = useNavigate();

  const handleQc = async (id: string, status: "gl" | "rl") => {
    try {
      await updateQcStatus({ id: id as Id<"items">, qcStatus: status });
      toast.success(status === "gl" ? "GL approved!" : "RL rejected");
    } catch {
      toast.error("Failed to update QC status");
    }
  };

  const hasOverflow = items && items.length > 5;
  const hasItems = items && items.length > 0;

  return (
    <Card className={hasItems ? "ring-1 ring-accent/20" : undefined}>
      <CardHeader>
        <CardTitle>
          Pending QC
          {items && items.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium text-accent bg-accent/10 rounded-full tabular-nums">
              {items.length}
            </span>
          )}
        </CardTitle>
        {hasOverflow && (
          <CardAction>
            <button
              onClick={() => navigate("/orders?qcStatus=pending_review")}
              className="text-xs text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              View all
            </button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {items === undefined ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-secondary py-6 text-sm">
            All clear — no items pending review.
          </p>
        ) : (
          <div className="divide-y divide-border-subtle">
            <AnimatePresence initial={false}>
              {items.slice(0, 5).map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <button
                    onClick={() => navigate(`/orders/${item._id}`)}
                    className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                    <p className="text-xs text-tertiary mt-0.5">{item.seller}</p>
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleQc(item._id, "gl")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-success bg-success/8 hover:bg-success/15 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={2} /> GL
                    </button>
                    <button
                      onClick={() => handleQc(item._id, "rl")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-danger bg-danger/8 hover:bg-danger/15 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} /> RL
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
