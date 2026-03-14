"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import {
  getDocumentUploadUrl,
  createDocument,
} from "@/server/actions/documents";

export function UploadDocumentButton() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get presigned upload URL
      const { url, key } = await getDocumentUploadUrl(
        file.name,
        file.type,
      );

      // Upload directly to MinIO
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Create document record
      await createDocument({
        name: file.name,
        key,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Subiendo..." : "Subir Documento"}
      </button>
    </>
  );
}
