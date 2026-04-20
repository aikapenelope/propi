"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Globe, Check } from "lucide-react";
import { hapticSuccess } from "@/lib/haptics";

/**
 * Button that copies the agent's public portal URL to clipboard.
 * Shows in sidebar/dashboard. Uses Clerk userId for the URL.
 */
export function SharePortalButton() {
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!userId) return null;

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agente/${userId}`
      : `/agente/${userId}`;

  function handleCopy() {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      hapticSuccess();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
    >
      {copied ? (
        <Check className="h-[18px] w-[18px] shrink-0 text-green-500" />
      ) : (
        <Globe className="h-[18px] w-[18px] shrink-0" />
      )}
      <span>{copied ? "Link copiado" : "Mi Portal"}</span>
    </button>
  );
}
