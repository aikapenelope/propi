# MercadoLibre API Setup: Token desde Argentina para Venezuela

> Ultima actualizacion: Abril 2026

## Por que desde Argentina?

El portal de developers de MercadoLibre Venezuela (developers.mercadolibre.com.ve)
esta caido/bloqueado. La API de MercadoLibre es global (`api.mercadolibre.com`) y
un token generado desde cualquier pais puede buscar en cualquier site usando el
parametro `site_id`. Un token de Argentina busca en Venezuela con `site_id=MLV`.

> Fuente: [Items & Searches API](https://global-selling.mercadolibre.com/devsite/items-and-searches-global-selling)
> El endpoint `/sites/$SITE_ID/search` acepta cualquier site_id independiente del pais del token.

## Paso a paso

### 1. Crear cuenta de MercadoLibre Argentina

- Ve a [mercadolibre.com.ar/registration](https://www.mercadolibre.com.ar/registration)
- Registrate con email (puede ser el mismo que usas en Venezuela)
- Confirma tu email

### 2. Registrarte como Developer

- Ve a [developers.mercadolibre.com.ar](https://developers.mercadolibre.com.ar)
- Click en "Ingresar" (arriba a la derecha)
- Inicia sesion con tu cuenta de ML Argentina

### 3. Crear la aplicacion

- Ve a [developers.mercadolibre.com.ar/devcenter](https://developers.mercadolibre.com.ar/devcenter)
- Click en "Crear nueva aplicacion"
- Llena los campos:
  - **Nombre**: `Propi CRM` (debe ser unico en ML)
  - **Descripcion**: `CRM inmobiliario - analisis de mercado`
  - **Logo**: Imagen cuadrada de tu empresa
  - **URI de redirect**: `https://propi.aikalabs.cc/api/auth/mercadolibre/callback`
  - **PKCE**: Desactivado
  - **Scopes**: Marca **Lectura**
  - **Topicos**: Ninguno
- Click en Guardar
- Copia tu **App ID** y **Secret Key**

> Fuente: [Crear aplicacion](https://developers.mercadolibre.com.ar/es_ar/crea-una-aplicacion-en-mercado-libre-es)

### 4. Obtener el Access Token

Abre esta URL en tu navegador (reemplaza `$APP_ID`):

```
https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=$APP_ID&redirect_uri=https://propi.aikalabs.cc/api/auth/mercadolibre/callback
```

- ML te pide login con tu cuenta de Argentina
- Autorizas la app
- Te redirige a Propi con `?code=TG-XXXXX`
- Propi intercambia el code por un access token automaticamente

> Fuente: [Autenticacion y Autorizacion](https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion)

### 5. Configurar en Coolify

En las env vars del servicio de Propi:

```
ML_APP_ID=tu-app-id-de-argentina
ML_SECRET_KEY=tu-secret-key-de-argentina
```

Redeploy el servicio.

### 6. Verificar

Una vez con token, Propi busca en Venezuela automaticamente:

```
GET https://api.mercadolibre.com/sites/MLV/search?q=apartamento+altamira&category=MLV1472
Authorization: Bearer TU_TOKEN
```

El `site_id=MLV` filtra Venezuela. El token de Argentina solo autentica la app.

## Tokens y renovacion

| Token | Duracion | Auto-refresh en Propi |
|-------|----------|----------------------|
| Access Token | 6 horas | Si (`getMeliToken()`) |
| Refresh Token | 6 meses | Si (cada refresh genera uno nuevo) |

> Fuente: [Auth - Token expiration](https://global-selling.mercadolibre.com/devsite/authentication-and-authorization-global-selling)

Despues de la primera autorizacion, Propi renueva el token automaticamente.
Solo necesitas re-autorizar si el refresh token expira (6 meses sin uso).

## Si Argentina no funciona

Argentina requiere validacion de datos del titular (DNI/CUIT). Si te bloquea, intenta:

1. **Colombia**: [developers.mercadolibre.com.co/devcenter](https://developers.mercadolibre.com.co/devcenter)
2. **Peru**: [developers.mercadolibre.com.pe/devcenter](https://developers.mercadolibre.com.pe/devcenter)
3. **Ecuador**: [developers.mercadolibre.com.ec/devcenter](https://developers.mercadolibre.com.ec/devcenter)
4. **Uruguay**: [developers.mercadolibre.com.uy/devcenter](https://developers.mercadolibre.com.uy/devcenter)

Cambia la URL de autorizacion al dominio del pais que uses (ej: `auth.mercadolibre.com.co`).

## Datos de Venezuela disponibles

| Categoria | ID | Items |
|-----------|-----|-------|
| Inmuebles (total) | MLV1459 | 182,267 |
| Apartamentos | MLV1472 | 73,661 |
| Casas | MLV1466 | 39,080 |
| Oficinas | MLV1487 | 13,600 |
| Locales | MLV68199 | 22,360 |
| Terrenos | MLV1493 | 7,381 |
| Galpones | MLV50951 | 10,474 |
| Townhouses | MLV60745 | 4,427 |

> Datos verificados via `api.mercadolibre.com/categories/MLV1459` (abril 2026)
