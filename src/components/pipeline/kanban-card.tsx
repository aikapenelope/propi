import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Mail, Building2, GripVertical } from "lucide-react";
import Link from "next/link";

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

interface KanbanCardProps {
  contact: Contact;
  isOverlay?: boolean;
}

export function KanbanCard({ contact, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-background p-3 ${
        isOverlay ? "shadow-2xl ring-2 ring-primary/20 rotate-2" : "hover:shadow-md"
      } transition-shadow cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <Link
            href={`/contacts/${contact.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.name}
          </Link>

          {contact.company && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
              <Building2 className="h-2.5 w-2.5" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-2.5 w-2.5" />
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-2.5 w-2.5" />
              </a>
            )}
            {contact.source && (
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {contact.source}
              </span>
            )}
          </div>

          {/* Tags */}
          {contact.contactTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.contactTags.slice(0, 3).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${tag.color || "#6366f1"}15`,
                    color: tag.color || "#6366f1",
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {contact.contactTags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{contact.contactTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
