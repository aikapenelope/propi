export default function HelpLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-7 w-32 rounded-lg bg-muted animate-pulse mb-6" />
      <div className="space-y-4 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 animate-pulse">
            <div className="h-4 w-1/2 rounded bg-muted mb-2" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
