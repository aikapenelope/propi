/**
 * Simple parser that extracts search parameters from natural language.
 * No LLM needed - pattern matching on common real estate terms.
 */

export interface ParsedQuery {
  propertyType: string | null;
  operation: string | null;
  city: string | null;
  neighborhood: string | null;
  areaMin: number | null;
  areaMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  freeText: string;
}

// Property type patterns
const TYPE_PATTERNS: [RegExp, string][] = [
  [/\bapartamento[s]?\b/i, "Apartamento"],
  [/\bapto[s]?\b/i, "Apartamento"],
  [/\bcasa[s]?\b/i, "Casa"],
  [/\boficina[s]?\b/i, "Oficina"],
  [/\blocal(?:es)?\b/i, "Local"],
  [/\bterreno[s]?\b/i, "Terreno"],
  [/\blote[s]?\b/i, "Terreno"],
  [/\btownhouse[s]?\b/i, "Townhouse"],
  [/\bpenthouse[s]?\b/i, "Penthouse"],
];

// Operation patterns
const OP_PATTERNS: [RegExp, string][] = [
  [/\bventa\b/i, "Venta"],
  [/\bvender\b/i, "Venta"],
  [/\bcomprar\b/i, "Venta"],
  [/\balquiler\b/i, "Alquiler"],
  [/\brenta\b/i, "Alquiler"],
  [/\barrendar\b/i, "Alquiler"],
];

// Known cities in Venezuela
const CITIES = [
  "Caracas",
  "Maracaibo",
  "Valencia",
  "Barquisimeto",
  "Maracay",
  "Ciudad Guayana",
  "Barcelona",
  "Maturin",
  "Cumana",
  "Merida",
  "San Cristobal",
  "Porlamar",
  "Punto Fijo",
  "Guarenas",
  "Los Teques",
  "Guatire",
  "Cabimas",
  "Coro",
  "Acarigua",
  "Barinas",
];

// Known neighborhoods (Caracas focus)
const NEIGHBORHOODS = [
  "Los Palos Grandes",
  "Altamira",
  "Chacao",
  "Las Mercedes",
  "El Rosal",
  "La Castellana",
  "Chuao",
  "Santa Rosa de Lima",
  "La Florida",
  "Los Naranjos",
  "El Hatillo",
  "Prados del Este",
  "Santa Fe",
  "La Lagunita",
  "El Cafetal",
  "Colinas de Bello Monte",
  "Sabana Grande",
  "La Candelaria",
  "Catia",
  "El Paraiso",
  "San Bernardino",
  "Los Chorros",
  "Sebucán",
  "La Urbina",
  "Terrazas del Avila",
  "Campo Alegre",
  "Los Samanes",
  "Lomas del Sol",
  "El Marques",
  "Boleita",
];

export function parseMarketQuery(input: string): ParsedQuery {
  const result: ParsedQuery = {
    propertyType: null,
    operation: null,
    city: null,
    neighborhood: null,
    areaMin: null,
    areaMax: null,
    priceMin: null,
    priceMax: null,
    bedrooms: null,
    bathrooms: null,
    freeText: input.trim(),
  };

  // Property type
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(input)) {
      result.propertyType = type;
      break;
    }
  }

  // Operation
  for (const [pattern, op] of OP_PATTERNS) {
    if (pattern.test(input)) {
      result.operation = op;
      break;
    }
  }

  // Neighborhood (check before city, more specific)
  for (const hood of NEIGHBORHOODS) {
    if (input.toLowerCase().includes(hood.toLowerCase())) {
      result.neighborhood = hood;
      // Default city for known Caracas neighborhoods
      result.city = "Caracas";
      break;
    }
  }

  // City
  if (!result.city) {
    for (const city of CITIES) {
      if (input.toLowerCase().includes(city.toLowerCase())) {
        result.city = city;
        break;
      }
    }
  }

  // Area range: "80-100m2", "80 a 100 m2", "de 80m2"
  const areaRange = input.match(
    /(\d+)\s*(?:-|a)\s*(\d+)\s*m(?:2|²)/i,
  );
  if (areaRange) {
    result.areaMin = parseInt(areaRange[1]);
    result.areaMax = parseInt(areaRange[2]);
  } else {
    const areaSingle = input.match(/(\d+)\s*m(?:2|²)/i);
    if (areaSingle) {
      const area = parseInt(areaSingle[1]);
      result.areaMin = Math.round(area * 0.8);
      result.areaMax = Math.round(area * 1.2);
    }
  }

  // Price range: "$100K-200K", "100000-200000", "menos de $150K"
  const priceRange = input.match(
    /\$?\s*(\d+)[kK]?\s*(?:-|a)\s*\$?\s*(\d+)[kK]?/,
  );
  if (priceRange) {
    let min = parseInt(priceRange[1]);
    let max = parseInt(priceRange[2]);
    if (min < 1000) min *= 1000;
    if (max < 1000) max *= 1000;
    result.priceMin = min;
    result.priceMax = max;
  } else {
    const priceLess = input.match(
      /menos\s+de\s+\$?\s*(\d+)[kK]?/i,
    );
    if (priceLess) {
      let max = parseInt(priceLess[1]);
      if (max < 1000) max *= 1000;
      result.priceMax = max;
    }
    const priceMore = input.match(
      /(?:mas|más)\s+de\s+\$?\s*(\d+)[kK]?/i,
    );
    if (priceMore) {
      let min = parseInt(priceMore[1]);
      if (min < 1000) min *= 1000;
      result.priceMin = min;
    }
  }

  // Bedrooms: "3 hab", "3 habitaciones", "3 cuartos"
  const bedMatch = input.match(
    /(\d+)\s*(?:hab(?:itacion(?:es)?)?|cuarto[s]?|dormitorio[s]?)/i,
  );
  if (bedMatch) {
    result.bedrooms = parseInt(bedMatch[1]);
  }

  // Bathrooms: "2 banos", "2 baños"
  const bathMatch = input.match(/(\d+)\s*(?:baño[s]?|bano[s]?)/i);
  if (bathMatch) {
    result.bathrooms = parseInt(bathMatch[1]);
  }

  return result;
}
