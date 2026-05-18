"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTag } from "@/server/actions/contacts";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}

export function TagSelector({
  availableTags,
  selectedIds,
  onToggle,
}: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>(availableTags);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    const tag = await createTag(newName.trim());
    setTags((prev) => [...prev, tag]);
    onToggle(tag.id);
    setNewName("");
    setCreating(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">
        Etiquetas
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedIds.includes(tag.id)
                ? `${tag.color}30`
                : "transparent",
              borderColor: tag.color ?? "#6366f1",
              color: tag.color ?? "#6366f1",
            }}
          >
            {tag.name}
          </button>
        ))}

        {/* Create new tag */}
        {creating ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
              placeholder="Nombre..."
              autoFocus
              className="h-7 w-28 rounded-full border border-primary px-2 text-xs text-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
            >
              Ok
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
            >
              X
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Nueva
          </button>
        )}
      </div>
    </div>
  );
}
