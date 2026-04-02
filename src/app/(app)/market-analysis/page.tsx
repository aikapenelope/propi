import { Sparkles } from "lucide-react";
import { getProperties } from "@/server/actions/properties";
import { MarketAnalysisView } from "@/components/market/market-analysis-view";

export const dynamic = "force-dynamic";

export default async function PropiMagicPage() {
  const properties = await getProperties();

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Propi Magic</h1>
          <p className="text-sm text-muted-foreground">
            Analisis de mercado con IA. Busca propiedades similares en
            MercadoLibre y obtiene precios, tendencias y sugerencias.
          </p>
        </div>
      </div>

      <MarketAnalysisView properties={properties} />
    </div>
  );
}
