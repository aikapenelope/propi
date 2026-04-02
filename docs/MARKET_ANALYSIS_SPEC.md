# Analisis de Mercado con MercadoLibre + Groq

## Resumen

Feature que permite al agente analizar el mercado inmobiliario en tiempo real. Busca propiedades similares en MercadoLibre, las analiza con Groq (Llama 3.3), y presenta un reporte con precio promedio, comparativa, y sugerencia de precio. Los analisis se guardan en DB para consulta posterior.

---

## 1. MercadoLibre API

### Endpoints necesarios

**Busqueda publica (no requiere auth):**
```
GET https://api.mercadolibre.com.co/sites/MCO/search
  ?category={category_id}
  &q={query}
  &limit=50
  &offset=0
```

**Detalle de item (no requiere auth):**
```
GET https://api.mercadolibre.com/items/{item_id}
```

**Categorias de real estate (no requiere auth):**
```
GET https://api.mercadolibre.com/sites/MCO/categories
```

**Ubicaciones (no requiere auth):**
```
GET https://api.mercadolibre.com/classified_locations/countries/CO
GET https://api.mercadolibre.com/classified_locations/countries/CO/states
GET https://api.mercadolibre.com/classified_locations/states/{state_id}/cities
GET https://api.mercadolibre.com/classified_locations/cities/{city_id}
```

### Categorias de inmuebles en Colombia (MCO)

| Categoria | ID | Descripcion |
|-----------|-----|-------------|
| Inmuebles | MCO1459 | Categoria padre |
| Apartamentos | MCO1472 | Venta de apartamentos |
| Casas | MCO1466 | Venta de casas |
| Oficinas | MCO1473 | Venta de oficinas |
| Locales | MCO1474 | Venta de locales |
| Lotes | MCO1475 | Venta de lotes |
| Arriendo Aptos | MCO1493 | Arriendo de apartamentos |
| Arriendo Casas | MCO1492 | Arriendo de casas |

### Campos que retorna la busqueda

```json
{
  "results": [
    {
      "id": "MCO123456",
      "title": "Apartamento en Chapinero 85m2 3 hab",
      "price": 350000000,
      "currency_id": "COP",
      "permalink": "https://apartamento.mercadolibre.com.co/MCO-123456-...",
      "thumbnail": "https://mco-s2-p.mlstatic.com/...",
      "address": {
        "state_name": "Cundinamarca",
        "city_name": "Bogota D.C.",
        "neighborhood_name": "Chapinero"
      },
      "attributes": [
        { "id": "BEDROOMS", "value_name": "3" },
        { "id": "FULL_BATHROOMS", "value_name": "2" },
        { "id": "TOTAL_AREA", "value_name": "85 m²" },
        { "id": "COVERED_AREA", "value_name": "75 m²" },
        { "id": "PROPERTY_TYPE", "value_name": "Apartamento" },
        { "id": "OPERATION", "value_name": "Venta" },
        { "id": "PARKING_LOTS", "value_name": "1" },
        { "id": "MAINTENANCE_FEE", "value_name": "450000 COP" },
        { "id": "ITEM_CONDITION", "value_name": "Usado" },
        { "id": "FLOORS", "value_name": "5" }
      ],
      "location": {
        "latitude": 4.6486,
        "longitude": -74.0628
      }
    }
  ],
  "paging": { "total": 1250, "offset": 0, "limit": 50 }
}
```

### Campos que NO retorna

- Telefono del vendedor
- Email del vendedor
- Nombre real del vendedor (solo nickname)

### Rate limits

- 1500 requests/minuto (por IP para busqueda publica)
- Sin limite diario para busqueda publica
- No requiere API key para busqueda

### Mapeo Propi -> MercadoLibre

| Campo Propi | Campo MercadoLibre | Notas |
|-------------|-------------------|-------|
| type (apartment) | category MCO1472 | Mapear enum a categoria |
| type (house) | category MCO1466 | |
| operation (sale) | OPERATION: Venta | |
| operation (rent) | OPERATION: Arriendo | |
| price | price | |
| currency (COP/USD) | currency_id | |
| area | TOTAL_AREA | |
| bedrooms | BEDROOMS | |
| bathrooms | FULL_BATHROOMS | |
| parkingSpaces | PARKING_LOTS | |
| city | address.city_name | |

---

## 2. Groq API

### Modelo

**Llama 3.3 70B Versatile** (`llama-3.3-70b-versatile`)
- Context window: 131,072 tokens
- Output max: 32,768 tokens
- Velocidad: ~280 tokens/segundo
- JSON mode: soportado

### Pricing (free tier)

| Limite | Valor |
|--------|-------|
| Requests/minuto | 30 |
| Requests/dia | 1,000 |
| Tokens input/minuto | 12,000 |
| Tokens output/dia | 100,000 |
| Costo | $0 (free tier) |

Para un CRM con 5-10 usuarios, 1,000 requests/dia es mas que suficiente. Si se necesita mas, el tier de pago es $0.59/M tokens input.

### Endpoint

```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer $GROQ_API_KEY
Content-Type: application/json

{
  "model": "llama-3.3-70b-versatile",
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

### System prompt

```
Eres un analista inmobiliario experto en el mercado de Colombia.
Recibes datos de propiedades publicadas en MercadoLibre y una propiedad
del usuario. Analiza el mercado y responde SOLO en JSON con esta estructura:

{
  "avg_price_m2": number (precio promedio por m2 en COP),
  "price_range": { "min": number, "median": number, "max": number },
  "total_analyzed": number,
  "sale_vs_rent": { "sale": number, "rent": number },
  "user_position": "above_market" | "competitive" | "below_market",
  "suggested_price": number,
  "confidence": "high" | "medium" | "low",
  "summary": "string con analisis en espanol, 2-3 oraciones",
  "similar": [
    { "title": string, "price": number, "area": number, "permalink": string }
  ] (max 5 propiedades mas similares)
}

Reglas:
- Calcula precio/m2 solo con propiedades que tengan area definida
- Ignora propiedades con precios anomalos (>3x o <0.3x de la mediana)
- Si hay menos de 5 propiedades, confidence = "low"
- similar debe ordenarse por similitud (tipo, area, ubicacion)
```

### Tokens estimados por request

| Componente | Tokens |
|-----------|--------|
| System prompt | ~200 |
| Propiedad del usuario | ~100 |
| 50 propiedades de ML (limpias) | ~12,000 |
| Respuesta JSON | ~500 |
| **Total** | **~13,000** |

Con el free tier (100,000 tokens/dia output, 12,000 tokens/minuto input), puedes hacer ~8 analisis por minuto y ~75 por dia.

---

## 3. UI: Vercel AI SDK useChat vs assistant-ui

### Opcion A: Vercel AI SDK `useChat` (recomendada)

**Que es:** Un hook de React (`useChat`) que maneja streaming, estado de mensajes, y envio. 3 paquetes: `ai`, `@ai-sdk/react`, `@ai-sdk/groq`.

**Pros:**
- Liviano (~15KB)
- Ya compatible con Groq (provider oficial)
- Se integra con Next.js Server Actions / Route Handlers
- Solo necesitas el hook + tu propio UI con Tailwind
- No agrega componentes pesados, tu controlas el diseño

**Contras:**
- Tienes que hacer el UI del chat tu mismo (pero ya tienes Tailwind)

**Implementacion:**
```tsx
// API route: app/api/market-analysis/route.ts
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { propertyId, query } = await req.json();
  // 1. Buscar propiedad del usuario en DB
  // 2. Buscar en MercadoLibre
  // 3. Stream a Groq
  const result = await streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify({ property, listings }) }],
  });
  return result.toDataStreamResponse();
}

// Component: components/market/market-analysis.tsx
"use client";
import { useChat } from "@ai-sdk/react";

export function MarketAnalysis({ propertyId }) {
  const { messages, append, isLoading } = useChat({
    api: "/api/market-analysis",
    body: { propertyId },
  });
  // Render con tu propio UI de Tailwind
}
```

### Opcion B: assistant-ui

**Que es:** Libreria completa de UI para chat tipo ChatGPT. 9.1K stars, backed by Y Combinator.

**Pros:**
- UI completa out-of-the-box (streaming, markdown, code blocks, tool calls)
- Composable como shadcn/ui
- Soporta Groq via AI SDK

**Contras:**
- Pesada (~100KB+ de componentes)
- Overkill para un panel de analisis (no es un chat general)
- Agrega pnpm como dependencia (usa workspace)
- Curva de aprendizaje para customizar

### Opcion C: Sin chat, panel estatico (mas simple)

**Que es:** No hay chat. El usuario hace click en "Analizar Mercado", espera 2 segundos, y ve el resultado como un panel con cards y numeros.

**Pros:**
- Cero dependencias nuevas
- UI mas limpia para un reporte (no es una conversacion)
- Mas rapido de implementar

**Contras:**
- No hay streaming (el usuario espera hasta que Groq termine)
- No puede hacer preguntas de seguimiento

### Recomendacion

**Opcion A (AI SDK useChat)** para la primera version. Razones:
- El usuario puede pedir analisis y hacer preguntas de seguimiento ("y si bajo el precio a 300M?", "como esta el arriendo en esta zona?")
- Streaming muestra el resultado progresivamente (mejor UX en mobile)
- 3 paquetes, ~15KB, sin UI pesada
- Tu controlas el diseño con Tailwind (consistente con el resto de Propi)

---

## 4. Tablas nuevas en DB

```sql
-- Analisis de mercado guardados
CREATE TABLE market_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,                    -- "apartamento chapinero bogota"
  source TEXT NOT NULL DEFAULT 'mercadolibre',
  avg_price_m2 NUMERIC,
  price_range JSONB,                     -- {min, median, max}
  total_analyzed INTEGER,
  sale_vs_rent JSONB,                    -- {sale, rent}
  user_position TEXT,                    -- above_market | competitive | below_market
  suggested_price NUMERIC,
  confidence TEXT,                       -- high | medium | low
  summary TEXT,                          -- explicacion de Groq
  similar_listings JSONB,               -- [{title, price, area, permalink}]
  raw_groq_response JSONB,             -- respuesta completa para debug
  created_at TIMESTAMP DEFAULT NOW()
);

-- Snapshot de propiedades de MercadoLibre usadas en el analisis
CREATE TABLE market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES market_analyses(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,             -- "MCO123456"
  title TEXT,
  price NUMERIC,
  currency TEXT,
  area_m2 NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  city TEXT,
  neighborhood TEXT,
  permalink TEXT,
  thumbnail TEXT,
  attributes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Archivos nuevos

| Archivo | Funcion |
|---------|---------|
| `src/lib/mercadolibre.ts` | Wrapper de la API de MercadoLibre: search, getItem, getCategories, mapeo de categorias |
| `src/lib/groq.ts` | Client de Groq con system prompt, JSON mode, manejo de errores |
| `src/app/api/market-analysis/route.ts` | Route handler: recibe propertyId, busca en ML, llama a Groq, guarda en DB, stream response |
| `src/server/actions/market-analysis.ts` | Server actions: getAnalyses, getAnalysis (para historial) |
| `src/app/(app)/properties/[id]/analysis/page.tsx` | Pagina de analisis con chat y resultados |
| `src/components/market/analysis-panel.tsx` | Panel con KPIs: precio/m2, rango, posicion, sugerencia |
| `src/components/market/analysis-chat.tsx` | Chat con useChat para preguntas de seguimiento |
| `src/components/market/similar-listings.tsx` | Cards de propiedades similares con link a ML |

---

## 6. Env vars nuevas

```
GROQ_API_KEY=gsk_...          # Gratis en console.groq.com
```

Solo una. MercadoLibre no necesita API key para busqueda publica.

---

## 7. Dependencias nuevas

```
npm install ai @ai-sdk/react @ai-sdk/groq
```

3 paquetes. ~15KB total en el bundle del cliente.

---

## 8. Flujo completo

```
1. Usuario abre /properties/[id]/analysis
2. Ve historial de analisis anteriores (si hay)
3. Click "Nuevo Analisis" o escribe en el chat
4. Server action:
   a. Lee la propiedad de DB (tipo, precio, area, ciudad)
   b. Mapea tipo a categoria de MercadoLibre
   c. GET api.mercadolibre.com.co/sites/MCO/search?category=MCO1472&q=apartamento+chapinero&limit=50
   d. Limpia el JSON (quita campos innecesarios, normaliza)
   e. Guarda snapshot en market_snapshots
   f. Manda a Groq: propiedad + 50 listings + system prompt
   g. Groq responde en JSON (streaming)
   h. Guarda analisis en market_analyses
   i. Retorna al frontend via stream
5. Frontend muestra:
   - Panel con KPIs (precio/m2, rango, posicion, sugerencia)
   - Lista de 5 propiedades similares con link a ML
   - Resumen en texto
   - Chat para preguntas de seguimiento
6. El analisis queda guardado en DB para consulta posterior
```

---

## 9. Cuentas necesarias

| Servicio | Que necesitas | Costo | Tiempo |
|----------|--------------|-------|--------|
| Groq | Cuenta en console.groq.com, generar API key | Gratis | 2 min |
| MercadoLibre | Nada (API publica para busqueda) | Gratis | 0 min |

---

## 10. Limitaciones conocidas

- MercadoLibre retorna max 1000 resultados por busqueda (paginado de 50)
- No todos los listings tienen area definida (algunos dicen "Consultar")
- Precios pueden estar en USD o COP (hay que normalizar)
- Groq free tier: 1,000 requests/dia, 30/minuto
- El analisis depende de la calidad de los datos de ML (algunos listings tienen datos incompletos)
- No se puede obtener telefono del vendedor via API
