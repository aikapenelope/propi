# Propi Magic v3 - Plan Final

## Principios

1. **KPIs = SQL puro.** Nunca un LLM calcula precios. Los numeros vienen de queries a PostgreSQL.
2. **LLM = interpretacion + texto.** Groq interpreta lenguaje natural y genera resumenes. No calcula.
3. **Cron job simple.** No Prefect, no pipeline complejo. Un API route + cron del sistema.
4. **Stack existente.** Next.js + PostgreSQL + Hetzner. No se agrega infraestructura nueva.

---

## Arquitectura

```
                    ┌─────────────────┐
                    │  MercadoLibre   │
                    │  API (MLV)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         Cron (diario)   Chat (on-demand)  │
              │              │              │
              v              v              │
        ┌─────────────────────────┐        │
        │   market_listings       │        │
        │   (PostgreSQL)          │        │
        │   Single Source of Truth│        │
        └────────┬────────────────┘        │
                 │                         │
        ┌────────┼────────┐               │
        │        │        │               │
   KPIs (SQL)  Chat    Cards             │
   /market-    /propi-  (React)          │
   insights    magic                     │
```

---

## Sprint 4: Tabla market_listings + cron job de ingesta

### Tabla market_listings (reemplaza market_snapshots)

```
market_listings
  id              UUID PK
  external_id     TEXT UNIQUE NOT NULL   -- "MLV123456"
  source          TEXT DEFAULT 'mercadolibre'
  site_id         TEXT DEFAULT 'MLV'
  title           TEXT
  price           NUMERIC
  currency        TEXT
  area_m2         NUMERIC
  bedrooms        INTEGER
  bathrooms       INTEGER
  parking         INTEGER
  property_type   TEXT
  operation       TEXT
  city            TEXT
  state           TEXT
  neighborhood    TEXT
  latitude        NUMERIC
  longitude       NUMERIC
  condition       TEXT
  permalink       TEXT
  thumbnail       TEXT
  seller_nickname TEXT
  published_at    TIMESTAMP              -- start_time de ML
  last_seen_at    TIMESTAMP DEFAULT NOW()
  attributes      JSONB
  created_at      TIMESTAMP DEFAULT NOW()

  INDICES:
  - external_id (UNIQUE)
  - city, neighborhood
  - property_type, operation
  - published_at
  - price
```

### Cron job: /api/cron/sync-market

```
Cada dia a las 6am (via cron de Coolify o sistema):
  1. Para cada categoria (aptos venta, casas venta, aptos alquiler, casas alquiler):
     a. GET /sites/MLV/search?category=X&sort=relevance&limit=50&offset=0
     b. Paginar hasta offset=1000 (20 paginas x 50 = 1000 listings por categoria)
     c. Para cada listing:
        - Si external_id existe: UPDATE last_seen_at, price (si cambio)
        - Si no existe: INSERT
        - Si published_at > 12 meses: SKIP
  2. Total: ~4000-8000 listings por sync
  3. Tiempo estimado: 2-3 minutos
  4. Rate limit: 1500 req/min (sobra)
```

Proteccion: API route protegida con un secret header (`CRON_SECRET`).

### Configuracion en Coolify

En Coolify > Scheduled Tasks (o cron del App Plane):
```
0 6 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market
```

---

## Sprint 5: Chat (Propi Magic)

### Flujo del chat

```
Usuario: "Apartamentos en Altamira de 80-100m2"
    |
    v
Route handler /api/chat/market:
  1. Manda mensaje a Groq con tool_use:
     - Tool "search_market": busca en market_listings (SQL)
     - Tool "search_mercadolibre": busca en ML API (si no hay datos locales)
  2. Groq decide que tool usar
  3. Si usa search_market: query SQL a market_listings
  4. Si usa search_mercadolibre: llama a ML API, guarda en market_listings, retorna
  5. Groq genera resumen con los datos
  6. Frontend renderiza: texto + cards de propiedades
```

### Por que tools y no prompt directo

Groq con tool_use puede:
- Decidir si buscar en DB local o en ML API
- Extraer parametros estructurados (tipo, ciudad, area_min, area_max)
- Hacer multiples busquedas en una conversacion
- El LLM nunca ve los datos crudos de precio - solo recibe los resultados de SQL

### UI del chat

- `useChat` de AI SDK con streaming
- Cards de propiedades renderizadas como componentes React (no texto)
- Las cards vienen del JSON de market_listings, no del LLM
- Input con placeholder "Busca propiedades, analiza mercado..."

---

## Sprint 6: Market Insights (KPIs)

### Pagina /market-insights

Todos los KPIs son queries SQL a market_listings. No LLM.

### KPIs

| KPI | Query SQL | Frecuencia |
|-----|-----------|-----------|
| Precio promedio/m2 por zona | `AVG(price/area_m2) WHERE area_m2 > 0 GROUP BY neighborhood` | Tiempo real |
| Rango de precios por tipo | `MIN(price), PERCENTILE_CONT(0.5), MAX(price) GROUP BY property_type` | Tiempo real |
| Inventario por tipo | `COUNT(*) GROUP BY property_type` | Tiempo real |
| Venta vs Arriendo | `COUNT(*) GROUP BY operation` | Tiempo real |
| Nuevas esta semana | `COUNT(*) WHERE created_at > NOW() - '7 days'` | Tiempo real |
| Zonas mas caras (top 10) | `AVG(price/area_m2) GROUP BY neighborhood ORDER BY DESC LIMIT 10` | Tiempo real |
| Total propiedades en DB | `COUNT(*)` | Tiempo real |
| Propiedades activas (<12 meses) | `COUNT(*) WHERE published_at > NOW() - '12 months'` | Tiempo real |

### Analisis semanal (opcional, fase 2)

Si quieres un reporte semanal generado:
- Un cron que corre 2 veces por semana (lunes y jueves)
- Ejecuta las queries SQL de arriba
- Guarda los resultados en una tabla `market_reports`
- La pagina de Market Insights muestra el ultimo reporte + datos en tiempo real
- NO usa LLM para calcular. Solo SQL.
- Opcionalmente, Groq genera un parrafo de resumen del reporte (texto, no numeros)

---

## Sidebar final

```
CRM
  Dashboard
  Contactos
  Propiedades
  Calendario
  Documentos

Inteligencia
  ✨ Propi Magic (chat)
  📊 Market Insights (KPIs)

Marketing
  Inbox
  Instagram
  Facebook
  Email
  TikTok
  Configuracion
```

---

## Resumen de sprints

| Sprint | Contenido | Archivos | Esfuerzo |
|--------|----------|----------|----------|
| 4 | Tabla market_listings + cron job de ingesta diaria | schema.ts, /api/cron/sync-market, server actions | Medio |
| 5 | Chat Propi Magic con tool_use + cards | /api/chat/market, components/market/*, page | Alto |
| 6 | Market Insights con KPIs SQL | /market-insights page, server actions, components | Medio |

---

## Env vars nuevas

```
GROQ_API_KEY=gsk_...           # Ya existe del Sprint 2
ML_APP_ID=...                  # Ya existe del Sprint 1
ML_SECRET_KEY=...              # Ya existe del Sprint 1
CRON_SECRET=random-string      # Para proteger el endpoint del cron
```
