# Plan de Implementacion: Analisis de Mercado

## Mejores practicas de produccion identificadas

### MercadoLibre
- Tokens en body (no query params) para OAuth
- Parametro `state` random en OAuth para prevenir CSRF
- `redirect_uri` debe ser exacta a la registrada en la app
- Access token en header `Authorization: Bearer` en TODAS las requests
- Token expira en 6h, refresh automatico antes de expirar
- Rate limit: 1500 req/min, manejar 429 con retry + backoff
- Validar origen de notificaciones/webhooks

### Groq
- Usar `response_format: { type: "json_object" }` (best-effort mode, compatible con Llama 3.3)
- Strict mode solo disponible para GPT-OSS, no para Llama
- Manejar 429 con `retry-after` header
- Leer headers `x-ratelimit-remaining-requests` y `x-ratelimit-remaining-tokens` para throttling proactivo
- Tokens cacheados no cuentan contra rate limit (usar system prompt consistente)
- Manejar 422 (hallucination/semantic error) con retry
- Free tier: 30 RPM, 1000 RPD, 12K TPM para Llama 3.3 70B

### Vercel AI SDK
- Usar `streamText` (no `generateText`) para UX progresiva
- Manejar abort signals para cancelacion
- Error handling: 429 del provider, network errors, JSON parse errors
- No usar edge runtime (incompatible con algunos providers)
- Separar datos estructurados (listings) del stream (analisis)

### Base de datos
- Indices en `property_id` y `created_at` para queries de historial
- JSONB para campos flexibles (price_range, insights, attributes)
- CASCADE delete: si se borra la propiedad, se borran sus analisis
- No guardar el JSON completo de ML en la tabla de analisis (va en snapshots)

---

## Plan de implementacion (10 TODOs)

### TODO 1: Schema DB + migracion
- Agregar `marketAnalyses` y `marketSnapshots` a `schema.ts`
- Agregar relaciones
- Deploy para que entrypoint corra `drizzle-kit push`
- Validar: tablas creadas en DB

### TODO 2: Lib MercadoLibre (`src/lib/mercadolibre.ts`)
- Client con OAuth2: authorize URL, token exchange, refresh
- `searchProperties(params)`: busca en ML con auth
- `cleanListings(raw)`: limpia JSON para reducir tokens
- `mapCategoryFromPropi(type, operation)`: mapea enum a categoria MLV
- Manejo de errores: 401 (refresh token), 429 (retry con backoff), 403 (token revocado)
- Tipos TypeScript para MeliSearchResult, CleanedListing

### TODO 3: OAuth2 callback route (`src/app/api/auth/mercadolibre/callback/route.ts`)
- Recibe `code` y `state` de ML
- Valida `state` contra session
- Intercambia code por tokens via POST /oauth/token
- Guarda access_token, refresh_token, expires_at en `social_accounts` (platform: "mercadolibre")
- Redirige a /marketing/settings con mensaje de exito

### TODO 4: UI de conexion ML en Settings
- Boton "Conectar MercadoLibre" en `/marketing/settings`
- Muestra estado: conectado/desconectado
- Si conectado: muestra nickname, boton desconectar
- Reutilizar patron existente de social_accounts (como Meta)

### TODO 5: Lib Groq + system prompt (`src/lib/groq.ts`)
- System prompt completo con reglas y estructura JSON
- Tipos TypeScript para AnalysisResult
- Funcion `buildUserPrompt(property, listings)`: construye el prompt
- Validacion de respuesta JSON con fallback

### TODO 6: Route handler (`src/app/api/market-analysis/route.ts`)
- Recibe propertyId
- Obtiene propiedad de DB
- Obtiene token de ML de social_accounts
- Busca en ML (50 propiedades)
- Limpia listings
- Guarda snapshots en DB
- Stream a Groq via AI SDK
- Guarda analisis en DB al terminar
- Headers con listings para el frontend
- Error handling: ML sin conectar, ML rate limit, Groq rate limit, propiedad no encontrada

### TODO 7: Server actions para historial (`src/server/actions/market-analysis.ts`)
- `getAnalyses(propertyId)`: lista de analisis con fecha y resumen
- `getAnalysis(analysisId)`: analisis completo con snapshots
- `saveAnalysis(data)`: guarda resultado de Groq
- `saveSnapshots(analysisId, listings)`: guarda propiedades de ML

### TODO 8: Componentes UI
- `AnalysisPanel`: 4 KPI cards (precio/m2, mediana, total, posicion)
- `AnalysisSummary`: texto + insights + precio sugerido
- `SimilarListingCard`: card con imagen ML + titulo + precio + atributos + link
- `SimilarListings`: grid de cards (5 similares destacados + resto)
- `AnalysisChat`: useChat con input + mensajes + loading state
- `AnalysisHistory`: lista de analisis anteriores

### TODO 9: Pagina de analisis (`src/app/(app)/properties/[id]/analysis/page.tsx`)
- Layout: historial a la izquierda (desktop) / arriba (mobile)
- Panel de resultados + cards + chat
- Boton "Nuevo Analisis" que dispara el primer mensaje
- Loading skeleton mientras Groq responde
- Link desde el detalle de propiedad ("Analizar Mercado")
- Solo web (no aparece en mobile bottom nav, accesible desde detalle)

### TODO 10: Instalar deps, env vars, validar, deploy
- `npm install ai @ai-sdk/react @ai-sdk/groq`
- Agregar `GROQ_API_KEY`, `ML_APP_ID`, `ML_SECRET_KEY` en Coolify
- Agregar dominio de imagenes ML en `next.config.ts` remotePatterns
- TypeScript + ESLint clean
- Deploy + verificar entrypoint crea tablas nuevas
- Test end-to-end: conectar ML, analizar propiedad, ver cards, hacer pregunta
