import { SkeletonCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse" style={{ background: "#E4E7E1" }}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SkeletonCard className="col-span-1 xl:col-span-2 min-h-[340px]" />
          <SkeletonCard className="min-h-[340px]" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SkeletonCard className="col-span-1 xl:col-span-2 min-h-[300px]" />
          <div className="space-y-6">
            <SkeletonCard className="min-h-[200px]" />
            <SkeletonCard className="min-h-[200px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
