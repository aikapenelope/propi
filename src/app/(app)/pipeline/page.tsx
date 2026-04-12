import { getPipelineContacts } from "@/server/actions/pipeline";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { Kanban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const grouped = await getPipelineContacts();

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Kanban className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs text-muted-foreground">
            Arrastra contactos entre etapas para actualizar su estado
          </p>
        </div>
      </div>

      <KanbanBoard initialData={grouped} />
    </div>
  );
}
