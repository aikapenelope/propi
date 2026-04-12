"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, Trash2, Clock } from "lucide-react";
import { addContactNote, deleteContactNote } from "@/server/actions/contact-notes";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export function ContactNotes({
  contactId,
  initialNotes,
}: {
  contactId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!input.trim() || isPending) return;
    const content = input.trim();
    setInput("");

    startTransition(async () => {
      try {
        const note = await addContactNote(contactId, content);
        setNotes((prev) => [note, ...prev]);
      } catch {
        // Restore input on error
        setInput(content);
      }
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      try {
        await deleteContactNote(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch {
        // ignore
      }
    });
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-primary" />
        Notas
        {notes.length > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {notes.length}
          </span>
        )}
      </h3>

      {/* Add note form */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Agregar nota... (Enter para guardar)"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-primary/20 min-h-[38px] max-h-[120px]"
          rows={1}
          disabled={isPending}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || isPending}
          className="rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors self-end"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      {/* Notes timeline */}
      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-4">
          Sin notas. Agrega una para recordar detalles importantes.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative pl-4 border-l-2 border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all shrink-0"
                  title="Eliminar nota"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
