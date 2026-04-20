"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Contextual help tooltip — small "i" icon that shows a popover on hover/tap.
 *
 * Pattern: HubSpot/Intercom style.
 * - Desktop: hover to show, mouse leave to hide
 * - Mobile: tap to toggle, tap outside to close
 * - Max 240px wide, positioned auto (right or left)
 * - Discrete: 40% opacity, doesn't compete with primary actions
 */
export function InfoTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on tap outside (mobile)
  const handleClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    },
    [open],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClickOutside]);

  return (
    <span ref={containerRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors focus:outline-none"
        aria-label="Informacion"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-60 rounded-lg border border-border p-3 text-xs leading-relaxed text-muted-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ background: "var(--card-bg, var(--background))" }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
