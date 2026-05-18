import { Scale } from "lucide-react";
import { ValuationForm } from "./valuation-form";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

/**
 * Valuation page — independent tool for property price estimation.
 *
 * The agent fills in the property characteristics (type, city, area, etc.)
 * and the system queries market_listings to find comparables and calculate
 * KPIs. Designed to be shown directly to the client during a meeting.
 *
 * No property needs to exist in the CRM — this is a pre-capture tool.
 */
export default function ValuationPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Tasacion de Mercado
            <InfoTooltip text="Ingresa las caracteristicas de la propiedad y obtendras un analisis de precios basado en propiedades similares publicadas en MercadoLibre. Ideal para mostrarle al cliente en la primera reunion." />
          </h1>
          <p className="text-xs text-muted-foreground">
            Compara precios con propiedades similares en MercadoLibre
          </p>
        </div>
      </div>

      {/* Form + Results */}
      <ValuationForm />
    </div>
  );
}
