import { db } from "@/lib/db";
import { properties, propertyImages } from "@/server/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  DollarSign,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Public property page - no auth required.
 * URL: /p/{propertyId}
 * Used for sharing properties via WhatsApp, Instagram, Facebook, etc.
 */
export default async function PublicPropertyPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  const property = await db.query.properties.findFirst({
    where: eq(properties.id, id),
    with: {
      images: { orderBy: [propertyImages.sortOrder] },
    },
  });

  if (!property) notFound();

  // Generate proxy URLs for images
  const imagesWithUrls = property.images.map((img) => ({
    ...img,
    url: `/api/images/${encodeURIComponent(img.key)}`,
  }));

  const typeLabels: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    office: "Oficina",
    commercial: "Local Comercial",
    land: "Terreno",
    warehouse: "Galpon",
    other: "Otro",
  };

  const opLabels: Record<string, string> = {
    sale: "Venta",
    rent: "Alquiler",
    sale_rent: "Venta / Alquiler",
  };

  const price = property.price
    ? new Intl.NumberFormat("es", {
        style: "currency",
        currency: property.currency || "USD",
        minimumFractionDigits: 0,
      }).format(parseFloat(property.price))
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#E3E1DC", color: "#121212", fontFamily: "'Manrope', sans-serif" }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "#0A2B1D" }}>
          <Building2 className="h-5 w-5" />
          Propi
        </div>
        <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: "#0A2B1D", color: "#E3E1DC" }}>
          {opLabels[property.operation] || property.operation}
        </span>
      </header>

      {/* Image gallery */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-8">
        {imagesWithUrls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden">
            {imagesWithUrls.slice(0, 4).map((img, i) => (
              <div
                key={img.id}
                className={`relative overflow-hidden ${i === 0 ? "md:col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}
              >
                {img.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[16/7] rounded-2xl bg-gray-200 flex items-center justify-center">
            <Building2 className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#0A2B1D" }}>
              {property.title}
            </h1>

            {(property.city || property.state) && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-6">
                <MapPin className="h-4 w-4" />
                {[property.address, property.city, property.state].filter(Boolean).join(", ")}
              </div>
            )}

            {/* Specs */}
            <div className="flex flex-wrap gap-4 mb-8">
              {property.bedrooms != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Bed className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{property.bedrooms}</span>
                  <span className="text-gray-500">Hab.</span>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Bath className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{property.bathrooms}</span>
                  <span className="text-gray-500">Banos</span>
                </div>
              )}
              {property.parkingSpaces != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{property.parkingSpaces}</span>
                  <span className="text-gray-500">Estac.</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Ruler className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{property.area}</span>
                  <span className="text-gray-500">m2</span>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="font-semibold text-lg mb-3" style={{ color: "#0A2B1D" }}>Descripcion</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Type */}
            <div className="mt-6 text-sm text-gray-500">
              {typeLabels[property.type] || property.type}
            </div>
          </div>

          {/* Price card */}
          <div>
            <div className="rounded-2xl p-6 sticky top-6" style={{ background: "#0A2B1D", color: "#E3E1DC" }}>
              {price && (
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Precio</div>
                  <div className="text-3xl font-bold flex items-center gap-1">
                    <DollarSign className="h-6 w-6 opacity-60" />
                    {price}
                  </div>
                </div>
              )}
              <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Tipo</div>
              <div className="font-medium mb-4">{typeLabels[property.type] || property.type}</div>
              <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Operacion</div>
              <div className="font-medium mb-6">{opLabels[property.operation] || property.operation}</div>

              <div className="text-center text-xs opacity-40 mt-4">
                Publicado en Propi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Propi - CRM Inmobiliario
      </footer>
    </div>
  );
}
