/**
 * Reusable skeleton primitives for loading states.
 */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      style={{ minHeight: "1rem" }}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-100 border border-gray-200/50 ${className}`}
      style={{ minHeight: "120px" }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-2.5 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="h-3 w-16 rounded bg-gray-100" />
    </div>
  );
}

export function SkeletonPage({
  title,
  rows = 5,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      {title && (
        <div className="mb-6">
          <div className="h-7 w-48 rounded-lg bg-gray-200 mb-2" />
          <div className="h-3 w-24 rounded bg-gray-100" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
