"use client";

import { useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import { AnalysisChat } from "./analysis-chat";

interface Property {
  id: string;
  title: string;
  type: string;
  operation: string;
  price: string | null;
  currency: string | null;
  city: string | null;
  area: string | null;
}

export function MarketAnalysisView({
  properties,
}: {
  properties: Property[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">
          Sin propiedades
        </h2>
        <p className="text-sm text-muted-foreground">
          Agrega una propiedad primero para poder analizar el mercado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Property selector */}
      <div className="lg:col-span-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          Selecciona una propiedad
        </h3>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selectedId === p.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <div className="text-sm font-bold text-foreground truncate">
                {p.title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {p.price && (
                  <span className="font-semibold text-foreground">
                    ${parseFloat(p.price).toLocaleString()} {p.currency}
                  </span>
                )}
                {p.area && <span>{p.area}m²</span>}
                {p.city && <span>{p.city}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis area */}
      <div className="lg:col-span-2">
        {selectedId ? (
          <AnalysisChat key={selectedId} propertyId={selectedId} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-purple-300 mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">
              Selecciona una propiedad
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Elige una propiedad de la lista para analizar su posicion en el
              mercado con datos de MercadoLibre y analisis de IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
