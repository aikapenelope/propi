/**
 * App-level loading skeleton — shown during navigation between any (app) routes
 * when no more specific loading.tsx exists in the target route.
 *
 * This prevents a blank content area while the next page's data loads.
 * Individual routes (dashboard, contacts, properties) have their own
 * loading.tsx with more specific skeletons; this is the fallback.
 */
export default function AppLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="mb-6">
        <div className="h-7 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-24 rounded bg-muted/60 mt-2" />
      </div>

      {/* Content skeleton — generic card list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-[var(--card-bg)] border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted/60" />
            </div>
            <div className="h-6 w-16 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
