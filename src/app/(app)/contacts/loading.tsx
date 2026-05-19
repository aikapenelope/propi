import { SkeletonContactRow } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      {/* Header — matches ContactsHeader layout */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-32 rounded-lg bg-muted mb-1.5" />
          <div className="h-3.5 w-20 rounded bg-muted/60" />
        </div>
        <div className="flex items-center gap-2">
          {/* Import button: icon-only on mobile, icon+text on sm+ */}
          <div className="h-9 w-9 sm:w-28 rounded-lg border border-border bg-muted/30" />
          {/* New Contact button */}
          <div className="h-9 w-9 sm:w-36 rounded-lg bg-primary/20" />
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted/60" />
      </div>

      {/* Contact rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonContactRow key={i} />
        ))}
      </div>
    </div>
  );
}
