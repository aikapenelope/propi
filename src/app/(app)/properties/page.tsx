import Link from "next/link";
import { Plus, MapPin, Bed, Bath, Maximize } from "lucide-react";
import { getProperties } from "@/server/actions/properties";
import { formatCurrency } from "@/lib/utils";

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
  rent: "Arriendo",
  sale_rent: "Venta/Arriendo",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  reserved: "Reservada",
  sold: "Vendida",
  rented: "Arrendada",
  inactive: "Inactiva",
};

const statusColors: Record<string, string> = {
  draft: "#94a3b8",
  active: "#22c55e",
  reserved: "#f59e0b",
  sold: "#3b82f6",
  rented: "#8b5cf6",
  inactive: "#ef4444",
};

interface PropertiesPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    operation?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;
  const propertyList = await getProperties({
    search: params.q,
    type: params.type,
    operation: params.operation,
    status: params.status,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propiedades</h1>
          <p className="text-sm text-muted-foreground">
            {propertyList.length} propiedad
            {propertyList.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Propiedad</span>
        </Link>
      </div>

      {/* Filters */}
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Buscar..."
          className="h-9 w-full max-w-xs rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          name="type"
          defaultValue={params.type}
          className="h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground"
        >
          <option value="">Tipo</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="operation"
          defaultValue={params.operation}
          className="h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground"
        >
          <option value="">Operacion</option>
          {Object.entries(operationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status}
          className="h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground"
        >
          <option value="">Estado</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Property grid */}
      {propertyList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay propiedades
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {params.q
              ? "No se encontraron resultados."
              : "Agrega tu primera propiedad."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {propertyList.map((property) => {
            const coverImage = property.images[0];
            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="relative aspect-[4/3] bg-muted">
                  {coverImage ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {coverImage.filename}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                  {/* Status badge */}
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{
                      backgroundColor: statusColors[property.status] ?? "#94a3b8",
                    }}
                  >
                    {statusLabels[property.status] ?? property.status}
                  </span>
                  {/* Operation badge */}
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    {operationLabels[property.operation] ?? property.operation}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="truncate font-medium text-foreground group-hover:text-primary">
                    {property.title}
                  </p>
                  {property.price && (
                    <p className="mt-0.5 text-lg font-bold text-primary">
                      {formatCurrency(
                        parseFloat(property.price),
                        property.currency ?? "USD",
                      )}
                    </p>
                  )}
                  {(property.city || property.address) && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {property.city}
                      {property.city && property.address ? ", " : ""}
                      {property.address}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-xs font-medium text-foreground/70">
                      {typeLabels[property.type] ?? property.type}
                    </span>
                    {property.bedrooms != null && (
                      <span className="flex items-center gap-0.5">
                        <Bed className="h-3 w-3" />
                        {property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms != null && (
                      <span className="flex items-center gap-0.5">
                        <Bath className="h-3 w-3" />
                        {property.bathrooms}
                      </span>
                    )}
                    {property.area && (
                      <span className="flex items-center gap-0.5">
                        <Maximize className="h-3 w-3" />
                        {property.area}m²
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
