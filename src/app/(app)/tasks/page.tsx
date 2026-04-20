import { CheckSquare } from "lucide-react";
import { getTasks } from "@/server/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";
import { AddTaskForm } from "@/components/tasks/add-task-form";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const allTasks = await getTasks();

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Tareas
            <InfoTooltip text="Crea recordatorios con fecha limite. Las tareas vencidas generan una notificacion automatica." />
          </h1>
          <p className="text-xs text-muted-foreground">
            Recordatorios y pendientes de tu negocio
          </p>
        </div>
      </div>

      <AddTaskForm />
      <TaskList initialTasks={allTasks} />
    </div>
  );
}
