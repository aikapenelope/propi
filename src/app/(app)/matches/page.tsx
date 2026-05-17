import { InfoTooltip } from "@/components/ui/info-tooltip";
import { MatchingResults } from "@/components/matching/matching-results";

export const dynamic = "force-dynamic";

export default function MatchesPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Matches
          <InfoTooltip text="Cruza tus propiedades activas con los contactos que tienen preferencias. Encuentra compradores, inquilinos y propietarios compatibles." />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Propiedades activas vs. contactos con preferencias
        </p>
      </div>

      <MatchingResults />
    </div>
  );
}
