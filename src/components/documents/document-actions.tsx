"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteDocument } from "@/server/actions/documents";

/**
 * Per-document action buttons: download and delete.
 *
 * Download implementation notes
 * ─────────────────────────────
 * The download URL is constructed synchronously on the client.  The
 * server-side `/api/download` route enforces authentication via the user's
 * session cookie, so no extra server round-trip is needed to produce the URL.
 *
 * Critically: `window.open()` and programmatic anchor clicks are only
 * allowed by browsers within the synchronous execution of a user-gesture
 * callback (the click handler).  Any `await` between the click and the
 * navigation breaks this guarantee, causing the browser's popup blocker
 * to silently suppress the new tab/download — which manifests as a blank
 * page or no response at all.
 *
 * The pattern used here (create a temporary <a>, click it, remove it) is
 * the standard cross-browser way to trigger a file download programmatically
 * without opening a new tab and without any async/await.
 */
export function DocumentActions({ id, docKey }: { id: string; docKey: string }) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDownload() {
    // Build the URL synchronously so this function stays inside the
    // user-gesture context (no await).  Auth is enforced server-side via
    // the session cookie that the browser sends automatically.
    const url = `/api/download?key=${encodeURIComponent(docKey)}`;

    // A temporary <a> element is used instead of window.open() to trigger
    // a download rather than navigating the current tab or opening a new one.
    // The filename comes from the server's Content-Disposition header.
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
