import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ImageUploadProps {
  images: { id: string; url: string }[];
  onUpload: (files: File[]) => void;
  onRemove: (id: string) => void;
  uploading?: boolean;
}

export function ImageUpload({ images, onUpload, onRemove, uploading }: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    multiple: true,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-accent bg-accent-muted"
            : "border-border-default hover:border-accent/40 hover:bg-hover/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto text-tertiary mb-2" />
        <p className="text-sm text-secondary">
          {isDragActive
            ? "Drop photos here..."
            : "Drag & drop QC photos, or click to select"}
        </p>
        <p className="text-xs text-tertiary mt-1">JPG, PNG, WebP</p>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden">
              <img
                src={img.url}
                alt="QC Photo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
