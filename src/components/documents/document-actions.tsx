"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import {
  getDocumentDownloadUrl,
  deleteDocument,
} from "@/server/actions/documents";

export function DocumentActions({ id, docKey }: { id: string; docKey: string }) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDownload() {
    const url = await getDocumentDownloadUrl(docKey);
    window.open(url, "_blank");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDocument(id, docKey);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
        >
          {deleting ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={handleDownload}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Descargar"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        onClick={() => setConfirming(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
