"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

/**
 * Swipe-to-reveal actions for list items (mobile PWA pattern).
 * Swipe left to reveal action buttons (call, edit, delete, etc.).
 * Tap anywhere else or swipe back to close.
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

  // Close when tapping outside
  useEffect(() => {
    if (!revealed) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffset(0);
        setRevealed(false);
      }
    }

    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
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
        }}
      >
        {children}
      </div>
    </div>
  );
}
