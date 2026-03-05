import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type ExcludedReference =
  | { table: "items"; id: Id<"items"> }
  | { table: "personalItems"; id: Id<"personalItems"> };

export async function deleteUnreferencedQcPhotos(
  ctx: MutationCtx,
  candidateIds: Id<"_storage">[],
  excluded?: ExcludedReference
) {
  if (candidateIds.length === 0) return;

  const uniqueIds = Array.from(new Set(candidateIds));
  const [items, personalItems] = await Promise.all([
    ctx.db.query("items").collect(),
    ctx.db.query("personalItems").collect(),
  ]);

  for (const storageId of uniqueIds) {
    const usedByItem = items.some((item) => {
      if (excluded?.table === "items" && item._id === excluded.id) {
        return false;
      }
      return (item.qcPhotoIds ?? []).includes(storageId);
    });

    if (usedByItem) continue;

    const usedByPersonalItem = personalItems.some((item) => {
      if (excluded?.table === "personalItems" && item._id === excluded.id) {
        return false;
      }
      return (item.qcPhotoIds ?? []).includes(storageId);
    });

    if (!usedByPersonalItem) {
      await ctx.storage.delete(storageId);
    }
  }
}
