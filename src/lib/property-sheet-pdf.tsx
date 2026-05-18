import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropertySheetData {
  title: string;
  description: string | null;
  type: string;
  operation: string;
  price: string | null;
  currency: string;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  coverImageUrl: string | null;
  agentName: string;
  companyName: string | null;
  publicUrl: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  brand: "#0A2B1D",
  brandLight: "#E3E1DC",
  accent: "#059669",
  text: "#1a1a1a",
  muted: "#666666",
  border: "#e5e5e5",
  bgAlt: "#f8f8f8",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Header band
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.brandLight,
    letterSpacing: 1,
  },
  headerBadge: {
    fontSize: 9,
    color: colors.brandLight,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Cover image
  coverImage: {
    width: "100%",
    height: 240,
    objectFit: "cover",
  },
  // Content
  content: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 6,
  },
  location: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 20,
  },
  // Specs grid
  specsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  specCard: {
    flex: 1,
    backgroundColor: colors.bgAlt,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  specValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 2,
  },
  specLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase" as const,
  },
  // Description
  descTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 8,
    marginTop: 8,
  },
  descText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
  footerAgent: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  office: "Oficina",
  commercial: "Local Comercial",
  land: "Terreno",
  warehouse: "Galpon",
  other: "Inmueble",
};

const opLabels: Record<string, string> = {
  sale: "Venta",
  rent: "Alquiler",
  sale_rent: "Venta / Alquiler",
  sell: "Venta",
  lease: "Alquiler",
};

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function PropertySheetPDF({ data }: { data: PropertySheetData }) {
  const price = data.price
    ? "$" + parseFloat(data.price).toLocaleString("en-US", { maximumFractionDigits: 0 })
    : null;

  const location = [data.address, data.city, data.state].filter(Boolean).join(", ");

  const specs = [
    data.bedrooms != null ? { value: String(data.bedrooms), label: "Habitaciones" } : null,
    data.bathrooms != null ? { value: String(data.bathrooms), label: "Banos" } : null,
    data.area ? { value: `${data.area}`, label: "m2" } : null,
    data.parkingSpaces != null ? { value: String(data.parkingSpaces), label: "Estac." } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <Document
      title={data.title}
      author="Propi CRM"
    >
      <Page size="LETTER" style={s.page}>
        {/* Header band */}
        <View style={s.header}>
          <Text style={s.headerTitle}>
            {data.companyName?.toUpperCase() || "PROPI"}
          </Text>
          <Text style={s.headerBadge}>
            {opLabels[data.operation] || data.operation}
          </Text>
        </View>

        {/* Cover image */}
        {data.coverImageUrl && (
          <Image src={data.coverImageUrl} style={s.coverImage} />
        )}

        {/* Content */}
        <View style={s.content}>
          {/* Title + location */}
          <Text style={s.title}>{data.title}</Text>
          {location && <Text style={s.location}>{location}</Text>}

          {/* Price */}
          {price && <Text style={s.price}>{price}</Text>}

          {/* Specs */}
          {specs.length > 0 && (
            <View style={s.specsRow}>
              {specs.map((spec) => (
                <View key={spec.label} style={s.specCard}>
                  <Text style={s.specValue}>{spec.value}</Text>
                  <Text style={s.specLabel}>{spec.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Type */}
          <Text style={{ fontSize: 9, color: colors.muted, marginBottom: 12 }}>
            {typeLabels[data.type] || data.type} · {data.currency}
          </Text>

          {/* Description */}
          {data.description && (
            <>
              <Text style={s.descTitle}>Descripcion</Text>
              <Text style={s.descText}>
                {data.description.slice(0, 1500)}
              </Text>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerAgent}>{data.agentName}</Text>
            <Text style={s.footerText}>{data.companyName || "Propi CRM"}</Text>
          </View>
          <Text style={s.footerText}>{data.publicUrl}</Text>
        </View>
      </Page>
    </Document>
  );
}
