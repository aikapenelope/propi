# Media & Integrations Runbook

## 1. Flujo de imagenes en Propi

### Donde viven las imagenes

Las imagenes de propiedades se guardan en MinIO (S3-compatible) en el Data Plane (10.0.1.20:9000).
Buckets: `propi-media` (fotos de propiedades), `propi-documents` (contratos, PDFs).

### Upload: usuario sube foto de propiedad

```
Browser -> presigned PUT URL (1h expiry) -> MinIO
```

1. Frontend llama `getUploadUrl(filename, contentType)` (server action)
2. Server genera presigned PUT URL con AWS SDK (expira en 10 min)
3. Frontend hace PUT directo a MinIO con el archivo
4. Server guarda el `key` en `property_images` tabla

### Display: mostrar foto en la app

```
Server genera presigned GET URL (1h expiry) -> <img src={url}>
```

`getImageUrl(key)` genera un presigned GET URL que expira en 1 hora.

### Problema: URLs de MinIO no son publicas

MinIO esta en la red privada (10.0.1.20). Las presigned URLs funcionan dentro de la app porque el browser las resuelve via el proxy de Coolify/Traefik. Pero servicios externos (MercadoLibre, Meta, Wasi) NO pueden acceder a estas URLs.

### Solucion para publicar en portales externos

Cuando se publica una propiedad en MercadoLibre, Meta, o Wasi, las imagenes deben ser accesibles publicamente. Opciones:

**Opcion A: Upload directo al servicio externo (recomendada)**
- MercadoLibre: `POST /pictures/items/upload` con multipart/form-data (sube el archivo directo)
- Meta/Instagram: `image_url` debe ser publica. Meta hace cURL a la URL.
- Wasi: `POST /v1/property/upload-image/{id}` con multipart/form-data

Flujo: descargar de MinIO en el server -> subir al servicio externo.

**Opcion B: Proxy publico de imagenes**
- Crear un endpoint `/api/images/[key]` que sirve la imagen de MinIO
- La URL `https://propi.aikalabs.cc/api/images/abc123` es publica
- Meta/ML/Wasi pueden acceder a ella

Opcion A es mas eficiente (no hay proxy en cada request). Opcion B es mas simple de implementar.

---

## 2. MercadoLibre: Publicar propiedades

### Imagenes

MercadoLibre NO acepta URLs externas para imagenes de inmuebles. Hay que subirlas a sus servidores:

```
POST https://api.mercadolibre.com/pictures/items/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file=@foto.jpg
```

Respuesta: retorna un `picture_id` que se usa al crear el listing.

**Requisitos de imagenes ML:**
- Formatos: JPG, JPEG, PNG
- Tamano maximo: 10 MB
- Resolucion minima: 500x500 px
- Resolucion maxima: 1920x1920 px (se redimensiona)
- RGB (no CMYK)

**Flujo completo para publicar propiedad con fotos:**
1. Obtener imagenes de MinIO (server-side, via AWS SDK)
2. Subir cada imagen a ML via `/pictures/items/upload`
3. Obtener array de `picture_id`s
4. Crear el listing con `POST /items` incluyendo los `picture_id`s

### Moneda y pais

- Site ID: `MLV` (Venezuela)
- Moneda: `USD` (la mayoria de inmuebles en Venezuela se publican en USD)
- `VES` tambien disponible pero menos comun para inmuebles

---

## 3. Meta (Instagram + Facebook): Publicar contenido

### Como viajan las imagenes/videos a Meta

Meta NO acepta uploads directos de archivos. Requiere una URL publica que Meta pueda hacer cURL:

**Instagram - Publicar foto:**
```
POST /{ig_user_id}/media
  image_url=https://propi.aikalabs.cc/api/images/{key}
  caption=Apartamento en Los Palos Grandes...
  access_token={token}
```

**Instagram - Publicar video/reel:**
```
POST /{ig_user_id}/media
  video_url=https://propi.aikalabs.cc/api/images/{key}
  media_type=REELS
  caption=...
  access_token={token}
```

Despues de crear el container:
```
POST /{ig_user_id}/media_publish
  creation_id={container_id}
  access_token={token}
```

**Facebook Page - Publicar foto:**
```
POST /{page_id}/photos
  url=https://propi.aikalabs.cc/api/images/{key}
  message=...
  access_token={page_token}
```

**Facebook Page - Publicar video:**
```
POST /{page_id}/videos
  file_url=https://propi.aikalabs.cc/api/images/{key}
  description=...
  access_token={page_token}
```

### Requisitos de Meta

**Instagram fotos:**
- Formato: JPEG unicamente
- Aspect ratio: entre 4:5 y 1.91:1
- Resolucion minima: 320px de ancho
- Tamano maximo: 8 MB

**Instagram videos/reels:**
- Formato: MP4, MOV
- Duracion: 3s - 15min (reels), 3s - 60s (stories)
- Tamano maximo: 1 GB
- Resolucion minima: 720p

**Facebook fotos:**
- Formato: JPEG, PNG, GIF, BMP, TIFF
- Tamano maximo: 10 MB

**Rate limits:**
- Instagram: 100 posts por 24 horas (carousels cuentan como 1)
- Endpoint: `GET /{ig_user_id}/content_publishing_limit` para verificar

### Permisos necesarios

| Permiso | Para que |
|---------|---------|
| `instagram_basic` | Leer perfil y media |
| `instagram_content_publish` | Publicar fotos/videos |
| `instagram_manage_insights` | Leer metricas |
| `instagram_manage_messages` | DMs (inbox) |
| `pages_read_engagement` | Leer datos de la pagina FB |
| `pages_manage_posts` | Publicar en pagina FB |
| `read_insights` | Metricas de pagina FB |

---

## 4. KPIs de Meta para el Dashboard

### Instagram Insights (API)

**Metricas de cuenta** (`GET /{ig_user_id}/insights`):

| Metrica | Periodo | Descripcion |
|---------|---------|-------------|
| `impressions` | day | Veces que se vio el contenido |
| `reach` | day | Cuentas unicas que vieron el contenido |
| `profile_views` | day | Visitas al perfil |
| `website_clicks` | day | Clicks en el link del bio |
| `follower_count` | day | Seguidores (requiere >100 followers) |
| `email_contacts` | day | Clicks en email |
| `phone_call_clicks` | day | Clicks en telefono |
| `get_directions_clicks` | day | Clicks en direcciones |

**Metricas por post** (`GET /{media_id}/insights`):

| Metrica | Descripcion |
|---------|-------------|
| `impressions` | Veces que se vio el post |
| `reach` | Cuentas unicas |
| `engagement` | Likes + comments + saves + shares |
| `saved` | Veces guardado |
| `video_views` | Reproducciones (solo video) |
| `likes` | Likes |
| `comments` | Comentarios |
| `shares` | Compartidos |

### Facebook Page Insights (API)

**Nota importante:** Meta depreco `page_fans` y `impressions` en Nov 2025. Usar `views` en su lugar.

**Metricas de pagina** (`GET /{page_id}/insights`):

| Metrica | Periodo | Descripcion |
|---------|---------|-------------|
| `page_views_total` | day/week | Vistas totales de la pagina |
| `page_engaged_users` | day/week | Usuarios que interactuaron |
| `page_post_engagements` | day/week | Interacciones en posts |
| `page_daily_follows` | day | Nuevos seguidores por dia |
| `page_daily_unfollows` | day | Unfollows por dia |

**Metricas por post** (`GET /{post_id}/insights`):

| Metrica | Descripcion |
|---------|-------------|
| `post_impressions` | Veces que se vio |
| `post_engaged_users` | Usuarios que interactuaron |
| `post_clicks` | Clicks en el post |
| `post_reactions_like_total` | Total de reacciones |

### Dashboard de Marketing recomendado

```
┌─────────────────────────────────────────────────┐
│ Marketing Overview                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│ │ Reach    │ │ Engage-  │ │ Profile  │ │ Foll-││
│ │ 12,450   │ │ ment     │ │ Views    │ │ owers││
│ │ +8%      │ │ 3.2%     │ │ 890      │ │ 2.4K ││
│ └──────────┘ └──────────┘ └──────────┘ └──────┘│
│                                                 │
│ Posts Recientes (IG + FB)                       │
│ ┌───────────────────────────────────────────┐   │
│ │ [IMG] Post 1 | 1,200 reach | 45 likes    │   │
│ │ [IMG] Post 2 | 890 reach | 32 likes      │   │
│ │ [IMG] Post 3 | 2,100 reach | 78 likes    │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Canales Conectados                              │
│ IG: @propi_ve ✓ | FB: Propi VE ✓ | WA: ✓     │
└─────────────────────────────────────────────────┘
```

### Limitaciones

- Instagram Insights requiere cuenta Business o Creator con >100 followers
- Facebook Page Insights requiere pagina con >100 likes
- Datos de insights se actualizan cada 24 horas
- Solo se pueden ver 90 dias de datos a la vez
- Metricas de video solo son precisas para el creador del video

---

## 5. Wasi: Publicar propiedades

### Imagenes

Wasi acepta upload directo via multipart/form-data:

```
POST api.wasi.co/v1/property/upload-image/{id_property}
  ?id_company={id}&wasi_token={token}
Content-Type: multipart/form-data

image=@foto.jpg
description=Sala principal
position=1
```

Formatos: PNG, JPEG, JPG, GIF.

Despues de subir imagenes, sincronizar con portales aliados:
```
POST api.wasi.co/v1/portal/send-property/{id_property}
```

### Auth

Wasi usa API key + token (no OAuth2). Se configura en el dashboard de Wasi.

---

## 6. Endpoint de proxy de imagenes (necesario para Meta)

Meta requiere URLs publicas para `image_url`. MinIO no es publico. Necesitamos un proxy:

```typescript
// src/app/api/images/[key]/route.ts
import { s3, MEDIA_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  const command = new GetObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: params.key,
  });

  const response = await s3.send(command);
  const body = response.Body as ReadableStream;

  return new Response(body, {
    headers: {
      "Content-Type": response.ContentType || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

URL publica: `https://propi.aikalabs.cc/api/images/{key}`

Esta URL se usa para:
- `image_url` en Instagram publish
- `url` en Facebook photo publish
- No se necesita para MercadoLibre (ML acepta upload directo)

---

## 7. Resumen de flujo de imagenes por servicio

| Servicio | Metodo de imagen | URL publica necesaria |
|----------|-----------------|----------------------|
| Propi (app) | Presigned URL de MinIO | No (interna) |
| MercadoLibre | Upload multipart directo a ML servers | No |
| Instagram | URL publica que Meta hace cURL | Si (proxy) |
| Facebook | URL publica que Meta hace cURL | Si (proxy) |
| Wasi | Upload multipart directo a Wasi | No |

---

## 8. Mantenimiento

### Tokens

| Servicio | Expiracion | Refresh |
|----------|-----------|---------|
| MercadoLibre | 6 horas | Automatico (refresh_token en mercadolibre.ts) |
| Meta (IG/FB) | 60 dias (long-lived) | Manual (reconectar en settings) |
| Wasi | No expira | N/A (API key) |
| Groq | No expira | N/A (API key) |

### Rate limits

| Servicio | Limite | Accion |
|----------|--------|--------|
| MercadoLibre search | 1500 req/min | Retry con backoff en 429 |
| MercadoLibre publish | Depende de reputacion (1000-50000 listings) | Verificar con /marketplace/users/cap |
| Instagram publish | 100 posts/24h | Verificar con /content_publishing_limit |
| Instagram insights | 200 req/hora | Cache en DB |
| Facebook insights | 200 req/hora | Cache en DB |
| Groq | 30 RPM, 1000 RPD (free) | Retry con backoff |

### Cron jobs

| Job | Frecuencia | Endpoint |
|-----|-----------|----------|
| Sync MercadoLibre listings | Diario 6am | `/api/cron/sync-market` |
| Sync Meta insights (futuro) | Diario 8am | `/api/cron/sync-insights` |
