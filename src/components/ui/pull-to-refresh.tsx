"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Pull-to-refresh for mobile PWA pages.
 * Wraps page content and adds a pull gesture that triggers router.refresh().
 * Only activates on touch devices when scrolled to the top.
 */

const THRESHOLD = 80; // px to pull before triggering refresh
const MAX_PULL = 120; // max visual pull distance
const RESISTANCE = 2.5; // pull resistance factor

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate when scrolled to top
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = (currentY - startY.current) / RESISTANCE;

      if (diff > 0) {
        // Prevent native scroll while pulling
        e.preventDefault();
        setPullDistance(Math.min(diff, MAX_PULL));
      }
    },
    [pulling, refreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (!pulling) return;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD / 2); // Snap to spinner position

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      router.refresh();

      // Reset after a short delay (data refetch is async)
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }, 1000);
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pulling, pullDistance, refreshing, router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false on touchmove to allow preventDefault
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none z-20",
          pullDistance > 10 ? "opacity-100" : "opacity-0",
        )}
        style={{ top: -8, height: pullDistance }}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm border border-border",
            refreshing && "animate-spin",
          )}
        >
          <svg
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${progress * 360}deg)`,
              transition: refreshing ? undefined : "transform 0.1s",
            }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform:
            pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling && pullDistance > 0 ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
