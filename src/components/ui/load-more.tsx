"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable "Load More" button with intersection observer for infinite scroll.
 *
 * Renders a button at the bottom of a list. When the button enters the viewport
 * (or the user clicks it), it calls `loadMore()` to fetch the next page.
 *
 * Uses React's useTransition to keep the UI responsive during loading.
 *
 * Usage:
 *   <LoadMore
 *     hasMore={hasMore}
 *     loadMore={async () => {
 *       const next = await getProperties({ cursor });
 *       setItems(prev => [...prev, ...next.items]);
 *       setCursor(next.nextCursor);
 *       return next.hasMore;
 *     }}
 *   />
 */
export function LoadMore({
  hasMore,
  loadMore,
}: {
  hasMore: boolean;
  loadMore: () => Promise<boolean>;
}) {
  const [isPending, startTransition] = useTransition();
  const [canLoadMore, setCanLoadMore] = useState(hasMore);
  const observerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    startTransition(async () => {
      const moreAvailable = await loadMore();
      setCanLoadMore(moreAvailable);
    });
  }, [loadMore]);

  // Intersection Observer: auto-load when button enters viewport
  useEffect(() => {
    if (!canLoadMore || isPending) return;

    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }, // Trigger 200px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoadMore, isPending, handleLoadMore]);

  if (!canLoadMore) return null;

  return (
    <div ref={observerRef} className="flex justify-center py-6">
      <button
        onClick={handleLoadMore}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </>
        ) : (
          "Cargar mas"
        )}
      </button>
    </div>
  );
}
