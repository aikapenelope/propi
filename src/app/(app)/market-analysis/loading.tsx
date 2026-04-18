export default function MarketAnalysisLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-7 w-36 rounded-lg bg-muted animate-pulse mb-2" />
      <div className="h-4 w-64 rounded bg-muted animate-pulse mb-6" />
      <div className="max-w-2xl space-y-4">
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
        <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}
