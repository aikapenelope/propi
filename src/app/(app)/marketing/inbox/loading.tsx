export default function InboxLoading() {
  return (
    <div
      className="animate-pulse"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <div className="flex h-full">
        <div className="w-[320px] border-r border-gray-200 p-4 space-y-3 hidden md:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-2.5 w-40 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
