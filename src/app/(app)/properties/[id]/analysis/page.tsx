import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProperty } from "@/server/actions/properties";
import { getAnalyses } from "@/server/actions/market-analysis";
import { AnalysisChat } from "@/components/market/analysis-chat";
import { AnalysisHistory } from "@/components/market/analysis-history";

export const dynamic = "force-dynamic";

export default async function MarketAnalysisPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const property = await getProperty(id);
  if (!property) notFound();

  const analyses = await getAnalyses(id);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/properties/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Analisis de Mercado
          </h1>
          <p className="text-sm text-muted-foreground">{property.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: analysis chat */}
        <div className="lg:col-span-2">
          <AnalysisChat propertyId={id} />
        </div>

        {/* Sidebar: history */}
        <div className="lg:col-span-1">
          <AnalysisHistory analyses={analyses} propertyId={id} />
        </div>
      </div>
    </div>
  );
}
