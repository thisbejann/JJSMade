import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { CustomerPicker } from "./CustomerPicker";
import { Input } from "../ui/Input";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface GroupPickerModalProps {
  itemIds: Id<"items">[];
  sharedCustomerId: Id<"customers"> | null;
  onClose: () => void;
  onDone: () => void;
}

export function GroupPickerModal({ itemIds, sharedCustomerId, onClose, onDone }: GroupPickerModalProps) {
  const groups = useQuery(api.orderGroups.list) ?? [];
  const addItems = useMutation(api.orderGroups.addItems);
  const createGroup = useMutation(api.orderGroups.create);

  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"orderGroups"> | null>(null);
  const [newCustomerId, setNewCustomerId] = useState<Id<"customers"> | null>(sharedCustomerId);
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only show groups matching the shared customer (if set)
  const eligibleGroups = sharedCustomerId
    ? groups.filter((g) => g.customerId === sharedCustomerId)
    : groups;

  const handleAddToExisting = async () => {
    if (!selectedGroupId) { toast.error("Please select a group"); return; }
    setSubmitting(true);
    try {
      await addItems({ groupId: selectedGroupId, itemIds });
      toast.success(`${itemIds.length} item${itemIds.length !== 1 ? "s" : ""} added to group`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add items to group");
    }
    setSubmitting(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newCustomerId) { toast.error("Please select a customer"); return; }
    setSubmitting(true);
    try {
      const groupId = await createGroup({ customerId: newCustomerId, notes: newNotes.trim() || undefined });
      await addItems({ groupId, itemIds });
      toast.success("Group created and items added");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base border border-border-default rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-primary mb-1">Group {itemIds.length} Item{itemIds.length !== 1 ? "s" : ""}</h2>
        <p className="text-xs text-secondary mb-4">Add to an existing group or create a new one.</p>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 bg-subtle rounded-lg p-1">
          <button
            onClick={() => setMode("pick")}
            className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
              mode === "pick" ? "bg-base text-primary shadow-sm" : "text-secondary hover:text-primary"
            )}
          >
            Existing Group
          </button>
          <button
            onClick={() => setMode("create")}
            className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
              mode === "create" ? "bg-base text-primary shadow-sm" : "text-secondary hover:text-primary"
            )}
          >
            New Group
          </button>
        </div>

        {mode === "pick" ? (
          <div className="space-y-3">
            {eligibleGroups.length === 0 ? (
              <p className="text-sm text-secondary text-center py-6">
                No compatible groups found.{" "}
                <button onClick={() => setMode("create")} className="text-accent hover:underline cursor-pointer">
                  Create one?
                </button>
              </p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {eligibleGroups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroupId(group._id)}
                    className={cn(
                      "w-full flex items-center gap-3 text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer",
                      selectedGroupId === group._id
                        ? "border-accent bg-accent-muted/30 text-primary"
                        : "border-border-default hover:bg-hover text-secondary"
                    )}
                  >
                    <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{group.customerName}</p>
                      {group.notes && <p className="text-xs text-secondary truncate">{group.notes}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAddToExisting} disabled={!selectedGroupId || submitting}>
                {submitting ? "Adding..." : "Add to Group"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Customer</label>
              <CustomerPicker
                value={newCustomerId}
                onChange={setNewCustomerId}
                placeholder="Search or create customer..."
                disabled={!!sharedCustomerId}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Notes (optional)</label>
              <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. Batch Jan 2026" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={handleCreateAndAdd} disabled={!newCustomerId || submitting}>
                {submitting ? "Creating..." : "Create & Add"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
