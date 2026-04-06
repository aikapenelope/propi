import { AlertTriangle } from "lucide-react";

/**
 * Shows a warning badge when a Meta token is expiring within 7 days.
 * Meta long-lived tokens expire after 60 days and cannot be auto-refreshed.
 */
export function TokenExpiryWarning({ expiresAt }: { expiresAt: Date | null }) {
  if (!expiresAt) return null;

  const now = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 7) return null;

  if (daysLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] font-medium text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Token expirado - reconecta
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-400">
      <AlertTriangle className="h-3 w-3" />
      Expira en {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
    </span>
  );
}
