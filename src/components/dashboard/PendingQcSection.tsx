import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/Skeleton";
import { CategoryIcon } from "../items/CategoryIcon";
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

  const hasItems = items && items.length > 0;

  return (
    <section
      className={`h-fit rounded-3xl p-4 ${
        hasItems
          ? "bg-accent/5 ring-1 ring-accent/20"
          : "bg-surface ring-1 ring-border-subtle"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
          Pending QC
          {hasItems && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/15 px-1.5 text-xs font-medium tabular-nums text-accent">
              {items.length}
            </span>
          )}
        </h2>
        {items && items.length > 5 && (
          <button
            onClick={() => navigate("/orders?qcStatus=pending_review")}
            className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
          >
            View all
          </button>
        )}
      </div>

      {items === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-1 py-2 text-sm text-tertiary">All clear, nothing to review.</p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {items.slice(0, 5).map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center gap-3 rounded-2xl bg-base/40 px-2.5 py-2.5"
              >
                <CategoryIcon category={item.category} className="h-7 w-7" />
                <button
                  onClick={() => navigate(`/orders/${item._id}`)}
                  className="min-w-0 flex-1 cursor-pointer text-left transition-opacity hover:opacity-80"
                >
                  <p className="truncate text-sm font-medium text-primary">{item.name}</p>
                  <p className="truncate text-xs text-tertiary">{item.seller}</p>
                </button>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleQc(item._id, "gl")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={2} /> GL
                  </button>
                  <button
                    onClick={() => handleQc(item._id, "rl")}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} /> RL
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
