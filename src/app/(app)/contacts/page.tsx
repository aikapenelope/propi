import { Mail, Phone, Building } from "lucide-react";
import { getContacts, getContactsCount } from "@/server/actions/contacts";
import { formatDate } from "@/lib/utils";
import { ContactsHeader } from "@/components/contacts/contacts-header";
import { ContactSwipeRow } from "@/components/contacts/contact-swipe-row";
import { ContactsListClient } from "@/components/contacts/contacts-list-client";

export const dynamic = "force-dynamic";

interface ContactsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ContactsPage({
  searchParams,
}: ContactsPageProps) {
  const { q } = await searchParams;

  // Fetch first page and total count in parallel
  const [{ items, nextCursor, hasMore }, totalCount] = await Promise.all([
    getContacts(q),
    // Only run the count query when there's no search active (count is shown
    // in the header and is always the total, not the filtered total).
    q ? Promise.resolve(0) : getContactsCount(),
  ]);

  return (
    <div className="p-4 md:p-6">
      {/* Header with import button — shows real DB count, not page count */}
      <ContactsHeader count={totalCount} />

      {/* Search */}
      <form method="get" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, email, telefono..."
          autoComplete="off"
          // input-base: 16px on mobile to prevent iOS Safari auto-zoom
          className="h-10 w-full max-w-md rounded-lg border border-border bg-muted px-4 input-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay contactos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q
              ? "No se encontraron resultados para tu busqueda."
              : "Crea tu primer contacto para empezar."}
          </p>
        </div>
      ) : (
        <ContactsListClient
          initialItems={items}
          initialNextCursor={nextCursor}
          initialHasMore={hasMore}
          search={q}
        />
      )}
    </div>
  );
}
