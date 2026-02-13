import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Lightbox } from "../ui/Lightbox";
import { ImageOff } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface QcPhotoGalleryProps {
  photoIds?: Id<"_storage">[];
}

function PhotoImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.storage.getUrl, { storageId });
  if (!url) return <div className="w-full h-full bg-hover animate-pulse" />;
  return <img src={url} alt="QC" className="w-full h-full object-cover" />;
}

function usePhotoUrls(photoIds: Id<"_storage">[]) {
  const urls: string[] = [];
  for (const id of photoIds) {
    const url = useQuery(api.storage.getUrl, { storageId: id });
    if (url) urls.push(url);
  }
  return urls;
}

export function QcPhotoGallery({ photoIds }: QcPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const ids = photoIds ?? [];
  const urls = usePhotoUrls(ids);

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-tertiary">
        <ImageOff size={32} className="mb-2" />
        <p className="text-sm">No QC photos uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main photo */}
        <div
          className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-hover"
          onClick={() => setLightboxIndex(0)}
        >
          <PhotoImage storageId={ids[0]} />
        </div>

        {/* Thumbnail strip */}
        {ids.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {ids.map((id, i) => (
              <button
                key={id}
                onClick={() => setLightboxIndex(i)}
                className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-accent transition-colors cursor-pointer"
              >
                <PhotoImage storageId={id} />
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        images={urls}
        currentIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
