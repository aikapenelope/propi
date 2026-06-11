"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Phone, Building, ChevronDown, Loader2 } from "lucide-react";
import { getContacts } from "@/server/actions/contacts";
import { formatDate } from "@/lib/utils";
import { ContactSwipeRow } from "@/components/contacts/contact-swipe-row";

type ContactItem = Awaited<ReturnType<typeof getContacts>>["items"][number];

interface ContactsListClientProps {
  initialItems: ContactItem[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  search?: string;
}

/**
 * Client component that renders the paginated contacts list with a
 * "Load more" button. Receives the first page from the server component
 * and fetches subsequent pages on demand.
 */
export function ContactsListClient({
  initialItems,
  initialNextCursor,
  initialHasMore,
  search,
}: ContactsListClientProps) {
  const [items, setItems] = useState<ContactItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor || isPending) return;
    startTransition(async () => {
      const result = await getContacts(search, nextCursor);
      setItems((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    });
  }

  return (
    <div className="space-y-2">
      {items.map((contact) => (
        <ContactSwipeRow
          key={contact.id}
          contactId={contact.id}
          phone={contact.phone}
        >
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            style={{ viewTransitionName: `contact-${contact.id}` }}
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {contact.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </span>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </span>
                )}
                {contact.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {contact.company}
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="hidden gap-1 sm:flex">
              {contact.contactTags.slice(0, 3).map((ct) => (
                <span
                  key={ct.tag.id}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${ct.tag.color}20`,
                    color: ct.tag.color ?? "#6366f1",
                  }}
                >
                  {ct.tag.name}
                </span>
              ))}
            </div>

            {/* Date */}
            <span className="hidden text-xs text-muted-foreground md:block">
              {formatDate(contact.updatedAt)}
            </span>
          </Link>
        </ContactSwipeRow>
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4 pb-6">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Cargar más contactos
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
