import { Building2, Bed, Bath, Car, ExternalLink } from "lucide-react";
import type { CleanedListing } from "@/lib/mercadolibre";

export function SimilarListingCard({ listing }: { listing: CleanedListing }) {
  return (
    <a
      href={listing.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-2xl border border-border bg-background p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {listing.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.thumbnail}
          alt={listing.title}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-muted"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-foreground truncate">
          {listing.title}
        </h4>
        <p className="text-base font-extrabold text-primary mt-0.5">
          ${listing.price.toLocaleString()} {listing.currency}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {listing.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" /> {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" /> {listing.bathrooms}
            </span>
          )}
          {listing.area && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {listing.area}m²
            </span>
          )}
          {listing.parking && (
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" /> {listing.parking}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {[listing.neighborhood, listing.city].filter(Boolean).join(", ")}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
    </a>
  );
}

export function SimilarListings({
  listings,
  similarIndices,
}: {
  listings: CleanedListing[];
  similarIndices?: number[];
}) {
  // Show similar ones first, then the rest
  const similar = similarIndices
    ? similarIndices.map((i) => listings[i]).filter(Boolean)
    : listings.slice(0, 5);

  if (similar.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3">
        Propiedades Similares ({similar.length})
      </h3>
      <div className="space-y-2">
        {similar.map((listing) => (
          <SimilarListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
