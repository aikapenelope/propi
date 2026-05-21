"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteDocument } from "@/server/actions/documents";

/**
 * Per-document action buttons: download and delete.
 *
 * Download implementation — iOS PWA considerations
 * ─────────────────────────────────────────────────
 * The download URL is constructed synchronously (no await) so we stay
 * inside the browser's user-gesture context and avoid popup blockers.
 *
 * We use `window.open(url, "_blank")` rather than a programmatic <a> click
 * for one critical reason: iOS PWA standalone mode.
 *
 * When the app is installed to the Home Screen (standalone display mode),
 * the entire app runs inside a WKWebView.  Navigating that WebView to a
 * binary-stream URL (even with `Content-Disposition: attachment`) does NOT
 * trigger the iOS download manager.  Instead:
 *   - For PDFs:  Safari renders the PDF inline inside the WebView.  There
 *     is no back-navigation available because the WebView's history entry
 *     for a binary stream cannot be revisited with the back gesture —
 *     the user is "stuck" on a blank or PDF page with no way to return.
 *   - For other file types: the WebView shows a blank page for the same
 *     reason.
 *
 * `window.open(url, "_blank")` breaks out of this trap:
 *   - iOS opens the URL in a **new Safari browser window** (outside the PWA
 *     shell).  Safari handles the download or preview natively, and the user
 *     can close the Safari window or tap "Back to [App Name]" to return to
 *     the PWA.
 *   - On desktop and Android PWA, `_blank` opens a new tab, which is the
 *     standard and expected behavior for downloads.
 *   - Because the call is synchronous (no await between the click event and
 *     `window.open`), it is inside the user-gesture context and is never
 *     blocked by popup blockers.
 */
export function DocumentActions({ id, docKey }: { id: string; docKey: string }) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDownload() {
    // Synchronous URL construction — stays in user-gesture context.
    // Auth is enforced server-side via the session cookie.
    const url = `/api/download?key=${encodeURIComponent(docKey)}`;

    // Open in a new browser context.  On iOS PWA this exits the WKWebView
    // and opens Safari, preventing the blank-page / stuck-navigation issue.
    // The `noopener` and `noreferrer` features harden against clickjacking
    // and prevent the opened window from accessing `window.opener`.
    window.open(url, "_blank", "noopener,noreferrer");
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
