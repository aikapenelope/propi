"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  Mail,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { runFullMatching, type PropertyWithMatches } from "@/server/actions/matching";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  land: "Terreno",
  commercial: "Comercial",
  office: "Oficina",
  warehouse: "Bodega",
  other: "Otro",
};

const operationLabels: Record<string, string> = {
  sale: "Venta",
  rent: "Alquiler",
  sale_rent: "Venta / Alquiler",
  sell: "Venta",
  lease: "Alquiler",
};

const prefOperationLabels: Record<string, string> = {
  sale: "Quiere comprar",
  rent: "Quiere alquilar",
  sale_rent: "Comprar o alquilar",
  sell: "Quiere vender",
  lease: "Quiere arrendar",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatchingResults() {
  const [results, setResults] = useState<PropertyWithMatches[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  function handleRun() {
    startTransition(async () => {
      const data = await runFullMatching();
      setResults(data);
      setExpandedProperty(data[0]?.id ?? null);
    });
  }

  // Stats
  const totalMatches = results?.reduce((sum, p) => sum + p.matches.length, 0) ?? 0;
  const totalProperties = results?.length ?? 0;
  const uniqueContacts = results
    ? new Set(results.flatMap((p) => p.matches.map((m) => m.id))).size
    : 0;

  return (
    <div>
      {/* Run button */}
      {results === null && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Matching de Propiedades y Contactos
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Cruza todas tus propiedades activas con los contactos que tienen
            preferencias configuradas. Encuentra quien busca lo que tu ofreces.
          </p>
          <button
            onClick={handleRun}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isPending ? "Analizando..." : "Buscar Matches"}
          </button>
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalMatches}</p>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                Matches
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalProperties}</p>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                Propiedades
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{uniqueContacts}</p>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                Contactos
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {totalMatches === 0
                ? "No se encontraron coincidencias. Agrega preferencias a tus contactos."
                : `${totalMatches} coincidencia${totalMatches !== 1 ? "s" : ""} encontrada${totalMatches !== 1 ? "s" : ""}`}
            </p>
            <button
              onClick={handleRun}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Actualizar
            </button>
          </div>

          {/* Property cards with matches */}
          {results.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay coincidencias entre tus propiedades activas y los contactos
                con preferencias.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Asegurate de que tus contactos tengan preferencias de busqueda
                configuradas (tipo, operacion, ciudad, presupuesto).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((property) => {
                const isExpanded = expandedProperty === property.id;
                const price = property.price
                  ? formatCurrency(
                      parseFloat(property.price),
                      property.currency || "USD",
                    )
                  : null;

                return (
                  <div
                    key={property.id}
                    className="rounded-xl border border-border bg-background overflow-hidden"
                  >
                    {/* Property header — tap to expand */}
                    <button
                      onClick={() =>
                        setExpandedProperty(isExpanded ? null : property.id)
                      }
                      className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      {/* Property icon */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>

                      {/* Property info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {property.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {typeLabels[property.type] ?? property.type}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {operationLabels[property.operation] ?? property.operation}
                          </span>
                          {price && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs font-medium text-foreground">
                                {price}
                              </span>
                            </>
                          )}
                          {property.city && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {property.city}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Match count badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <Users className="h-3 w-3" />
                          {property.matches.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded: property details + matched contacts */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Property specs */}
                        <div className="px-4 py-3 bg-muted/30 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {property.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" /> {property.bedrooms} hab
                            </span>
                          )}
                          {property.bathrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" /> {property.bathrooms} banos
                            </span>
                          )}
                          {property.area && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" /> {property.area} m²
                            </span>
                          )}
                          {property.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {property.address}
                            </span>
                          )}
                          <Link
                            href={`/properties/${property.id}`}
                            className="text-primary hover:underline ml-auto"
                          >
                            Ver propiedad
                          </Link>
                        </div>

                        {/* Matched contacts */}
                        <div className="divide-y divide-border">
                          {property.matches.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              {/* Avatar */}
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {contact.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>

                              {/* Contact info */}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/contacts/${contact.id}`}
                                  className="text-sm font-medium text-foreground hover:underline truncate block"
                                >
                                  {contact.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {/* Score */}
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                                    {contact.score}/{contact.totalCriteria}
                                  </span>
                                  {/* Preferences that matched */}
                                  {contact.prefOperation && (
                                    <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                                      {prefOperationLabels[contact.prefOperation] ?? contact.prefOperation}
                                    </span>
                                  )}
                                  {contact.prefCity && (
                                    <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                                      {contact.prefCity}
                                    </span>
                                  )}
                                  {contact.prefBudgetMax && (
                                    <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                                      ${parseFloat(contact.prefBudgetMax).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quick actions */}
                              <div className="flex gap-1.5 shrink-0">
                                {contact.phone && (
                                  <a
                                    href={`https://wa.me/${contact.phone.replace(/\D/gu, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                                    title="WhatsApp"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {contact.email && (
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                    title="Email"
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
