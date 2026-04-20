import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import {
  getAgentProfileBySlug,
  getAgentProperties,
} from "@/server/actions/agent-profile";

export const dynamic = "force-dynamic";

/**
 * Public agent portal page — no auth required.
 * URL: /agente/{slug}
 * Shows the agent's profile + their active property listings.
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

interface AgentPortalPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; operation?: string }>;
}

export default async function AgentPortalPage({
  params,
  searchParams,
}: AgentPortalPageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const profile = await getAgentProfileBySlug(slug);
  if (!profile) notFound();

  const propertyList = await getAgentProperties(profile.userId, {
    type: filters.type,
    operation: filters.operation,
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
        <div
          className="flex items-center gap-2 font-bold text-lg"
          style={{ color: "#0A2B1D" }}
        >
          <Building2 className="h-5 w-5" />
          Propi
        </div>
      </header>

      {/* Agent Profile Card */}
      <div className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div
          className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6"
          style={{ background: "#0A2B1D", color: "#E3E1DC" }}
        >
          {/* Photo */}
          {profile.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.photoUrl}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold shrink-0">
              {profile.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">
              {profile.displayName}
            </h1>
            {profile.agency && (
              <p className="text-sm opacity-70 mt-1">{profile.agency}</p>
            )}
            {profile.city && (
              <p className="text-sm opacity-60 flex items-center gap-1 justify-center md:justify-start mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.city}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm opacity-80 mt-3 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Contact buttons */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, vi tu portal en Propi y me interesa una propiedad.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </a>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="text-center shrink-0">
            <div className="text-3xl font-bold">{propertyList.length}</div>
            <div className="text-xs opacity-60 uppercase tracking-widest">
              Propiedades
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-6xl mx-auto px-4 mb-6">
        <form className="flex flex-wrap gap-2">
          <select
            name="type"
            defaultValue={filters.type}
            className="h-9 rounded-lg border border-black/10 bg-white/60 px-3 text-sm"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="operation"
            defaultValue={filters.operation}
            className="h-9 rounded-lg border border-black/10 bg-white/60 px-3 text-sm"
          >
            <option value="">Todas las operaciones</option>
            {Object.entries(operationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-lg px-4 text-sm font-medium text-white"
            style={{ background: "#0A2B1D" }}
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Property Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 pb-20">
        {propertyList.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium">No hay propiedades</p>
            <p className="text-sm text-gray-500 mt-1">
              {filters.type || filters.operation
                ? "No se encontraron resultados con estos filtros."
                : "Este agente aun no tiene propiedades publicadas."}
            </p>
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
                    {/* Operation badge */}
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: "#0A2B1D" }}
                    >
                      {operationLabels[property.operation] ??
                        property.operation}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="truncate font-medium text-sm">
                      {property.title}
                    </p>
                    {price && (
                      <p
                        className="mt-0.5 text-lg font-bold"
                        style={{ color: "#0A2B1D" }}
                      >
                        {price}
                      </p>
                    )}
                    {(property.city || property.address) && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {[property.city, property.address]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-xs font-medium text-gray-700">
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
                      {property.parkingSpaces != null && (
                        <span className="flex items-center gap-0.5">
                          <Car className="h-3 w-3" />
                          {property.parkingSpaces}
                        </span>
                      )}
                      {property.area && (
                        <span className="flex items-center gap-0.5">
                          <Ruler className="h-3 w-3" />
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

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Propi - CRM Inmobiliario
      </footer>
    </div>
  );
}
