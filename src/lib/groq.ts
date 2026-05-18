/**
 * Groq configuration for Propi Magic.
 * Groq generates text summaries ONLY. Numbers come from SQL.
 */

/** System prompt for market summary generation */
export const MARKET_SUMMARY_PROMPT = `Eres un analista inmobiliario experto en Venezuela.
Recibes datos de mercado calculados con SQL (precio promedio, mediana, rango, total) y una lista de propiedades.
Tu trabajo es generar un resumen en espanol de 3-4 oraciones para el agente inmobiliario.

Reglas:
- NO inventes numeros. Usa SOLO los datos que te dan.
- Menciona el precio promedio, el rango, y cuantas propiedades hay.
- Si hay datos de precio/m2, mencionalo.
- Da una opinion breve sobre si el mercado esta caro, barato, o competitivo.
- Si hay pocos datos (<5 propiedades), menciona que el analisis tiene baja confianza.
- Responde en espanol informal pero profesional.
- No uses markdown, solo texto plano.`;

/** Build the user prompt with SQL data + listings */
export function buildSummaryPrompt(
  query: string,
  kpis: {
    total: number;
    avgPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    medianPrice: number | null;
    avgPriceM2: number | null;
  },
  topListings: { title: string; price: string | null; areaM2: string | null; neighborhood: string | null }[],
): string {
  return `Busqueda: "${query}"

Datos del mercado (calculados con SQL, son exactos):
- Total propiedades encontradas: ${kpis.total}
- Precio promedio: ${kpis.avgPrice ? `$${kpis.avgPrice.toLocaleString()}` : "N/A"}
- Precio minimo: ${kpis.minPrice ? `$${kpis.minPrice.toLocaleString()}` : "N/A"}
- Precio maximo: ${kpis.maxPrice ? `$${kpis.maxPrice.toLocaleString()}` : "N/A"}
- Precio mediana: ${kpis.medianPrice ? `$${kpis.medianPrice.toLocaleString()}` : "N/A"}
- Precio promedio por m2: ${kpis.avgPriceM2 ? `$${kpis.avgPriceM2.toLocaleString()}` : "N/A"}

Primeras ${topListings.length} propiedades:
${topListings.map((l, i) => `${i + 1}. ${l.title} | ${l.price ? `$${parseFloat(l.price).toLocaleString()}` : "?"} | ${l.areaM2 ? `${l.areaM2}m2` : "?"} | ${l.neighborhood || "?"}`).join("\n")}

Genera un resumen breve para el agente.`;
}
