export default function PipelineLoading() {
  return (
    <div className="p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        <div>
          <div className="h-7 w-28 rounded-lg bg-muted animate-pulse" />
          <div className="h-3 w-52 rounded bg-muted animate-pulse mt-1.5" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 w-72 rounded-lg bg-muted animate-pulse mb-4" />

      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-[280px] min-w-[280px] rounded-2xl border border-border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="ml-auto h-4 w-6 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-xl border border-border bg-background p-3 animate-pulse"
                >
                  <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
