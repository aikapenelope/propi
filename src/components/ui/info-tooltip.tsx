"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Contextual help tooltip — small "i" icon that shows a popover on hover/tap.
 *
 * Uses a portal (createPortal to document.body) to render outside the parent
 * DOM tree. This prevents the tooltip from being clipped by overflow:hidden
 * containers like dashboard cards.
 *
 * Positioning:
 * 1. Measures the icon's position with getBoundingClientRect()
 * 2. Checks available space in all directions
 * 3. Places the tooltip where it fits (prefers right -> left -> bottom -> top)
 * 4. Uses position:fixed to escape any overflow:hidden ancestor
 * 5. Clamps to viewport edges with 8px padding
 *
 * Behavior:
 * - Desktop: hover to show, mouse leave to hide
 * - Mobile: tap to toggle, tap outside to close
 * - Closes on scroll (position becomes stale)
 * - Max 240px wide
 */

const TOOLTIP_WIDTH = 240;
const TOOLTIP_GAP = 8;
const VIEWPORT_PADDING = 8;

type Placement = "right" | "left" | "top" | "bottom";

function calculatePlacement(
  rect: DOMRect,
): { placement: Placement; top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceRight = vw - rect.right;
  const spaceLeft = rect.left;
  const spaceBottom = vh - rect.bottom;

  if (spaceRight >= TOOLTIP_WIDTH + TOOLTIP_GAP + VIEWPORT_PADDING) {
    return {
      placement: "right",
      top: rect.top + rect.height / 2,
      left: rect.right + TOOLTIP_GAP,
    };
  }

  if (spaceLeft >= TOOLTIP_WIDTH + TOOLTIP_GAP + VIEWPORT_PADDING) {
    return {
      placement: "left",
      top: rect.top + rect.height / 2,
      left: rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
    };
  }

  if (spaceBottom >= 80) {
    return {
      placement: "bottom",
      top: rect.bottom + TOOLTIP_GAP,
      left: Math.max(
        VIEWPORT_PADDING,
        Math.min(rect.left - TOOLTIP_WIDTH / 2 + rect.width / 2, vw - TOOLTIP_WIDTH - VIEWPORT_PADDING),
      ),
    };
  }

  return {
    placement: "top",
    top: rect.top - TOOLTIP_GAP,
    left: Math.max(
      VIEWPORT_PADDING,
      Math.min(rect.left - TOOLTIP_WIDTH / 2 + rect.width / 2, vw - TOOLTIP_WIDTH - VIEWPORT_PADDING),
    ),
  };
}

export function InfoTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    placement: Placement;
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Portal target — only available on client
  const portalTarget = typeof window !== "undefined" ? document.body : null;

  // Calculate position when opening
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition(calculatePlacement(rect));
    }
  }, [open]);

  // Close on tap outside (mobile)
  const handleClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    },
    [open],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClickOutside]);

  // Close on scroll (position becomes stale)
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [open]);

  const tooltipStyle: React.CSSProperties | undefined = position
    ? {
        position: "fixed" as const,
        zIndex: 9999,
        width: TOOLTIP_WIDTH,
        top: position.top,
        left: position.left,
        transform:
          position.placement === "right" || position.placement === "left"
            ? "translateY(-50%)"
            : position.placement === "top"
              ? "translateY(-100%)"
              : undefined,
        background: "var(--card-bg, var(--background))",
      }
    : undefined;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={buttonRef}
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

      {open &&
        portalTarget &&
        position &&
        createPortal(
          <div
            ref={tooltipRef}
            style={tooltipStyle}
            className="rounded-xl border border-border p-3 text-xs leading-relaxed text-muted-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {text}
          </div>,
          portalTarget,
        )}
    </span>
  );
}
