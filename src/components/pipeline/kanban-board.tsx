"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateLeadStatus } from "@/server/actions/pipeline";
import {
  LEAD_STATUS_CONFIG,
  LEAD_STATUSES,
} from "@/lib/pipeline-config";
import type { LeadStatus } from "@/lib/pipeline-config";
import { Search, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  leadStatus: string;
  contactTags: { tag: { id: string; name: string; color: string | null } }[];
}

interface KanbanBoardProps {
  initialData: Record<LeadStatus, Contact[]>;
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialData);
  const [activeCard, setActiveCard] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Filter contacts by search term across all columns
  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const q = search.toLowerCase();
    const result = {} as Record<LeadStatus, Contact[]>;
    for (const status of LEAD_STATUSES) {
      result[status] = columns[status].filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.company?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [columns, search]);

  const findColumn = useCallback(
    (id: string): LeadStatus | null => {
      if (LEAD_STATUSES.includes(id as LeadStatus)) return id as LeadStatus;
      for (const status of LEAD_STATUSES) {
        if (columns[status].some((c) => c.id === id)) return status;
      }
      return null;
    },
    [columns],
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const col = findColumn(active.id as string);
    if (col) {
      const card = columns[col].find((c) => c.id === active.id);
      if (card) setActiveCard(card);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];
      const activeIndex = activeItems.findIndex((c) => c.id === active.id);
      const [moved] = activeItems.splice(activeIndex, 1);
      moved.leadStatus = overCol;
      overItems.push(moved);

      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveCard(null);

    const newCol = findColumn(active.id as string);
    if (!newCol) return;

    try {
      await updateLeadStatus(active.id as string, newCol);
    } catch {
      window.location.reload();
    }
  }

  return (
    <>
      {/* Search/filter bar */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contacto en el pipeline..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {LEAD_STATUSES.map((status) => (
            <SortableContext
              key={status}
              items={filteredColumns[status].map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                id={status}
                title={LEAD_STATUS_CONFIG[status].label}
                color={LEAD_STATUS_CONFIG[status].color}
                count={filteredColumns[status].length}
              >
                {filteredColumns[status].map((contact) => (
                  <KanbanCard key={contact.id} contact={contact} />
                ))}
              </KanbanColumn>
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard contact={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
