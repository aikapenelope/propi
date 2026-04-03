export default function DashboardLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Title skeleton */}
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse mt-2" />
      </div>

      {/* 4 KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] border border-border rounded-2xl p-4 md:p-5 min-h-[220px] min-w-0 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded bg-muted mt-2" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] border border-border rounded-2xl p-7 animate-pulse"
          >
            <div className="h-5 w-32 rounded bg-muted mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
