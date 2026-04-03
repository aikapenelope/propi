"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import {
  getUploadKey,
  addPropertyImage,
  deletePropertyImage,
} from "@/server/actions/properties";

interface PropertyImage {
  id: string;
  key: string;
  filename: string | null;
  url?: string;
}

interface PropertyImageUploadProps {
  propertyId: string;
  images: PropertyImage[];
}

export function PropertyImageUpload({
  propertyId,
  images,
}: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get the key from server (includes userId prefix)
      const { key } = await getUploadKey(propertyId, file.name);

      // 2. Upload file to server-side API route (which forwards to MinIO)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);
      formData.append("bucket", "media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      // 3. Save image record in DB
      await addPropertyImage(propertyId, key, file.name, images.length === 0);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string, key: string) {
    setDeleting(imageId);
    try {
      await deletePropertyImage(imageId, key);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Imagenes ({images.length})
        </h2>
        <label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
          />
          <span className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Subiendo..." : "Subir Imagen"}
          </span>
        </label>
      </div>

      {images.length === 0 ? (
        <div className="flex aspect-[16/6] items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
          <div className="text-center">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-1 text-xs">Sin imagenes. Sube la primera.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
            >
              {img.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img.url}
                  alt={img.filename || "Propiedad"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {img.filename || img.key}
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id, img.key)}
                disabled={deleting === img.id}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                title="Eliminar imagen"
              >
                {deleting === img.id ? (
                  <span className="text-[10px]">...</span>
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
