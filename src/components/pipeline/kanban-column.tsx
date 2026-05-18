import { useDroppable } from "@dnd-kit/core";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-[280px] min-w-[280px] rounded-2xl border border-border bg-muted/30"
      style={{
        borderTopColor: color,
        borderTopWidth: "3px",
        background: isOver ? "var(--muted)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: color }}
        />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </span>
        <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {children}
        {count === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground/50">
            Arrastra contactos aqui
          </div>
        )}
      </div>
    </div>
  );
}
