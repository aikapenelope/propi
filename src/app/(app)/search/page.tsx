import Link from "next/link";
import { Users, Building2, Calendar } from "lucide-react";
import { globalSearch } from "@/server/actions/search";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const results = q ? await globalSearch(q) : { contacts: [], properties: [], appointments: [] };
  const totalResults =
    results.contacts.length +
    results.properties.length +
    results.appointments.length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Busqueda</h1>
      {q && (
        <p className="mb-6 text-sm text-muted-foreground">
          {totalResults} resultado{totalResults !== 1 ? "s" : ""} para
          &quot;{q}&quot;
        </p>
      )}

      {!q && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Escribe en la barra de busqueda para encontrar contactos, propiedades
          o citas.
        </p>
      )}

      {q && totalResults === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No se encontraron resultados para &quot;{q}&quot;.
        </p>
      )}

      {/* Contacts */}
      {results.contacts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4" />
            Contactos ({results.contacts.length})
          </h2>
          <div className="space-y-1">
            {results.contacts.map((c) => (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center justify-between rounded-lg p-3 text-sm hover:bg-muted transition-colors"
              >
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  {c.email && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.email}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Properties */}
      {results.properties.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4" />
            Propiedades ({results.properties.length})
          </h2>
          <div className="space-y-1">
            {results.properties.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="flex items-center justify-between rounded-lg p-3 text-sm hover:bg-muted transition-colors"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {p.title}
                  </span>
                  {p.city && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.city}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(p.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Appointments */}
      {results.appointments.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4" />
            Citas ({results.appointments.length})
          </h2>
          <div className="space-y-1">
            {results.appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg p-3 text-sm hover:bg-muted transition-colors"
              >
                <span className="font-medium text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(a.startsAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
