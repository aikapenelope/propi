# Sistema MercadoLibre en Propi — Guia de Operacion y Mantenimiento

> Ultima actualizacion: Mayo 2026

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTORIZACION (una sola vez, manual)                            │
│                                                                 │
│  Admin abre URL de Chile → ML redirige a callback de Propi →   │
│  callback guarda token en service_credentials (plataforma)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SYNC DIARIO (automatico, sin intervencion)                     │
│                                                                 │
│  Cron → /api/cron/sync-market → encola job en BullMQ →         │
│  Worker lee token de service_credentials →                      │
│  Si expiro: refresh automatico (guarda nuevo token) →           │
│  Descarga 6 categorias de MLV → Guarda en market_listings       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONSULTA (todos los tenants, sin token)                        │
│                                                                 │
│  Usuario pregunta en Propi Magic → SQL sobre market_listings →  │
│  KPIs (avg, median, min, max, precio/m2) → Groq resume         │
└─────────────────────────────────────────────────────────────────┘
```

## Datos Clave de la API de MercadoLibre

| Concepto | Valor | Fuente |
|----------|-------|--------|
| Access token duracion | 6 horas | docs oficiales |
| Refresh token duracion | 6 meses (single-use) | docs oficiales |
| Refresh token es single-use | SI — una vez usado, se invalida | docs oficiales |
| Grant types disponibles | `authorization_code` y `refresh_token` SOLAMENTE | docs oficiales |
| Client credentials | NO EXISTE en ML | docs oficiales |
| Invalidacion por inactividad | 4 meses sin requests a api.mercadolibre.com | docs oficiales |
| Offset maximo (con token) | ~4000 items por busqueda | comunidad |
| Offset maximo (sin token) | 1000 items por busqueda | docs oficiales |
| Rate limit | 429 con header retry-after | docs oficiales |
| Endpoint de busqueda | `/sites/MLV/search?category=XXX` | docs oficiales |
| PKCE | Depende de config de la app (debe estar OFF) | docs oficiales |

## Procedimiento de Autorizacion (Paso a Paso)

### Pre-requisitos

1. **App creada en ML Chile** (developers.mercadolibre.cl)
2. **PKCE deshabilitado** en la configuracion de la app
3. **Redirect URI** registrado exactamente como: `https://propi.aikalabs.cc/api/auth/mercadolibre/callback`
4. **Migracion 0009 aplicada** en la DB (tabla `service_credentials` existe)
5. **Deploy actual** en Coolify tiene el codigo del PR #158 (callback guarda en `service_credentials`)
6. **Worker corriendo** como servicio separado en Coolify

### Checklist Pre-Autorizacion

- [ ] Verificar que la tabla `service_credentials` existe: `SELECT * FROM service_credentials;`
- [ ] Verificar que el servicio de Propi esta corriendo (no en deploy)
- [ ] Verificar que `ML_APP_ID` y `ML_SECRET_KEY` estan configurados en Coolify
- [ ] Verificar que el worker esta corriendo: revisar logs en Coolify
- [ ] **IMPORTANTE**: Estar logueado en Propi (Clerk) antes de hacer el OAuth

### Paso a Paso

1. **Logueate en Propi** (https://propi.aikalabs.cc) con tu cuenta de Clerk. ESTO ES OBLIGATORIO porque el callback usa `auth()` de Clerk para obtener el userId.

2. **Abre esta URL en el mismo navegador** (reemplaza `$APP_ID` con tu ML_APP_ID):
   ```
   https://auth.mercadolibre.cl/authorization?response_type=code&client_id=$APP_ID&redirect_uri=https://propi.aikalabs.cc/api/auth/mercadolibre/callback
   ```

3. **ML te pide login** con tu cuenta de ML Chile. Autoriza la app.

4. **ML te redirige** a `https://propi.aikalabs.cc/api/auth/mercadolibre/callback?code=TG-XXXXX`

5. **El callback automaticamente**:
   - Intercambia el code por access_token + refresh_token
   - Guarda en `social_accounts` (per-user, backward compat)
   - Guarda en `service_credentials` (plataforma, usado por el worker)
   - Te redirige a `/marketing/settings?ml_success=true`

6. **Verificar que funciono**:
   ```sql
   SELECT service, token_expires_at, updated_at FROM service_credentials WHERE service = 'mercadolibre';
   ```
   Debe mostrar un `token_expires_at` ~6 horas en el futuro.

7. **Disparar sync manualmente** (opcional, para probar):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market
   ```

8. **Verificar que el worker indexo**:
   ```sql
   SELECT COUNT(*) FROM market_listings;
   SELECT city, COUNT(*) FROM market_listings GROUP BY city ORDER BY count DESC LIMIT 10;
   ```

### Checklist Post-Autorizacion

- [ ] `service_credentials` tiene row con `service='mercadolibre'`
- [ ] `token_expires_at` es ~6h en el futuro
- [ ] `refresh_token` NO es NULL
- [ ] Worker logs muestran "Token valid" y empieza a sincronizar
- [ ] `market_listings` tiene rows nuevos

## Por que fallo la vez anterior (error 403)

### Lo que paso:

1. Hiciste OAuth → callback guardo token en `social_accounts` (per-user)
2. El callback NO guardo en `service_credentials` porque:
   - La migracion 0009 no estaba aplicada, O
   - El deploy no tenia el codigo del PR #158
3. Copiaste manualmente el token de `social_accounts` a `service_credentials` con SQL
4. Pero entre el OAuth y la copia manual, el sistema per-user (`getMeliToken()`) ya habia usado el refresh_token para renovar el access_token
5. El refresh_token de ML es **single-use** — una vez usado, se invalida permanentemente
6. El worker intento refrescar con el refresh_token copiado (ya invalidado) → ML respondio 403

### Por que manana sera diferente:

- El deploy actual YA tiene el codigo del PR #158
- La migracion 0009 YA esta aplicada
- El callback guardara DIRECTAMENTE en `service_credentials` con tokens frescos
- No necesitas copiar nada manualmente
- El refresh_token en `service_credentials` sera el original, no una copia vieja

### Regla de oro:

> **NUNCA copies tokens manualmente entre tablas.** El refresh_token es single-use.
> Si necesitas re-autorizar, haz el flujo OAuth completo de nuevo.

## Mantenimiento del Token

### Renovacion automatica (no requiere accion)

El worker renueva el token automaticamente cada vez que corre:
1. Lee `service_credentials`
2. Si `token_expires_at < now` → usa `refresh_token` para obtener nuevo par
3. Guarda el nuevo `access_token` + `refresh_token` + `token_expires_at`
4. Procede con el sync

Esto funciona indefinidamente siempre que:
- El cron corra al menos 1 vez cada 4 meses (evita invalidacion por inactividad)
- Nadie cambie el password de la cuenta ML Chile
- Nadie regenere el App Secret en el panel de ML
- Nadie revoque permisos de la app desde ML

### Cuando necesitas re-autorizar manualmente

| Situacion | Solucion |
|-----------|----------|
| Worker da 403 persistente | Re-autorizar (paso a paso arriba) |
| Refresh token expiro (6 meses sin uso) | Re-autorizar |
| Cambiaste password de ML Chile | Re-autorizar |
| Regeneraste App Secret | Re-autorizar + actualizar `ML_SECRET_KEY` en Coolify |
| Cron no corrio por 4+ meses | Re-autorizar |

### Como saber si el token esta sano

```sql
SELECT
  service,
  CASE
    WHEN token_expires_at > NOW() THEN 'ACTIVO'
    WHEN refresh_token IS NOT NULL THEN 'EXPIRADO (se renueva solo)'
    ELSE 'MUERTO (re-autorizar)'
  END as estado,
  token_expires_at,
  updated_at
FROM service_credentials
WHERE service = 'mercadolibre';
```

## Volumen de Datos

### Que descarga el worker por ejecucion

| Categoria | ID ML | Items aprox en MLV |
|-----------|-------|-------------------|
| Apartamento Venta | MLV1472 | ~73,000 |
| Casa Venta | MLV1466 | ~39,000 |
| Oficina Venta | MLV1473 | ~13,600 |
| Local Venta | MLV1474 | ~22,000 |
| Apartamento Alquiler | MLV1493 | ~7,000 |
| Casa Alquiler | MLV1492 | ~5,000 |

**Limite por ejecucion:** ~1000 items por categoria (20 paginas x 50 items), total ~6000 items nuevos/actualizados por dia.

**Acumulacion:** Con el tiempo la tabla crece. Despues de 30 dias tendras ~50K-100K listings unicos (muchos se repiten entre dias).

### Deduplicacion

`external_id` tiene constraint UNIQUE. Si ML devuelve el mismo listing dos veces:
- Primera vez: INSERT
- Siguientes: UPDATE (`lastSeenAt`, `price`, `thumbnail`)

No hay duplicados posibles.

### Deteccion de vendidos/deslistados

Actualmente no hay campo `status`. Se infiere por `lastSeenAt`:
- `lastSeenAt` reciente (< 7 dias) = activo
- `lastSeenAt` viejo (> 7 dias) = probablemente vendido/deslistado

Las queries de Propi Magic ya priorizan por `lastSeenAt DESC`.

## Indices y Performance

```sql
-- Indices existentes en market_listings:
market_listings_external_idx    (external_id)           -- dedup lookup
market_listings_type_op_idx     (property_type, operation)  -- filtro basico
market_listings_city_hood_idx   (city, neighborhood)    -- busqueda por zona
market_listings_published_idx   (published_at)          -- filtro temporal
market_listings_price_idx       (price)                 -- rango de precios
market_listings_kpi_idx         (city, property_type, operation, neighborhood)  -- KPIs
```

Para ~100K rows estos indices son mas que suficientes. No necesitas particionamiento ni optimizaciones adicionales hasta ~1M rows.

## Troubleshooting

### Worker da 403

**Causa:** Token invalido (expirado + refresh_token ya usado o expirado).
**Solucion:** Re-autorizar via OAuth (paso a paso arriba).

### Worker da 401

**Causa:** Access token expirado y refresh fallo.
**Solucion:** Verificar que `refresh_token` en `service_credentials` no es NULL. Si es NULL, re-autorizar.

### Worker da 429

**Causa:** Rate limit de ML.
**Solucion:** El worker ya maneja esto automaticamente (espera `retry-after` segundos). Si persiste, reducir `MAX_PAGES` o espaciar el cron.

### Callback redirige con `ml_error=not_authenticated`

**Causa:** No estabas logueado en Propi (Clerk) cuando hiciste el OAuth.
**Solucion:** Logueate en Propi PRIMERO, luego abre la URL de autorizacion de ML.

### Callback redirige con `ml_error=token_exchange`

**Causa:** El code de ML expiro (dura ~10 min) o el `redirect_uri` no coincide exactamente.
**Solucion:** Verificar que `redirect_uri` en la URL de auth es identico al registrado en la app de ML. Intentar de nuevo rapido.

### `service_credentials` esta vacia despues del OAuth

**Causa:** La migracion 0009 no esta aplicada o el deploy no tiene el codigo del PR #158.
**Solucion:**
```bash
# Verificar migracion
psql $DATABASE_DIRECT_URL -c "SELECT * FROM service_credentials;"
# Si da error "relation does not exist":
cd /app && npx drizzle-kit migrate
```

### market_listings no crece

**Causa:** Worker no esta corriendo o cron no esta configurado.
**Solucion:**
1. Verificar que el servicio worker esta activo en Coolify
2. Verificar que el cron esta programado
3. Disparar manualmente: `curl -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/sync-market`
4. Revisar logs del worker en Coolify

## Variables de Entorno Requeridas

| Variable | Donde | Para que |
|----------|-------|---------|
| `ML_APP_ID` | App + Worker | Client ID de la app de ML Chile |
| `ML_SECRET_KEY` | App + Worker | Client Secret de la app de ML Chile |
| `CRON_SECRET` | App | Protege el endpoint del cron |
| `DATABASE_URL` | Worker | Conexion a PostgreSQL |
| `REDIS_URL` | App + Worker | Cola BullMQ (Redis DB 3) |

## Resumen: Que debe estar corriendo

| Servicio | Donde | Que hace |
|----------|-------|----------|
| Propi (Next.js) | Coolify, App Plane A | Sirve la app + callback OAuth + cron endpoint |
| Worker (BullMQ) | Coolify, App Plane A | Procesa jobs de sync + email |
| Cron externo | Coolify scheduled task | Dispara `/api/cron/sync-market` 1x/dia |
| PostgreSQL | Data Plane (10.0.1.20) | Almacena `service_credentials` + `market_listings` |
| Redis | Data Plane (10.0.1.20:6379/3) | Cola de jobs BullMQ |
