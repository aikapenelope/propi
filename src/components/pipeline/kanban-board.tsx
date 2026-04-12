"use client";

import { useState, useCallback } from "react";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const findColumn = useCallback(
    (id: string): LeadStatus | null => {
      // Check if id is a column id
      if (LEAD_STATUSES.includes(id as LeadStatus)) return id as LeadStatus;
      // Find which column contains this card
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

    // Persist to DB
    try {
      await updateLeadStatus(active.id as string, newCol);
    } catch {
      // Revert on error (reload)
      window.location.reload();
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-10rem)]">
        {LEAD_STATUSES.map((status) => (
          <SortableContext
            key={status}
            items={columns[status].map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              id={status}
              title={LEAD_STATUS_CONFIG[status].label}
              color={LEAD_STATUS_CONFIG[status].color}
              count={columns[status].length}
            >
              {columns[status].map((contact) => (
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
  );
}
