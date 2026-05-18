"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Circle,
  Trash2,
  Clock,
  User,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  CalendarCheck,
  CalendarDays,
  Inbox,
  StickyNote,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toggleTask, deleteTask, updateTaskNotes } from "@/server/actions/tasks";
import { hapticSuccess } from "@/lib/haptics";

interface Task {
  id: string;
  title: string;
  dueAt: Date | null;
  notes: string | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  contact: { id: string; name: string } | null;
  property: { id: string; title: string | null } | null;
}

interface TaskGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tasks: Task[];
}

// ---------------------------------------------------------------------------
// Grouping logic
// ---------------------------------------------------------------------------

function groupTasks(tasks: Task[]): { pending: TaskGroup[]; completed: Task[] } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDate: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      completed.push(task);
      continue;
    }
    if (!task.dueAt) {
      noDate.push(task);
      continue;
    }
    const due = new Date(task.dueAt);
    if (due < todayStart) overdue.push(task);
    else if (due < tomorrowStart) today.push(task);
    else if (due < tomorrowEnd) tomorrow.push(task);
    else if (due < weekEnd) thisWeek.push(task);
    else later.push(task);
  }

  const groups: TaskGroup[] = [];
  if (overdue.length > 0)
    groups.push({ key: "overdue", label: "Atrasadas", icon: AlertTriangle, color: "#ef4444", tasks: overdue });
  if (today.length > 0)
    groups.push({ key: "today", label: "Hoy", icon: CalendarClock, color: "#00FF55", tasks: today });
  if (tomorrow.length > 0)
    groups.push({ key: "tomorrow", label: "Manana", icon: CalendarCheck, color: "#3b82f6", tasks: tomorrow });
  if (thisWeek.length > 0)
    groups.push({ key: "week", label: "Esta semana", icon: CalendarDays, color: "#8b5cf6", tasks: thisWeek });
  if (later.length > 0)
    groups.push({ key: "later", label: "Proximas", icon: CalendarDays, color: "#6b7280", tasks: later });
  if (noDate.length > 0)
    groups.push({ key: "nodate", label: "Sin fecha", icon: Inbox, color: "#6b7280", tasks: noDate });

  return { pending: groups, completed };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const { pending, completed } = useMemo(
    () => groupTasks(initialTasks),
    [initialTasks],
  );
  const [showCompleted, setShowCompleted] = useState(false);

  const totalPending = pending.reduce((sum, g) => sum + g.tasks.length, 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{totalPending} pendiente{totalPending !== 1 ? "s" : ""}</span>
        {completed.length > 0 && (
          <span>{completed.length} completada{completed.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Grouped sections */}
      {pending.map((group) => (
        <TaskGroupSection key={group.key} group={group} />
      ))}

      {/* Empty state */}
      {totalPending === 0 && completed.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Sin tareas</p>
          <p className="text-xs mt-1">Agrega una tarea arriba para empezar.</p>
        </div>
      )}

      {totalPending === 0 && completed.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-60" />
          <p className="text-sm font-medium">Todo al dia</p>
        </div>
      )}

      {/* Completed section (collapsible) */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
          >
            {showCompleted ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Completadas ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2 opacity-50">
              {completed.slice(0, 20).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
              {completed.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  + {completed.length - 20} mas
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group section
// ---------------------------------------------------------------------------

function TaskGroupSection({ group }: { group: TaskGroup }) {
  const Icon = group.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${group.color}15`, color: group.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: group.color }}
        >
          {group.label}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
          {group.tasks.length}
        </span>
      </div>

      <div className="space-y-2 ml-1 border-l-2 pl-4" style={{ borderColor: `${group.color}30` }}>
        {group.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task item (expandable with notes)
// ---------------------------------------------------------------------------

function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isOverdue =
    !task.completed && task.dueAt && new Date(task.dueAt) < new Date();

  const hasNotes = !!task.notes;

  function handleToggle() {
    startTransition(async () => {
      hapticSuccess();
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

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await updateTaskNotes(task.id, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`group rounded-xl border transition-all ${
        isOverdue
          ? "border-red-500/20 bg-red-500/5"
          : expanded
            ? "border-border bg-muted/30"
            : "border-border hover:bg-muted/50"
      }`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="mt-0.5 shrink-0 disabled:opacity-50"
        >
          {task.completed ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          )}
        </button>

        {/* Content — click to expand */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 text-left"
        >
          <p
            className={`text-sm ${
              task.completed
                ? "line-through text-muted-foreground"
                : "text-foreground font-medium"
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
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <User className="h-2.5 w-2.5" />
                {task.contact.name}
              </Link>
            )}
            {task.property && (
              <Link
                href={`/properties/${task.property.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Building2 className="h-2.5 w-2.5" />
                {task.property.title?.slice(0, 25)}
              </Link>
            )}
            {hasNotes && !expanded && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <StickyNote className="h-2.5 w-2.5" />
                Nota
              </span>
            )}
          </div>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all shrink-0 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded: notes editor */}
      {expanded && !task.completed && (
        <div className="px-3 pb-3 pt-0 ml-8">
          <div className="border-t border-border pt-3">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <StickyNote className="h-3 w-3" />
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleSaveNotes}
                disabled={saving || notes === (task.notes || "")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : saved ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {saved ? "Guardado" : "Guardar"}
              </button>
              {notes !== (task.notes || "") && (
                <span className="text-[10px] text-muted-foreground">
                  Sin guardar
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded: show existing notes (read-only for completed) */}
      {expanded && task.completed && task.notes && (
        <div className="px-3 pb-3 pt-0 ml-8">
          <div className="border-t border-border pt-3">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <StickyNote className="h-3 w-3" />
              Notas
            </label>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {task.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDue(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0 && diffHours >= 0)
    return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)
    return `Manana ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === -1) return "Ayer";
  if (diffDays < -1) return `Hace ${Math.abs(diffDays)} dias`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}
