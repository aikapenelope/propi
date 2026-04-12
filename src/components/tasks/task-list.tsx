"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Trash2, Clock, User, Building2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toggleTask, deleteTask } from "@/server/actions/tasks";

interface Task {
  id: string;
  title: string;
  dueAt: Date | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  contact: { id: string; name: string } | null;
  property: { id: string; title: string | null } | null;
}

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const pending = initialTasks.filter((t) => !t.completed);
  const completed = initialTasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pendientes ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Completadas ({completed.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completed.slice(0, 10).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {completed.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                + {completed.length - 10} mas
              </p>
            )}
          </div>
        </div>
      )}

      {initialTasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Sin tareas</p>
          <p className="text-xs mt-1">Agrega una tarea arriba para empezar.</p>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOverdue =
    !task.completed && task.dueAt && new Date(task.dueAt) < new Date();

  function handleToggle() {
    startTransition(async () => {
      await toggleTask(task.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
      router.refresh();
    });
  }

  function formatDue(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0 && diffHours >= 0) return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `Manana ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === -1) return "Ayer";
    if (diffDays < -1) return `Hace ${Math.abs(diffDays)} dias`;
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border p-3 transition-colors ${
        isOverdue
          ? "border-red-500/20 bg-red-500/5"
          : "border-border hover:bg-muted/50"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="mt-0.5 shrink-0 disabled:opacity-50"
      >
        {task.completed ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            task.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {task.dueAt && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="h-2.5 w-2.5" />
              ) : (
                <Clock className="h-2.5 w-2.5" />
              )}
              {formatDue(task.dueAt)}
            </span>
          )}
          {task.contact && (
            <Link
              href={`/contacts/${task.contact.id}`}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <User className="h-2.5 w-2.5" />
              {task.contact.name}
            </Link>
          )}
          {task.property && (
            <Link
              href={`/properties/${task.property.id}`}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Building2 className="h-2.5 w-2.5" />
              {task.property.title?.slice(0, 25)}
            </Link>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all shrink-0 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
