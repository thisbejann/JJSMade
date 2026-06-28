import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Shared QC action logic for the dashboard prototype variants. The three
 * variants differ only in presentation; the optimistic GL/RL mutation is
 * identical, so it lives here rather than being copied three times.
 */
export function usePendingQc() {
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

  return { items, handleQc };
}

/** Live dashboard reads shared by every variant. */
export function useDashboardData() {
  const stats = useQuery(api.analytics.getDashboardStats);
  const statusCounts = useQuery(api.items.getByStatus);
  const recent = useQuery(api.items.getRecent, { limit: 10 });
  return { stats, statusCounts, recent };
}
