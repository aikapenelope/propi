"use client";

import { useState, useTransition } from "react";
import { Plus, Calendar } from "lucide-react";
import { createTask } from "@/server/actions/tasks";
import { useRouter } from "next/navigation";

export function AddTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!title.trim() || isPending) return;
    const t = title.trim();
    setTitle("");
    setDueAt("");

    startTransition(async () => {
      try {
        await createTask({ title: t, dueAt: dueAt || undefined });
        router.refresh();
      } catch {
        setTitle(t);
      }
    });
  }

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
        placeholder="Nueva tarea... (Enter para guardar)"
        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/20"
        disabled={isPending}
      />
      <div className="relative">
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-3 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-primary/20 w-[170px]"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
      <button
        onClick={handleAdd}
        disabled={!title.trim() || isPending}
        className="rounded-xl bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
