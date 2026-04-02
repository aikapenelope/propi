import { Sparkles } from "lucide-react";
import { PropiMagicChat } from "@/components/market/propi-magic-chat";

export const dynamic = "force-dynamic";

export default function PropiMagicPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Propi Magic</h1>
          <p className="text-xs text-muted-foreground">
            Inteligencia de mercado con datos de MercadoLibre
          </p>
        </div>
      </div>

      <PropiMagicChat />
    </div>
  );
}
