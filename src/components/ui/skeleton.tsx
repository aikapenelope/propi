/**
 * Reusable skeleton primitives for loading states.
 * Uses theme variables (bg-muted) so they work in both dark and light mode.
 */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className}`}
      style={{ minHeight: "1rem" }}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted border border-border ${className}`}
      style={{ minHeight: "120px" }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 rounded bg-muted" />
        <div className="h-2.5 w-2/3 rounded bg-muted/60" />
      </div>
      <div className="h-3 w-16 rounded bg-muted/60 hidden sm:block" />
    </div>
  );
}

/** Contact list skeleton — avatar + name + email/phone line + tag pills */
export function SkeletonContactRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-primary/10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-2.5 w-36 rounded bg-muted/60" />
          <div className="h-2.5 w-24 rounded bg-muted/60 hidden sm:block" />
        </div>
      </div>
      <div className="hidden sm:flex gap-1">
        <div className="h-5 w-14 rounded-full bg-muted/40" />
        <div className="h-5 w-10 rounded-full bg-muted/40" />
      </div>
    </div>
  );
}

/** Property card skeleton — image area + title + price + specs */
export function SkeletonPropertyCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-border animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-24 rounded bg-primary/10" />
        <div className="h-3 w-1/2 rounded bg-muted/60" />
        <div className="flex gap-3 mt-1">
          <div className="h-3 w-8 rounded bg-muted/40" />
          <div className="h-3 w-8 rounded bg-muted/40" />
          <div className="h-3 w-12 rounded bg-muted/40" />
        </div>
      </div>
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
          <div className="h-7 w-48 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-24 rounded bg-muted/60" />
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
