"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteDocument } from "@/server/actions/documents";
import { useToast } from "@/components/ui/toast";

/**
 * Per-document action buttons: download and delete.
 *
 * Download implementation — iOS PWA and popup-blocker considerations
 * ──────────────────────────────────────────────────────────────────
 * The download URL is constructed synchronously (no await) so we remain
 * inside the browser's user-gesture context.  Browsers only allow
 * programmatic window navigation within the synchronous execution of a
 * click handler; any `await` before the open call breaks this contract and
 * causes the popup blocker to suppress the download silently.
 *
 * We use `window.open(url, "_blank")` rather than a programmatic <a> click:
 *
 * iOS PWA (standalone mode) — WKWebView limitation
 * ─────────────────────────────────────────────────
 * When the app is installed to the iPhone Home Screen (standalone display
 * mode), the entire UI runs inside a WKWebView — Apple's embedded browser
 * engine.  WKWebView does not have a standalone download manager.
 * Navigating the WebView in-place to a binary-stream URL (even with
 * `Content-Disposition: attachment`) does NOT trigger the iOS Files / Share
 * Sheet workflow.  Instead:
 *   - PDFs: rendered inline inside the WebView.  The WebView history entry
 *     for a binary stream is not a navigable page, so the back-swipe gesture
 *     does nothing — the user is "stuck" with no way to return to the app.
 *   - Other file types: the WebView shows a blank page for the same reason.
 *
 * `window.open(url, "_blank")` breaks out of this trap: iOS opens the URL
 * in a **new Safari browser window** (outside the PWA shell).  Safari
 * handles the file natively (PDF Quick Look, "Save to Files" action sheet,
 * etc.), and the user can tap the iOS "Back to [App Name]" banner or close
 * Safari to return to the PWA.
 *
 * On Android PWA and all desktop browsers, `_blank` opens a new tab, which
 * is standard behaviour for downloads.
 *
 * null-return guard
 * ─────────────────
 * `window.open` returns null when the popup blocker prevents the new window
 * from opening.  In a direct click handler (user gesture) this should never
 * happen, but enterprise security policies and some browser extensions can
 * block all new-window navigations unconditionally.  We surface a toast so
 * the user gets actionable feedback rather than silent failure.
 */
export function DocumentActions({ id, docKey }: { id: string; docKey: string }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDownload() {
    // Synchronous URL construction — stays in user-gesture context.
    // Auth is enforced server-side via the session cookie.
    const url = `/api/download?key=${encodeURIComponent(docKey)}`;

    // `noopener` prevents the new window from accessing `window.opener`
    // (clickjacking mitigation).
    // `noreferrer` omits the Referer header and implies `noopener`.
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      // Popup was blocked.  See module-level JSDoc for when this occurs.
      toast(
        "Tu navegador bloqueó la descarga. Permite ventanas emergentes para este sitio e intenta de nuevo.",
        "error",
      );
    }
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
