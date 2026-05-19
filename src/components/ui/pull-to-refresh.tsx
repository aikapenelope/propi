"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Pull-to-refresh for mobile PWA pages.
 *
 * Performance optimization: uses refs + direct DOM manipulation during the
 * touch gesture instead of React state. This avoids re-rendering the entire
 * page content on every pixel of finger movement.
 *
 * Only React state is used for the "refreshing" spinner (which is a single
 * boolean toggle, not a continuous value).
 */

const THRESHOLD = 80;
const MAX_PULL = 120;
const RESISTANCE = 2.5;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<SVGSVGElement>(null);

  // Gesture state in refs (no re-renders during drag)
  const pulling = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);

  const router = useRouter();

  const updateDOM = useCallback((distance: number) => {
    if (contentRef.current) {
      contentRef.current.style.transform =
        distance > 0 ? `translateY(${distance}px)` : "";
    }
    if (indicatorRef.current) {
      indicatorRef.current.style.height = `${distance}px`;
      indicatorRef.current.style.opacity = distance > 10 ? "1" : "0";
    }
    if (spinnerRef.current) {
      const progress = Math.min(distance / THRESHOLD, 1);
      spinnerRef.current.style.transform = `rotate(${progress * 360}deg)`;
    }
  }, []);

  const resetDOM = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.transition = "transform 0.3s ease-out";
      contentRef.current.style.transform = "";
      // Remove transition after animation completes
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = "";
        }
      }, 300);
    }
    if (indicatorRef.current) {
      indicatorRef.current.style.opacity = "0";
      indicatorRef.current.style.height = "0px";
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      // Remove any lingering transition for immediate response
      if (contentRef.current) {
        contentRef.current.style.transition = "";
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const diff = (e.touches[0].clientY - startY.current) / RESISTANCE;

      if (diff > 0) {
        e.preventDefault();
        currentPull.current = Math.min(diff, MAX_PULL);
        updateDOM(currentPull.current);
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) return;

      if (currentPull.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }

        // Snap to spinner position
        updateDOM(THRESHOLD / 2);
        router.refresh();

        setTimeout(() => {
          setRefreshing(false);
          currentPull.current = 0;
          pulling.current = false;
          resetDOM();
        }, 1000);
      } else {
        currentPull.current = 0;
        pulling.current = false;
        resetDOM();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [refreshing, router, updateDOM, resetDOM]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator — positioned via ref, no re-renders */}
      <div
        ref={indicatorRef}
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-20 opacity-0"
        style={{ top: -8, height: 0 }}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm border border-border",
            refreshing && "animate-spin",
          )}
        >
          <svg
            ref={spinnerRef}
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>

      {/* Content — transform applied via ref, not state */}
      <div ref={contentRef} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
