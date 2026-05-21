"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteDocument } from "@/server/actions/documents";

/**
 * Per-document action buttons: download and delete.
 *
 * Download: uses a programmatic <a> click so the file streams directly into
 * the current browsing context (inline PDF viewer on iOS, Save dialog on
 * desktop, etc.) without opening a new tab or external browser window.
 *
 * The URL is built synchronously — no async/await before the click — so we
 * stay inside the browser's user-gesture context and popup blockers never
 * interfere.  Auth is enforced server-side via the session cookie.
 */
export function DocumentActions({ id, docKey }: { id: string; docKey: string }) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDownload() {
    const url = `/api/download?key=${encodeURIComponent(docKey)}`;

    // Programmatic anchor click — direct, synchronous, inside user-gesture
    // context.  The server responds with Content-Disposition: attachment so
    // the browser treats the response as a download (or inline preview on
    // platforms that handle it natively, like iOS PDF viewer).
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDocument(id);
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
