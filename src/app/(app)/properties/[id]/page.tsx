import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Pencil,
  Calendar,
} from "lucide-react";
import { getProperty, getImageUrl } from "@/server/actions/properties";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { PropertyImageUpload } from "@/components/properties/property-image-upload";

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

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  // Resolve presigned URLs for images
  const imagesWithUrls = await Promise.all(
    property.images.map(async (img) => {
      try {
        const url = await getImageUrl(img.key);
        return { ...img, url };
      } catch {
        return { ...img, url: undefined };
      }
    }),
  );

  return (
    <div className="p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/properties"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Propiedades
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {property.title}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{
                backgroundColor:
                  statusColors[property.status] ?? "#94a3b8",
              }}
            >
              {statusLabels[property.status] ?? property.status}
            </span>
          </div>
          {property.price && (
            <p className="mt-1 text-2xl font-bold text-primary">
              {formatCurrency(
                parseFloat(property.price),
                property.currency ?? "USD",
              )}
            </p>
          )}
          {(property.city || property.address) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[property.address, property.city, property.state]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <DeletePropertyButton id={id} />
        </div>
      </div>

      {/* Image gallery with upload */}
      <div className="mb-6">
        <PropertyImageUpload
          propertyId={id}
          images={imagesWithUrls.map((img) => ({
            id: img.id,
            key: img.key,
            filename: img.filename,
            url: img.url,
          }))}
        />
      </div>

      {/* Details grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Specs card */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Caracteristicas
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo</span>
              <p className="font-medium text-foreground">
                {typeLabels[property.type] ?? property.type}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Operacion</span>
              <p className="font-medium text-foreground">
                {operationLabels[property.operation] ?? property.operation}
              </p>
            </div>
            {property.area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {property.area} m²
                </span>
              </div>
            )}
            {property.bedrooms != null && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {property.bedrooms} hab.
                </span>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {property.bathrooms} bano{property.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {property.parkingSpaces != null && (
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {property.parkingSpaces} parq.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tags card */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Etiquetas
          </h2>
          {property.propertyTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {property.propertyTags.map((pt) => (
                <span
                  key={pt.tag.id}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${pt.tag.color}20`,
                    color: pt.tag.color ?? "#6366f1",
                  }}
                >
                  {pt.tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin etiquetas</p>
          )}

          {/* Agent */}
          {property.agent && (
            <div className="mt-4 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Agente</span>
              <p className="font-medium text-foreground">
                {property.agent.name}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Creada {formatDate(property.createdAt)}
            </div>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div className="rounded-lg border border-border p-4 md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Descripcion
            </h2>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {property.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
