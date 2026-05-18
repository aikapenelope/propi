import { MapPin, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getMagicSearches } from "@/server/actions/magic-searches";
import { DeleteSearchButton } from "@/components/market/delete-search-button";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const searches = await getMagicSearches();

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-8 py-4 md:py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/market-analysis"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Busquedas Guardadas
          </h1>
          <p className="text-xs text-muted-foreground">
            Historial de consultas de Propi Magic
          </p>
        </div>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay busquedas guardadas.</p>
          <p className="text-xs mt-2">Usa Propi Magic para buscar propiedades.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <Link
                href={`/market-analysis/zone?searchId=${s.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {s.label}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  &quot;{s.query}&quot;
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                  <span>{s.totalResults} resultados</span>
                  <span>{new Date(s.createdAt).toLocaleDateString("es")}</span>
                </div>
              </Link>
              <DeleteSearchButton searchId={s.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
