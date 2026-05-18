export default function TasksLoading() {
  return (
    <div className="p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse mt-1.5" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Task list skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border p-3 animate-pulse"
          >
            <div className="h-5 w-5 rounded bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
