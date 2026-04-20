import { notFound } from "next/navigation";
import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
} from "lucide-react";
import { db } from "@/lib/db";
import { properties, propertyImages } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Public agent portal — no auth required.
 * URL: /agente/{clerkUserId}
 * Shows the agent's name + photo from Clerk and their active properties.
 * Each property card links to /p/[id] (existing public property page).
 */

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
  rent: "Alquiler",
  sale_rent: "Venta / Alquiler",
};

export default async function AgentPortalPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await props.params;

  // Get agent info from Clerk
  let agent: { firstName: string | null; lastName: string | null; imageUrl: string };
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    agent = {
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    };
  } catch {
    notFound();
  }

  const displayName = [agent.firstName, agent.lastName].filter(Boolean).join(" ") || "Agente";

  // Get active properties
  const propertyList = await db.query.properties.findMany({
    where: and(
      eq(properties.userId, userId),
      eq(properties.status, "active"),
    ),
    with: {
      images: {
        orderBy: [propertyImages.sortOrder],
        limit: 1,
      },
    },
    orderBy: [desc(properties.updatedAt)],
    columns: {
      id: true,
      title: true,
      type: true,
      operation: true,
      price: true,
      currency: true,
      area: true,
      bedrooms: true,
      bathrooms: true,
      parkingSpaces: true,
      city: true,
      address: true,
    },
    limit: 50,
  });

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#E3E1DC",
        color: "#121212",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "#0A2B1D" }}>
          <Building2 className="h-5 w-5" />
          Propi
        </div>
      </header>

      {/* Agent Card */}
      <div className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div
          className="rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5"
          style={{ background: "#0A2B1D", color: "#E3E1DC" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={agent.imageUrl}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
            <p className="text-sm opacity-60 mt-1">
              {propertyList.length} propiedad{propertyList.length !== 1 ? "es" : ""} publicada{propertyList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Property Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-20">
        {propertyList.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium">No hay propiedades publicadas</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {propertyList.map((property) => {
              const coverImage = property.images[0];
              const price = formatPrice(property.price, property.currency);

              return (
                <Link
                  key={property.id}
                  href={`/p/${property.id}`}
                  className="group overflow-hidden rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                    {coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/images/${coverImage.key}`}
                        alt={property.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: "#0A2B1D" }}
                    >
                      {operationLabels[property.operation] ?? property.operation}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="truncate font-medium text-sm">{property.title}</p>
                    {price && (
                      <p className="mt-0.5 text-lg font-bold" style={{ color: "#0A2B1D" }}>
                        {price}
                      </p>
                    )}
                    {(property.city || property.address) && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {[property.city, property.address].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-xs font-medium text-gray-700">
                        {typeLabels[property.type] ?? property.type}
                      </span>
                      {property.bedrooms != null && (
                        <span className="flex items-center gap-0.5">
                          <Bed className="h-3 w-3" /> {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms != null && (
                        <span className="flex items-center gap-0.5">
                          <Bath className="h-3 w-3" /> {property.bathrooms}
                        </span>
                      )}
                      {property.parkingSpaces != null && (
                        <span className="flex items-center gap-0.5">
                          <Car className="h-3 w-3" /> {property.parkingSpaces}
                        </span>
                      )}
                      {property.area && (
                        <span className="flex items-center gap-0.5">
                          <Ruler className="h-3 w-3" /> {property.area}m²
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

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Propi - CRM Inmobiliario
      </footer>
    </div>
  );
}
