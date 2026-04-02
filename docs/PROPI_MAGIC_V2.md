# Propi Magic v2 - Rediseno

## Vision

Propi Magic no es un boton de analisis por propiedad. Es un sistema de inteligencia de mercado con 3 componentes:

1. **Chat** - Interfaz tipo ChatGPT donde el agente busca propiedades en lenguaje natural
2. **Base de datos centralizada** - Todas las propiedades de MercadoLibre se guardan en Propi como single source of truth
3. **Dashboard de KPIs** - Metricas del mercado calculadas desde la DB centralizada

---

## 1. Chat (Propi Magic)

### Como funciona

El agente abre Propi Magic en el sidebar y ve un chat. Escribe en lenguaje natural:

```
"Busca apartamentos en Los Palos Grandes de 80-100m2"
"Cuanto cuesta el m2 en Altamira?"
"Muestra casas en venta en Barquisimeto de menos de $100K"
"Compara mi apartamento de Chapinero con el mercado"
```

### Flujo

```
Agente escribe: "Apartamentos en Los Palos Grandes 80-100m2"
    |
    v
Groq interpreta la intencion y extrae parametros:
  { type: "apartment", city: "Caracas", neighborhood: "Los Palos Grandes",
    area_min: 80, area_max: 100, operation: "sale" }
    |
    v
Server busca en MercadoLibre con esos parametros
    |
    v
Propiedades se guardan en DB (market_listings)
    |
    v
Groq analiza y genera resumen
    |
    v
Frontend muestra:
  - Resumen en texto (streaming)
  - Cards de propiedades con imagen/precio/link (del JSON de ML)
  - KPIs inline (precio promedio, rango, total)
    |
    v
Agente puede hacer follow-up:
  "Y si busco de 100-120m2?"
  "Cuales tienen parqueadero?"
  "Compara con mi propiedad X"
```

### UI del chat

```
┌─────────────────────────────────────────────────┐
│ ✨ Propi Magic                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👤 Busca apartamentos en Los Palos Grandes      │
│    de 80-100m2                                  │
│                                                 │
│ 🤖 Encontre 48 apartamentos en Los Palos        │
│    Grandes entre 80-100m2. El precio promedio   │
│    es $1,800/m2. Rango: $120K - $220K USD.      │
│                                                 │
│    ┌──────────────────────────────────────┐     │
│    │ [IMG] Apto 85m2 Los Palos Grandes   │     │
│    │       $150,000 USD | 3 hab | 2 ban  │     │
│    │       Ver en MercadoLibre ->        │     │
│    ├──────────────────────────────────────┤     │
│    │ [IMG] Apto 92m2 Los Palos Grandes   │     │
│    │       $180,000 USD | 3 hab | 2 ban  │     │
│    │       Ver en MercadoLibre ->        │     │
│    ├──────────────────────────────────────┤     │
│    │ [IMG] Apto 88m2 Los Palos Grandes   │     │
│    │       $165,000 USD | 2 hab | 2 ban  │     │
│    │       Ver en MercadoLibre ->        │     │
│    └──────────────────────────────────────┘     │
│    + 45 propiedades mas guardadas               │
│                                                 │
│ 👤 Cuales tienen parqueadero?                   │
│                                                 │
│ 🤖 De las 48, 35 tienen parqueadero (73%).      │
│    Las que tienen parqueadero cuestan en         │
│    promedio $12K mas que las que no.             │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Busca propiedades, analiza mercado... [->]│   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

Las cards de propiedades se renderizan como componentes React dentro del chat, no como texto. El LLM genera el analisis, las cards vienen del JSON de ML.

---

## 2. Base de datos centralizada (market_listings)

### Concepto

Cada vez que Propi Magic busca en MercadoLibre, las propiedades se guardan en una tabla `market_listings`. No se borran. Se acumulan. Esto crea un dataset propio del CRM que crece con el uso.

### Tabla

```sql
market_listings
  id              UUID PK
  external_id     TEXT NOT NULL UNIQUE  -- "MLV123456" (dedup por external_id)
  source          TEXT DEFAULT 'mercadolibre'
  site_id         TEXT DEFAULT 'MLV'
  title           TEXT
  price           NUMERIC
  currency        TEXT
  area_m2         NUMERIC
  bedrooms        INTEGER
  bathrooms       INTEGER
  parking         INTEGER
  property_type   TEXT                  -- apartment, house, office, etc.
  operation       TEXT                  -- sale, rent
  city            TEXT
  state           TEXT
  neighborhood    TEXT
  address         TEXT
  latitude        NUMERIC
  longitude       NUMERIC
  condition       TEXT                  -- new, used
  permalink       TEXT
  thumbnail       TEXT
  seller_nickname TEXT
  published_at    TIMESTAMP             -- start_time de ML
  last_seen_at    TIMESTAMP DEFAULT NOW() -- ultima vez que ML lo retorno
  attributes      JSONB                 -- todos los atributos raw de ML
  first_fetched   TIMESTAMP DEFAULT NOW()
  created_at      TIMESTAMP DEFAULT NOW()
```

### Deduplicacion

Si la misma propiedad (mismo `external_id`) aparece en otra busqueda, se actualiza `last_seen_at` y `price` (por si cambio). No se duplica.

### Filtro de antiguedad

La API de ML no tiene filtro directo de fecha de publicacion. Pero cada item tiene `start_time`. La estrategia:

1. Buscar con `sort=relevance` (ML prioriza listings recientes)
2. Al guardar, registrar `published_at` desde `start_time` del item
3. En los KPIs, filtrar por `published_at > NOW() - INTERVAL '12 months'`
4. Opcionalmente, marcar listings con `last_seen_at` viejo como "posiblemente inactivo"

### Filtros disponibles en la API de ML

La API retorna `available_filters` dinamicos por categoria. Para inmuebles:

| Filtro | Parametro | Ejemplo |
|--------|-----------|---------|
| Precio min/max | `price=100000-200000` | Rango de precio |
| Habitaciones | `BEDROOMS=3` | Numero exacto |
| Banos | `FULL_BATHROOMS=2` | Numero exacto |
| Area | `TOTAL_AREA=80-100` | Rango de m2 |
| Tipo operacion | `OPERATION=Venta` | Venta o Arriendo |
| Tipo propiedad | `PROPERTY_TYPE=Apartamento` | Tipo |
| Parqueadero | `PARKING_LOTS=1` | Con parqueadero |
| Condicion | `ITEM_CONDITION=Usado` | Nuevo o Usado |
| Ordenar | `sort=price_asc` | price_asc, price_desc, relevance |
| Ubicacion | `state=DC` | Por estado |

Groq extrae estos parametros del lenguaje natural del usuario y los pasa a la API.

---

## 3. Dashboard de KPIs (pagina separada)

### Pagina: /market-insights

KPIs calculados desde `market_listings` (la DB centralizada):

| KPI | Query | Visualizacion |
|-----|-------|--------------|
| Precio promedio/m2 por zona | `AVG(price/area) WHERE neighborhood = X AND published_at > 12 meses` | Tabla por zona |
| Rango de precios por tipo | `MIN, MEDIAN, MAX(price) GROUP BY property_type` | Cards |
| Inventario por tipo | `COUNT(*) GROUP BY property_type` | Barras |
| Venta vs Arriendo | `COUNT(*) GROUP BY operation` | Donut |
| Propiedades nuevas (ultimo mes) | `COUNT(*) WHERE first_fetched > 30 dias` | Numero |
| Zonas mas caras | `AVG(price/area) GROUP BY neighborhood ORDER BY DESC LIMIT 10` | Ranking |
| Tendencia de precios | `AVG(price) GROUP BY month` (requiere datos historicos) | Linea |
| Total propiedades en DB | `COUNT(*)` | Numero grande |

### Moat

Mientras mas busquedas haga el agente en Propi Magic, mas datos se acumulan en `market_listings`. Eso hace que los KPIs sean mas precisos y que el CRM tenga mas valor. Ningun otro CRM inmobiliario en Venezuela tiene esta data centralizada.

---

## 4. Estructura del sidebar

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

## 5. Cambios vs implementacion actual

| Aspecto | Actual (Sprint 1-3) | Nuevo (v2) |
|---------|-------------------|------------|
| UI | Panel con selector de propiedad | Chat tipo ChatGPT |
| Datos | Se guardan por analisis (snapshots) | Se guardan como tabla centralizada (market_listings) |
| KPIs | Inline en el analisis | Pagina separada /market-insights |
| Busqueda | Automatica por tipo/ciudad | Natural language via Groq |
| Filtros ML | Solo categoria | Precio, area, habitaciones, banos, parking, sort |
| Historial | Por propiedad | Conversaciones de chat |
| Sidebar | "Propi Magic" (una pagina) | "Propi Magic" (chat) + "Market Insights" (KPIs) |
| Moat | Datos se pierden entre analisis | Datos se acumulan, KPIs mejoran con el uso |

---

## 6. Complejidad estimada

| Sprint | Contenido | Esfuerzo |
|--------|----------|----------|
| Sprint 4 | Tabla market_listings + dedup + ingesta desde ML con filtros | Medio |
| Sprint 5 | Chat UI con useChat + Groq extrae parametros + cards en el chat | Alto |
| Sprint 6 | Market Insights page con KPIs desde market_listings | Medio |
