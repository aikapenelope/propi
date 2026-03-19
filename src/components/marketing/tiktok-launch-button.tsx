"use client";

import { ExternalLink } from "lucide-react";

interface TikTokLaunchButtonProps {
  url: string;
  label: string;
  description: string;
}

export function TikTokLaunchButton({
  url,
  label,
  description,
}: TikTokLaunchButtonProps) {
  function handleLaunch() {
    window.open(url, "_blank", "width=500,height=700,scrollbars=yes");
  }

  return (
    <button
      onClick={handleLaunch}
      className="flex flex-col items-start gap-1 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {label}
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
