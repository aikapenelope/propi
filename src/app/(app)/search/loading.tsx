export default function SearchLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-7 w-28 rounded-lg bg-muted animate-pulse mb-6" />
      <div className="space-y-3 max-w-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
