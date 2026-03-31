import { SkeletonCard } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-48 rounded-lg bg-gray-200 mb-2" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}
