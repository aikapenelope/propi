import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        Pagina no encontrada
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        La pagina que buscas no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Ir al Dashboard
      </Link>
    </div>
  );
}
