import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface LightboxProps {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDeleteCurrent?: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  open,
  onClose,
  onNavigate,
  onDeleteCurrent,
}: LightboxProps) {
  const lightboxRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        lightboxRef.current?.focus();
      });
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Keyboard + focus trap
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();

      if (e.key === "Tab" && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${currentIndex + 1} of ${images.length}`}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 outline-none"
        >
          <button
            onClick={onClose}
            aria-label="Close lightbox"
            className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={1.5} />
          </button>
          {onDeleteCurrent && (
            <button
              type="button"
              onClick={onDeleteCurrent}
              aria-label="Delete current photo"
              className="absolute top-4 right-16 px-3 py-2 rounded-lg text-sm font-medium text-white/85 bg-white/10 hover:bg-danger/80 hover:text-white transition-colors cursor-pointer z-10"
            >
              Delete photo
            </button>
          )}

          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={32} strokeWidth={1.5} />
            </button>
          )}

          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            src={images[currentIndex]}
            alt={`Photo ${currentIndex + 1} of ${images.length}`}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
          />

          {currentIndex < images.length - 1 && (
            <button
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={32} strokeWidth={1.5} />
            </button>
          )}

          <div className="absolute bottom-4 text-sm text-white/50" aria-live="polite">
            {currentIndex + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
