import { SkeletonContactRow } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-36 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-24 rounded bg-muted/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted" />
          <div className="h-9 w-32 rounded-lg bg-primary/10" />
        </div>
      </div>
      <div className="mb-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonContactRow key={i} />
        ))}
      </div>
    </div>
  );
}
