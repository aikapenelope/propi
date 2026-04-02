# Analisis de Mercado con MercadoLibre + Groq

## Resumen

Feature que permite al agente analizar el mercado inmobiliario en tiempo real. Busca propiedades similares en MercadoLibre Venezuela, las analiza con Groq (Llama 3.3), y presenta un reporte visual: cards de propiedades con imagen/precio/link + KPIs + sugerencia de precio. Los analisis se guardan en DB para consulta posterior.

---

## 1. MercadoLibre API (Venezuela - MLV)

### Autenticacion

La API de MercadoLibre Venezuela requiere OAuth2. La busqueda publica (sin auth) retorna 403.

**Flujo OAuth2:**

```
1. Usuario hace click en "Conectar MercadoLibre" en /marketing/settings
       |
       v
2. Redirect a MercadoLibre:
   https://auth.mercadolibre.com.ve/authorization
     ?response_type=code
     &client_id={APP_ID}
     &redirect_uri=https://propi.aikalabs.cc/api/auth/mercadolibre/callback
     &state={random_state}
       |
       v
3. Usuario autoriza la app en MercadoLibre
       |
       v
4. MercadoLibre redirige a nuestro callback con ?code=XXX
       |
       v
5. Server intercambia code por tokens:
   POST https://api.mercadolibre.com/oauth/token
   {
     "grant_type": "authorization_code",
     "client_id": "{APP_ID}",
     "client_secret": "{SECRET_KEY}",
     "code": "{CODE}",
     "redirect_uri": "https://propi.aikalabs.cc/api/auth/mercadolibre/callback"
   }
       |
       v
6. Respuesta:
   {
     "access_token": "APP_USR-xxx",
     "token_type": "Bearer",
     "expires_in": 21600,        // 6 horas
     "scope": "read write",
     "user_id": 123456,
     "refresh_token": "TG-xxx"
   }
       |
       v
7. Guardar access_token y refresh_token en tabla social_accounts
   (platform: "mercadolibre")
```

**Refresh del token (cada 6 horas):**
```
POST https://api.mercadolibre.com/oauth/token
{
  "grant_type": "refresh_token",
  "client_id": "{APP_ID}",
  "client_secret": "{SECRET_KEY}",
  "refresh_token": "{REFRESH_TOKEN}"
}
```

### Configuracion de la app en MercadoLibre

| Paso | Que hacer | Donde |
|------|----------|-------|
| 1 | Crear cuenta de desarrollador | https://developers.mercadolibre.com.ve |
| 2 | Click "Crear aplicacion" | Dashboard de desarrollador |
| 3 | Nombre: "Propi CRM" | Formulario de creacion |
| 4 | Redirect URI: `https://propi.aikalabs.cc/api/auth/mercadolibre/callback` | Configuracion de la app |
| 5 | Copiar App ID y Secret Key | Dashboard de la app |
| 6 | Agregar en Coolify como env vars | `ML_APP_ID` y `ML_SECRET_KEY` |

### Endpoints de busqueda (requieren auth)

**Buscar propiedades:**
```
GET https://api.mercadolibre.com/sites/MLV/search
  ?category={category_id}
  &q={query}
  &limit=50
  &offset=0
Headers:
  Authorization: Bearer {access_token}
```

**Detalle de un item:**
```
GET https://api.mercadolibre.com/items/{item_id}
Headers:
  Authorization: Bearer {access_token}
```

**Categorias:**
```
GET https://api.mercadolibre.com/sites/MLV/categories
Headers:
  Authorization: Bearer {access_token}
```

**Ubicaciones (publico):**
```
GET https://api.mercadolibre.com/classified_locations/countries/VE
GET https://api.mercadolibre.com/classified_locations/countries/VE/states
GET https://api.mercadolibre.com/classified_locations/states/{state_id}/cities
```

### Categorias de inmuebles Venezuela (MLV)

| Categoria | ID estimado | Descripcion |
|-----------|------------|-------------|
| Inmuebles | MLV1459 | Categoria padre |
| Apartamentos Venta | MLV1472 | Venta de apartamentos |
| Casas Venta | MLV1466 | Venta de casas |
| Oficinas Venta | MLV1473 | Venta de oficinas |
| Locales Venta | MLV1474 | Venta de locales |
| Terrenos Venta | MLV1475 | Venta de terrenos |
| Apartamentos Alquiler | MLV1493 | Alquiler de apartamentos |
| Casas Alquiler | MLV1492 | Alquiler de casas |
| Townhouses Venta | - | Verificar con API |

> Los IDs siguen el patron de ML por pais. Verificar exactos con `GET /sites/MLV/categories` una vez autenticado.

### Respuesta de busqueda (JSON real de ML)

```json
{
  "results": [
    {
      "id": "MLV123456",
      "title": "Apartamento en Los Palos Grandes 85m2 3 hab",
      "price": 150000,
      "currency_id": "USD",
      "permalink": "https://apartamento.mercadolibre.com.ve/MLV-123456-...",
      "thumbnail": "https://mlv-s2-p.mlstatic.com/910707-MLV40763776324-022020-I.jpg",
      "secure_thumbnail": "https://mlv-s2-p.mlstatic.com/910707-MLV40763776324-022020-O.jpg",
      "pictures": [
        {
          "id": "910707-MLV40763776324",
          "url": "https://mlv-s2-p.mlstatic.com/...-O.jpg",
          "secure_url": "https://mlv-s2-p.mlstatic.com/...-O.jpg",
          "size": "500x438",
          "max_size": "1200x1050"
        }
      ],
      "address": {
        "state_name": "Distrito Capital",
        "city_name": "Caracas",
        "neighborhood_name": "Los Palos Grandes"
      },
      "attributes": [
        { "id": "BEDROOMS", "value_name": "3" },
        { "id": "FULL_BATHROOMS", "value_name": "2" },
        { "id": "TOTAL_AREA", "value_name": "85 m²" },
        { "id": "COVERED_AREA", "value_name": "75 m²" },
        { "id": "PROPERTY_TYPE", "value_name": "Apartamento" },
        { "id": "OPERATION", "value_name": "Venta" },
        { "id": "PARKING_LOTS", "value_name": "1" },
        { "id": "ITEM_CONDITION", "value_name": "Usado" },
        { "id": "FLOORS", "value_name": "5" }
      ],
      "location": {
        "latitude": 10.4961,
        "longitude": -66.8505
      },
      "seller": {
        "id": 526655030,
        "nickname": "INMOBILIARIA_XYZ"
      }
    }
  ],
  "paging": { "total": 850, "offset": 0, "limit": 50 }
}
```

### Campos que NO retorna

- Telefono del vendedor
- Email del vendedor
- Nombre real del vendedor (solo nickname)
- Descripcion completa (requiere llamada adicional a `/items/{id}/description`)

### Rate limits

- 1500 requests/minuto por seller autenticado
- Sin limite diario documentado
- Token expira cada 6 horas (refresh automatico)

### Mapeo Propi -> MercadoLibre

| Campo Propi (schema.ts) | Campo MercadoLibre | Transformacion |
|--------------------------|-------------------|----------------|
| `type` = "apartment" | `category` = MLV1472 | Mapear enum a categoria |
| `type` = "house" | `category` = MLV1466 | |
| `type` = "office" | `category` = MLV1473 | |
| `type` = "commercial" | `category` = MLV1474 | |
| `type` = "land" | `category` = MLV1475 | |
| `operation` = "sale" | OPERATION: Venta | Filtro en query |
| `operation` = "rent" | OPERATION: Arriendo | Filtro en query |
| `price` | `price` | Directo |
| `currency` = "USD" / "VES" | `currency_id` | Directo |
| `area` | TOTAL_AREA | Extraer numero de "85 m²" |
| `bedrooms` | BEDROOMS | Directo |
| `bathrooms` | FULL_BATHROOMS | Directo |
| `parkingSpaces` | PARKING_LOTS | Directo |
| `city` | `address.city_name` | Directo |

### Funcion de limpieza del JSON

Antes de mandar a Groq, se limpia el JSON de ML para reducir tokens:

```typescript
// src/lib/mercadolibre.ts

interface CleanedListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  city: string;
  neighborhood: string;
  condition: string;
  permalink: string;
  thumbnail: string;
}

function cleanListing(raw: MeliSearchResult): CleanedListing {
  const attrs = Object.fromEntries(
    raw.attributes.map((a) => [a.id, a.value_name])
  );
  return {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    currency: raw.currency_id,
    area: parseFloat(attrs.TOTAL_AREA?.replace(/[^\d.]/g, "")) || null,
    bedrooms: parseInt(attrs.BEDROOMS) || null,
    bathrooms: parseInt(attrs.FULL_BATHROOMS) || null,
    parking: parseInt(attrs.PARKING_LOTS) || null,
    city: raw.address?.city_name || "",
    neighborhood: raw.address?.neighborhood_name || "",
    condition: attrs.ITEM_CONDITION || "",
    permalink: raw.permalink,
    thumbnail: raw.secure_thumbnail || raw.thumbnail,
  };
}
```

---

## 2. Groq API

### Modelo

**Llama 3.3 70B Versatile** (`llama-3.3-70b-versatile`)
- Context window: 131,072 tokens
- Output max: 32,768 tokens
- Velocidad: ~280 tokens/segundo
- JSON mode: soportado nativo

### Pricing

| Tier | Input | Output | RPM | RPD |
|------|-------|--------|-----|-----|
| Free | $0 | $0 | 30 | 1,000 |
| Paid | $0.59/M tokens | $0.79/M tokens | ilimitado | ilimitado |

Para un CRM con 5-10 usuarios, el free tier (1,000 req/dia) es suficiente.

### Configuracion

```
Cuenta: console.groq.com (gratis, sin tarjeta)
API Key: Settings > API Keys > Create
Env var: GROQ_API_KEY=gsk_...
```

### Endpoint

```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer {GROQ_API_KEY}
Content-Type: application/json

{
  "model": "llama-3.3-70b-versatile",
  "response_format": { "type": "json_object" },
  "temperature": 0.3,
  "messages": [
    { "role": "system", "content": "{SYSTEM_PROMPT}" },
    { "role": "user", "content": "{USER_PROMPT}" }
  ]
}
```

### System prompt completo

```
Eres un analista inmobiliario experto en el mercado de Venezuela.
Recibes datos de propiedades publicadas en MercadoLibre y una propiedad
del usuario. Analiza el mercado y responde SOLO en JSON valido.

Estructura de respuesta:
{
  "avg_price_m2": number | null,
  "price_range": {
    "min": number,
    "median": number,
    "max": number
  },
  "total_analyzed": number,
  "sale_vs_rent": {
    "sale": number,
    "rent": number
  },
  "user_position": "above_market" | "competitive" | "below_market",
  "suggested_price": number,
  "suggested_price_range": {
    "low": number,
    "high": number
  },
  "confidence": "high" | "medium" | "low",
  "summary": "string en espanol, 3-4 oraciones con el analisis",
  "insights": [
    "string con insight relevante"
  ],
  "similar_indices": [0, 3, 7, 12, 15]
}

Reglas:
- Calcula precio/m2 solo con propiedades que tengan area > 0
- Ignora propiedades con precios anomalos (>3x o <0.3x de la mediana)
- Si hay menos de 5 propiedades, confidence = "low"
- similar_indices son los indices del array de listings que son mas similares (max 5)
- Precios en Venezuela estan en USD generalmente
- Incluye 2-3 insights relevantes (ej: "El 70% de las propiedades similares tienen parqueadero")
- summary debe mencionar el precio sugerido y por que
```

### User prompt (lo que se manda con cada request)

```typescript
const userPrompt = JSON.stringify({
  user_property: {
    title: property.title,
    type: property.type,
    operation: property.operation,
    price: property.price,
    currency: property.currency,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    city: property.city,
    parking: property.parkingSpaces,
  },
  market_listings: cleanedListings, // array de CleanedListing
});
```

### Tokens estimados por request

| Componente | Tokens aprox |
|-----------|-------------|
| System prompt | ~300 |
| Propiedad del usuario | ~100 |
| 50 propiedades limpias | ~10,000 |
| Respuesta JSON | ~600 |
| **Total** | **~11,000** |

---

## 3. UI: Vercel AI SDK `useChat`

### Por que useChat y no assistant-ui

| Criterio | AI SDK useChat | assistant-ui |
|----------|---------------|-------------|
| Bundle size | ~15KB | ~100KB+ |
| Dependencias | 3 paquetes | 10+ paquetes |
| Customizacion | Tu haces el UI con Tailwind | Componentes pre-hechos |
| Streaming | Si | Si |
| Groq support | Nativo (@ai-sdk/groq) | Via AI SDK |
| Complejidad | Baja | Media-alta |
| Consistencia con Propi | Total (mismo Tailwind) | Estilos propios |

### Dependencias

```bash
npm install ai @ai-sdk/react @ai-sdk/groq
```

### Implementacion del route handler

```typescript
// src/app/api/market-analysis/route.ts
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { searchMeliProperties, cleanListings } from "@/lib/mercadolibre";
import { getProperty } from "@/server/actions/properties";
import { saveAnalysis, saveSnapshots } from "@/server/actions/market-analysis";

const SYSTEM_PROMPT = `...`; // el system prompt de arriba

export async function POST(req: Request) {
  const { propertyId } = await req.json();

  // 1. Obtener propiedad del usuario
  const property = await getProperty(propertyId);
  if (!property) return Response.json({ error: "Not found" }, { status: 404 });

  // 2. Buscar en MercadoLibre
  const rawListings = await searchMeliProperties({
    type: property.type,
    operation: property.operation,
    city: property.city,
    limit: 50,
  });

  // 3. Limpiar para reducir tokens
  const listings = cleanListings(rawListings);

  // 4. Guardar snapshot en DB
  const analysisId = await saveSnapshots(propertyId, listings);

  // 5. Stream a Groq
  const result = await streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          user_property: {
            title: property.title,
            type: property.type,
            operation: property.operation,
            price: property.price,
            currency: property.currency,
            area: property.area,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            city: property.city,
          },
          market_listings: listings,
        }),
      },
    ],
  });

  // 6. Retornar stream + listings como header para el frontend
  return result.toDataStreamResponse({
    headers: {
      "X-Analysis-Id": analysisId,
      "X-Listings": Buffer.from(JSON.stringify(listings)).toString("base64"),
    },
  });
}
```

### Implementacion del componente

```typescript
// src/components/market/analysis-chat.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { AnalysisPanel } from "./analysis-panel";
import { SimilarListings } from "./similar-listings";
import type { CleanedListing, AnalysisResult } from "@/lib/mercadolibre";

export function AnalysisChat({ propertyId }: { propertyId: string }) {
  const [listings, setListings] = useState<CleanedListing[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/market-analysis",
    body: { propertyId },
    onResponse(response) {
      // Extraer listings del header
      const encoded = response.headers.get("X-Listings");
      if (encoded) {
        setListings(JSON.parse(atob(encoded)));
      }
    },
    onFinish(message) {
      // Parsear el JSON de Groq
      try {
        setAnalysis(JSON.parse(message.content));
      } catch {}
    },
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {analysis && <AnalysisPanel analysis={analysis} />}

      {/* Cards de propiedades de MercadoLibre */}
      {listings.length > 0 && (
        <SimilarListings
          listings={listings}
          similarIndices={analysis?.similar_indices || []}
        />
      )}

      {/* Chat para preguntas de seguimiento */}
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            {m.role === "user" ? m.content : null}
            {/* El assistant message es JSON, ya parseado arriba */}
          </div>
        ))}
        {isLoading && <div className="animate-pulse">Analizando...</div>}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); /* append message */ }}>
        <input placeholder="Pregunta sobre el mercado..." />
      </form>
    </div>
  );
}
```

### Componente SimilarListingCard

```typescript
// src/components/market/similar-listing-card.tsx
import { Building2, Bed, Bath, Car, ExternalLink } from "lucide-react";
import type { CleanedListing } from "@/lib/mercadolibre";

export function SimilarListingCard({ listing }: { listing: CleanedListing }) {
  return (
    <a
      href={listing.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-2xl border border-border bg-background p-3
                 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {/* Imagen de MercadoLibre */}
      {listing.thumbnail && (
        <img
          src={listing.thumbnail}
          alt={listing.title}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />
      )}

      {/* Datos */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-foreground truncate">
          {listing.title}
        </h4>
        <p className="text-lg font-extrabold text-primary mt-0.5">
          ${listing.price.toLocaleString()} {listing.currency}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
        <p className="text-[11px] text-muted-foreground mt-1">
          {listing.neighborhood}, {listing.city}
        </p>
      </div>

      {/* Link externo */}
      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
    </a>
  );
}
```

---

## 4. Base de datos

### Tablas nuevas (Drizzle schema)

```typescript
// Agregar a src/server/schema.ts

export const marketAnalyses = pgTable("market_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  query: text("query").notNull(),                    // "apartamento los palos grandes caracas"
  source: text("source").notNull().default("mercadolibre"),
  siteId: text("site_id").notNull().default("MLV"),  // MLV, MCO, MLA, etc.
  avgPriceM2: numeric("avg_price_m2"),
  priceRange: jsonb("price_range"),                  // {min, median, max}
  totalAnalyzed: integer("total_analyzed"),
  saleVsRent: jsonb("sale_vs_rent"),                 // {sale, rent}
  userPosition: text("user_position"),               // above_market | competitive | below_market
  suggestedPrice: numeric("suggested_price"),
  suggestedPriceRange: jsonb("suggested_price_range"), // {low, high}
  confidence: text("confidence"),                    // high | medium | low
  summary: text("summary"),
  insights: jsonb("insights"),                       // ["insight1", "insight2"]
  similarIndices: jsonb("similar_indices"),           // [0, 3, 7, 12, 15]
  rawGroqResponse: jsonb("raw_groq_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketSnapshots = pgTable("market_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").references(() => marketAnalyses.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),         // "MLV123456"
  title: text("title"),
  price: numeric("price"),
  currency: text("currency"),
  areaM2: numeric("area_m2"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parking: integer("parking"),
  city: text("city"),
  neighborhood: text("neighborhood"),
  permalink: text("permalink"),
  thumbnail: text("thumbnail"),
  attributes: jsonb("attributes"),
  listingIndex: integer("listing_index"),             // posicion en el array original
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Relaciones

```typescript
// Agregar a las relations en schema.ts
export const marketAnalysesRelations = relations(marketAnalyses, ({ one, many }) => ({
  property: one(properties, {
    fields: [marketAnalyses.propertyId],
    references: [properties.id],
  }),
  snapshots: many(marketSnapshots),
}));

export const marketSnapshotsRelations = relations(marketSnapshots, ({ one }) => ({
  analysis: one(marketAnalyses, {
    fields: [marketSnapshots.analysisId],
    references: [marketAnalyses.id],
  }),
}));
```

---

## 5. Archivos nuevos

| Archivo | Funcion | Lineas aprox |
|---------|---------|-------------|
| `src/lib/mercadolibre.ts` | Client ML: OAuth2, search, cleanListings, mapeo categorias, refresh token | ~200 |
| `src/lib/groq.ts` | System prompt, tipos de respuesta | ~50 |
| `src/app/api/market-analysis/route.ts` | Route handler: ML search + Groq stream + save DB | ~80 |
| `src/app/api/auth/mercadolibre/callback/route.ts` | OAuth2 callback: intercambia code por token, guarda en DB | ~50 |
| `src/server/actions/market-analysis.ts` | Server actions: getAnalyses, getAnalysis, saveAnalysis, saveSnapshots | ~100 |
| `src/app/(app)/properties/[id]/analysis/page.tsx` | Pagina de analisis: historial + nuevo analisis | ~60 |
| `src/components/market/analysis-panel.tsx` | KPIs en cards: precio/m2, rango, posicion, sugerencia | ~80 |
| `src/components/market/analysis-chat.tsx` | Chat con useChat + renderizado de resultados | ~100 |
| `src/components/market/analysis-summary.tsx` | Texto del resumen + insights | ~40 |
| `src/components/market/similar-listing-card.tsx` | Card individual: imagen + titulo + precio + atributos + link | ~60 |
| `src/components/market/similar-listings.tsx` | Grid de SimilarListingCard (max 5 similares) | ~30 |
| `src/components/market/analysis-history.tsx` | Lista de analisis anteriores con fecha y resumen | ~50 |

**Total: ~900 lineas de codigo nuevo**

---

## 6. Env vars nuevas

```bash
# Groq (gratis en console.groq.com)
GROQ_API_KEY=gsk_...

# MercadoLibre (crear app en developers.mercadolibre.com.ve)
ML_APP_ID=123456789
ML_SECRET_KEY=abc123...
```

En Coolify: ambas como runtime only (no build time).

---

## 7. Como se ve la respuesta (UI)

### Panel completo

```
┌─────────────────────────────────────────────────┐
│ Analisis de Mercado                      [Hist] │
│ Apartamento en Los Palos Grandes, 90m2          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐│
│ │ $1,800   │ │ $150K    │ │  48    │ │ ✓     ││
│ │ USD/m2   │ │ Mediana  │ │ Props  │ │Compet ││
│ │ promedio  │ │ precio   │ │ anali- │ │itivo  ││
│ └──────────┘ └──────────┘ │ zadas  │ └───────┘│
│                            └────────┘          │
│                                                 │
│ Precio sugerido: $155,000 - $170,000 USD        │
│                                                 │
│ "Tu propiedad de 90m2 a $160K esta en rango     │
│  competitivo para Los Palos Grandes. El 70% de  │
│  las propiedades similares tienen parqueadero.   │
│  Sugerimos mantener el precio actual."           │
│                                                 │
│ Propiedades Similares                            │
│ ┌───────────────────────────────────────────────┐│
│ │ ┌──────┐ Apto 85m2 Los Palos Grandes         ││
│ │ │      │ $150,000 USD                         ││
│ │ │ IMG  │ 3 hab | 2 banos | 1 parq | Piso 5   ││
│ │ │      │ Los Palos Grandes, Caracas            ││
│ │ └──────┘ Ver en MercadoLibre ->               ││
│ ├───────────────────────────────────────────────┤│
│ │ ┌──────┐ Apto 92m2 Altamira                   ││
│ │ │      │ $180,000 USD                         ││
│ │ │ IMG  │ 3 hab | 2 banos | 2 parq | Piso 8   ││
│ │ │      │ Altamira, Caracas                     ││
│ │ └──────┘ Ver en MercadoLibre ->               ││
│ ├───────────────────────────────────────────────┤│
│ │ ┌──────┐ Apto 78m2 Chacao                     ││
│ │ │      │ $120,000 USD                         ││
│ │ │ IMG  │ 2 hab | 2 banos | 1 parq | Piso 3   ││
│ │ │      │ Chacao, Caracas                       ││
│ │ └──────┘ Ver en MercadoLibre ->               ││
│ └───────────────────────────────────────────────┘│
│                                                 │
│ Preguntas                                        │
│ ┌───────────────────────────────────────────────┐│
│ │ > Y si bajo el precio a $130K?                ││
│ │                                               ││
│ │ A $130K estarias por debajo del mercado en    ││
│ │ un 13%. Podria atraer mas compradores pero... ││
│ └───────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────┐    │
│ │ Escribe una pregunta...            [Enviar]│    │
│ └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Que viene de donde

| Elemento | Fuente | Renderizado como |
|----------|--------|-----------------|
| KPIs (precio/m2, mediana, total, posicion) | Groq calcula con datos de ML | Cards con numeros grandes |
| Precio sugerido + rango | Groq calcula | Texto destacado |
| Resumen + insights | Groq genera texto | Parrafo + lista |
| Imagen de propiedad | `thumbnail` de ML API | `<img>` con URL de mlstatic.com |
| Titulo, precio, atributos | Campos directos de ML API | Texto en la card |
| Link "Ver en MercadoLibre" | `permalink` de ML API | `<a target="_blank">` |
| Hab, banos, area, parq | `attributes` de ML API (parseados) | Iconos + numeros |
| Ciudad, barrio | `address` de ML API | Texto gris |
| Chat de seguimiento | AI SDK `useChat` + Groq streaming | Burbujas de chat |

### Flujo de datos en el frontend

```
1. Usuario click "Analizar Mercado"
       |
       v
2. useChat.append() -> POST /api/market-analysis
       |
       v
3. Route handler:
   a. getProperty(id) -> DB
   b. searchMeliProperties() -> ML API (50 results)
   c. cleanListings() -> reduce JSON
   d. saveSnapshots() -> DB
   e. streamText(groq) -> Groq API
       |
       v
4. Response llega al frontend con:
   - Header X-Listings: base64 del array de listings limpios
   - Body: stream de texto JSON de Groq
       |
       v
5. onResponse: setListings(decode(header))
   -> Renderiza SimilarListingCard con datos de ML
       |
       v
6. onFinish: setAnalysis(parse(message))
   -> Renderiza AnalysisPanel con KPIs de Groq
   -> Renderiza AnalysisSummary con texto de Groq
   -> Filtra listings por similar_indices para destacar los 5 mas similares
       |
       v
7. saveAnalysis() -> DB (para historial)
```

---

## 8. Historial de analisis

Cada analisis se guarda en DB. El usuario puede:

1. Ver lista de analisis anteriores con fecha y resumen
2. Abrir un analisis anterior y ver los mismos KPIs + cards
3. Comparar: "Hace 2 meses el m2 estaba a $1,600, ahora esta a $1,800"
4. Las cards de ML se reconstruyen desde `market_snapshots` (no se vuelve a llamar a ML)

---

## 9. Configuracion multi-pais

El sistema es configurable por pais. El `siteId` se guarda en cada analisis.

| Pais | Site ID | Auth | Estado |
|------|---------|------|--------|
| Venezuela | MLV | OAuth2 requerido | Prioridad 1 |
| Colombia | MCO | Publica (sin auth) | Futuro |
| Argentina | MLA | Publica (sin auth) | Futuro |
| Mexico | MLM | Publica (sin auth) | Futuro |

Para agregar un pais nuevo, solo se agrega el site_id y las categorias. El resto del codigo es identico.

---

## 10. Limitaciones conocidas

- ML Venezuela requiere OAuth2 (el usuario debe conectar su cuenta)
- Token de ML expira cada 6 horas (refresh automatico implementado)
- ML retorna max 1000 resultados por busqueda (paginado de 50)
- No todos los listings tienen area definida (algunos dicen "Consultar")
- Precios en Venezuela generalmente en USD
- Groq free tier: 1,000 requests/dia, 30/minuto
- El analisis depende de la calidad de los datos de ML
- No se puede obtener telefono del vendedor via API
- Las imagenes de ML son URLs externas (dependen de mlstatic.com)
