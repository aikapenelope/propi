import { getTasks } from "@/server/actions/tasks";
import { Check, Circle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export async function TasksWidget() {
  const tasks = await getTasks("pending");
  const upcoming = tasks.slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-muted-foreground/50 text-center py-4">
        Sin tareas pendientes
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((task) => {
        const isOverdue =
          task.dueAt && new Date(task.dueAt) < new Date();

        return (
          <Link
            key={task.id}
            href="/tasks"
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 transition-colors"
          >
            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate flex-1">
              {task.title}
            </span>
            {task.dueAt && (
              <span
                className={`text-[10px] flex items-center gap-1 shrink-0 ${
                  isOverdue ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="h-2.5 w-2.5" />
                ) : (
                  <Clock className="h-2.5 w-2.5" />
                )}
                {new Date(task.dueAt).toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </Link>
        );
      })}
      {tasks.length > 5 && (
        <p className="text-[10px] text-muted-foreground text-center">
          + {tasks.length - 5} mas
        </p>
      )}
    </div>
  );
}
