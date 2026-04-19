import { SkeletonPropertyCard } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-28 rounded bg-muted/60" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-primary/10" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="h-9 w-48 rounded-lg bg-muted" />
        <div className="h-9 w-24 rounded-lg bg-muted" />
        <div className="h-9 w-28 rounded-lg bg-muted" />
        <div className="h-9 w-24 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonPropertyCard key={i} />
        ))}
      </div>
    </div>
  );
}
