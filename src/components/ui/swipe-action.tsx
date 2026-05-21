"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

/**
 * Swipe-to-reveal actions for list items (mobile PWA pattern).
 * Swipe left to reveal action buttons (call, edit, delete, etc.).
 * Tap anywhere outside the revealed row to close it.
 *
 * Outside-tap detection
 * ─────────────────────
 * When a row is in the revealed state, a document-level `pointerdown`
 * listener is registered to close it when the user taps elsewhere.
 *
 * We use `pointerdown` (Pointer Events API) rather than separate
 * `touchstart` + `mousedown` handlers because Pointer Events unify mouse
 * and touch input into a single event stream, which simplifies the code
 * and avoids ordering edge-cases between the two event types.
 *
 * iOS Safari click-suppression deferral
 * ──────────────────────────────────────
 * Without the `setTimeout`, this component triggers a well-known iOS Safari
 * bug: when a `touchstart` (or `pointerdown`) listener synchronously
 * mutates the React component tree (via setState), iOS Safari can suppress
 * the `click` event on the element that was originally tapped.
 *
 * Concretely: the user swipes a contact row open, then taps the FAB button
 * in the bottom nav.  The document pointerdown fires, React re-renders the
 * row to its closed state, and iOS drops the subsequent click on the FAB —
 * the button appears to do nothing ("trabado").
 *
 * The fix is to push the setState call to the next macrotask via
 * `window.setTimeout(fn, 0)`.  The browser's event pipeline for a tap is:
 *
 *   pointerdown  →  pointermove? →  pointerup  →  click
 *
 * A macrotask scheduled during `pointerdown` is queued AFTER the browser
 * finishes processing the current event chain, so the `click` on the FAB
 * fires before the DOM mutation.  iOS never suppresses it.
 */

const SWIPE_THRESHOLD = 60; // px to trigger reveal
const MAX_SWIPE = 160; // max reveal width
const RESISTANCE = 1.5;

export interface SwipeActionItem {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface SwipeActionProps {
  children: React.ReactNode;
  actions: SwipeActionItem[];
  className?: string;
}

export function SwipeAction({ children, actions, className }: SwipeActionProps) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swipingRef = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const actionsWidth = actions.length * 72; // 72px per action button
  const clampedWidth = Math.min(actionsWidth, MAX_SWIPE);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swipingRef.current = true;
    setIsSwiping(true);
    isHorizontal.current = null;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipingRef.current) return;

      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      // Determine direction on first significant move
      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }

      // If vertical scroll, bail out
      if (!isHorizontal.current) {
        swipingRef.current = false;
        setIsSwiping(false);
        return;
      }

      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();

      if (revealed) {
        // Already revealed: allow swiping back (right) to close
        const newOffset = Math.min(0, Math.max(-clampedWidth, dx / RESISTANCE - clampedWidth));
        setOffset(newOffset);
      } else {
        // Not revealed: only allow left swipe
        if (dx < 0) {
          const newOffset = Math.max(-clampedWidth, dx / RESISTANCE);
          setOffset(newOffset);
        }
      }
    },
    [revealed, clampedWidth],
  );

  const handleTouchEnd = useCallback(() => {
    swipingRef.current = false;
    setIsSwiping(false);
    isHorizontal.current = null;

    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      setOffset(-clampedWidth);
      setRevealed(true);
      hapticLight();
    } else {
      setOffset(0);
      setRevealed(false);
    }
  }, [offset, clampedWidth]);

  /**
   * Close the revealed row when the user taps anywhere outside of it.
   *
   * See the module-level JSDoc for why we use `pointerdown` and why the
   * setState call is deferred with `window.setTimeout(fn, 0)`.
   */
  useEffect(() => {
    if (!revealed) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        // Defer the DOM mutation to the next macrotask so that the browser
        // completes its current event chain (pointerdown → pointerup → click)
        // before React re-renders.  This prevents iOS Safari from suppressing
        // the click event on the element that was originally tapped.
        window.setTimeout(() => {
          setOffset(0);
          setRevealed(false);
        }, 0);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [revealed]);

  function handleActionClick(action: SwipeActionItem) {
    setOffset(0);
    setRevealed(false);
    action.onClick();
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Action buttons (behind the content) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ width: clampedWidth }}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleActionClick(action)}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-white text-xs font-medium transition-opacity"
            style={{
              backgroundColor: action.color,
              opacity: Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD),
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? "none" : "transform 0.25s ease-out",
          // Declare that horizontal panning is handled by JavaScript so the
          // browser skips its ~100ms disambiguation timer before deciding
          // between vertical scroll and horizontal swipe.  Without this,
          // Android Chrome and Samsung Internet introduce a noticeable lag
          // at the start of every swipe gesture.
          // `pan-y` preserves native vertical scroll while letting us own
          // the horizontal axis.
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
