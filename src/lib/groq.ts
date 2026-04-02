import type { CleanedListing } from "./mercadolibre";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalysisResult {
  avg_price_m2: number | null;
  price_range: { min: number; median: number; max: number };
  total_analyzed: number;
  sale_vs_rent: { sale: number; rent: number };
  user_position: "above_market" | "competitive" | "below_market";
  suggested_price: number;
  suggested_price_range: { low: number; high: number };
  confidence: "high" | "medium" | "low";
  summary: string;
  insights: string[];
  similar_indices: number[];
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export const MARKET_ANALYSIS_SYSTEM_PROMPT = `Eres un analista inmobiliario experto en el mercado de Venezuela.
Recibes datos de propiedades publicadas en MercadoLibre y una propiedad
del usuario. Analiza el mercado y responde SOLO en JSON valido.

Estructura de respuesta:
{
  "avg_price_m2": number | null,
  "price_range": { "min": number, "median": number, "max": number },
  "total_analyzed": number,
  "sale_vs_rent": { "sale": number, "rent": number },
  "user_position": "above_market" | "competitive" | "below_market",
  "suggested_price": number,
  "suggested_price_range": { "low": number, "high": number },
  "confidence": "high" | "medium" | "low",
  "summary": "string en espanol, 3-4 oraciones con el analisis",
  "insights": ["string con insight relevante"],
  "similar_indices": [0, 3, 7, 12, 15]
}

Reglas:
- Calcula precio/m2 solo con propiedades que tengan area > 0
- Ignora propiedades con precios anomalos (>3x o <0.3x de la mediana)
- Si hay menos de 5 propiedades, confidence = "low"
- similar_indices son los indices del array de listings mas similares (max 5)
- Precios en Venezuela generalmente estan en USD
- Incluye 2-3 insights relevantes (ej: "El 70% de las propiedades similares tienen parqueadero")
- summary debe mencionar el precio sugerido y por que
- Si no hay suficientes datos, di que el analisis tiene baja confianza`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildUserPrompt(
  property: {
    title: string;
    type: string;
    operation: string;
    price: string | null;
    currency: string | null;
    area: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    city: string | null;
    parkingSpaces: number | null;
  },
  listings: CleanedListing[],
): string {
  return JSON.stringify({
    user_property: {
      title: property.title,
      type: property.type,
      operation: property.operation,
      price: property.price ? parseFloat(property.price) : null,
      currency: property.currency,
      area: property.area ? parseFloat(property.area) : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      city: property.city,
      parking: property.parkingSpaces,
    },
    market_listings: listings,
  });
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/** Parse Groq JSON response with fallback for malformed output */
export function parseAnalysisResponse(text: string): AnalysisResult | null {
  try {
    // Try direct parse
    const parsed = JSON.parse(text);
    if (parsed.avg_price_m2 !== undefined || parsed.summary) {
      return parsed as AnalysisResult;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1]) as AnalysisResult;
      } catch {
        return null;
      }
    }
    return null;
  }
}
