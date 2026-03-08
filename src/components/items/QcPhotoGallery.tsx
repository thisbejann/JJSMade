import { useMemo, useRef, useState } from "react";
import { useQueries, useQuery, type RequestForQueries } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Lightbox } from "../ui/Lightbox";
import { ImageOff, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface QcPhotoGalleryProps {
  photoIds?: Id<"_storage">[];
  onRemovePhoto?: (photoId: Id<"_storage">) => void;
}

function PhotoImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.storage.getUrl, { storageId });
  if (!url) return <div className="w-full h-full bg-hover animate-pulse" />;
  return <img src={url} alt="QC" className="w-full h-full object-cover" />;
}

function usePhotoUrls(photoIds: Id<"_storage">[]) {
  const queries = useMemo<RequestForQueries>(() => {
    const next: RequestForQueries = {};
    photoIds.forEach((id, index) => {
      next[String(index)] = {
        query: api.storage.getUrl,
        args: { storageId: id },
      };
    });
    return next;
  }, [photoIds]);

  const results = useQueries(queries);

  return useMemo(
    () =>
      photoIds.flatMap((_, index) => {
        const result = results[String(index)];
        return typeof result === "string" ? [result] : [];
      }),
    [photoIds, results],
  );
}

export function QcPhotoGallery({ photoIds, onRemovePhoto }: QcPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const emptyIds = useRef<Id<"_storage">[]>([]).current;
  const ids = photoIds ?? emptyIds;
  const urls = usePhotoUrls(ids);
  const handleRemoveAtIndex = (index: number) => {
    const id = ids[index];
    if (!id || !onRemovePhoto) return;
    onRemovePhoto(id);

    if (lightboxIndex < 0) return;
    if (ids.length === 1) {
      setLightboxIndex(-1);
      return;
    }
    if (index < lightboxIndex) {
      setLightboxIndex((current) => current - 1);
      return;
    }
    if (index === lightboxIndex && lightboxIndex === ids.length - 1) {
      setLightboxIndex((current) => Math.max(0, current - 1));
    }
  };

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
          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-hover"
          onClick={() => setLightboxIndex(0)}
        >
          <PhotoImage storageId={ids[0]} />
          {onRemovePhoto && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleRemoveAtIndex(0);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/80 transition-colors cursor-pointer"
              aria-label="Remove QC photo"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {ids.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {ids.map((id, i) => (
              <div
                key={`${id}-${i}`}
                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-accent transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="w-full h-full cursor-pointer"
                >
                  <PhotoImage storageId={id} />
                </button>
                {onRemovePhoto && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveAtIndex(i);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    aria-label="Remove QC photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
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
        onDeleteCurrent={
          onRemovePhoto && lightboxIndex >= 0
            ? () => handleRemoveAtIndex(lightboxIndex)
            : undefined
        }
      />
    </>
  );
}
