import { Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import { PropiMagicChat } from "@/components/market/propi-magic-chat";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default function PropiMagicPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Propi Magic
              <InfoTooltip text="Pregunta sobre precios, tendencias, o comparables en cualquier zona de Venezuela. Los datos vienen de MercadoLibre y se actualizan diariamente." />
            </h1>
            <p className="text-xs text-muted-foreground">
              Inteligencia de mercado con datos de MercadoLibre
            </p>
          </div>
        </div>
        <Link
          href="/market-analysis/kpis"
          className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Ver KPIs
        </Link>
      </div>

      <PropiMagicChat />
    </div>
  );
}
