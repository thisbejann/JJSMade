import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { SellerCard } from "../components/sellers/SellerCard";
import { SellerForm } from "../components/sellers/SellerForm";
import { useDebounce } from "../hooks/useDebounce";
import { Plus, Users, Search } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { Id } from "../../convex/_generated/dataModel";

export default function SellersList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const sellers = useQuery(api.sellers.list, { search: debouncedSearch || undefined });
  const createSeller = useMutation(api.sellers.create);
  const updateSeller = useMutation(api.sellers.update);
  const removeSeller = useMutation(api.sellers.remove);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<(typeof sellers extends (infer T)[] | undefined ? T : never) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = async (data: { name: string; platform?: string; contactInfo?: string; storeLink?: string; notes?: string }) => {
    try {
      await createSeller(data as Parameters<typeof createSeller>[0]);
      toast.success("Seller added");
      setFormOpen(false);
    } catch {
      toast.error("Failed to add seller");
    }
  };

  const handleUpdate = async (data: { name: string; platform?: string; contactInfo?: string; storeLink?: string; notes?: string }) => {
    if (!editingSeller) return;
    try {
      await updateSeller({ id: editingSeller._id as Id<"sellers">, ...data } as Parameters<typeof updateSeller>[0]);
      toast.success("Seller updated");
      setEditingSeller(null);
    } catch {
      toast.error("Failed to update seller");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeSeller({ id: deleteTarget as Id<"sellers"> });
      toast.success("Seller deleted");
    } catch {
      toast.error("Failed to delete seller");
    }
    setDeleteTarget(null);
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers..."
              className="w-full rounded-lg border border-border-default bg-base pl-9 pr-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all" />
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add Seller
          </Button>
        </div>

        {sellers === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : sellers.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No sellers yet" description="Add your first seller to start tracking." actionLabel="Add Seller" onAction={() => setFormOpen(true)} />
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {sellers.map((seller) => (
              <motion.div key={seller._id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <SellerCard seller={seller} onEdit={() => setEditingSeller(seller)} onDelete={() => setDeleteTarget(seller._id)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <SellerForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      <SellerForm open={!!editingSeller} onClose={() => setEditingSeller(null)} onSubmit={handleUpdate} initialData={editingSeller ?? undefined} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Seller">
        <p className="text-sm text-secondary mb-4">Are you sure? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
