import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeliTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId: number;
}

export interface MeliSearchResult {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail: string;
  secure_thumbnail?: string;
  pictures?: { id: string; url: string; secure_url: string; size: string }[];
  address?: {
    state_name?: string;
    city_name?: string;
    neighborhood_name?: string;
  };
  attributes: { id: string; value_name: string | null }[];
  location?: { latitude: number; longitude: number };
  seller?: { id: number; nickname: string };
  start_time?: string;
}

export interface CleanedListing {
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

interface MeliSearchResponse {
  results: MeliSearchResult[];
  paging: { total: number; offset: number; limit: number };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MELI_API = "https://api.mercadolibre.com";
const MELI_AUTH_VE = "https://auth.mercadolibre.com.ve";

/** Map Propi property types to MercadoLibre Venezuela category IDs */
const CATEGORY_MAP: Record<string, Record<string, string>> = {
  MLV: {
    "apartment-sale": "MLV1472",
    "house-sale": "MLV1466",
    "office-sale": "MLV1473",
    "commercial-sale": "MLV1474",
    "land-sale": "MLV1475",
    "apartment-rent": "MLV1493",
    "house-rent": "MLV1492",
  },
};

// ---------------------------------------------------------------------------
// OAuth2
// ---------------------------------------------------------------------------

/** Build the authorization URL for MercadoLibre OAuth2 */
export function getMeliAuthUrl(state: string): string {
  const appId = process.env.ML_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc"}/api/auth/mercadolibre/callback`;

  return (
    `${MELI_AUTH_VE}/authorization` +
    `?response_type=code` +
    `&client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  );
}

/** Exchange authorization code for tokens */
export async function exchangeMeliCode(code: string): Promise<MeliTokens> {
  const res = await fetch(`${MELI_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ML_APP_ID || "",
      client_secret: process.env.ML_SECRET_KEY || "",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc"}/api/auth/mercadolibre/callback`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MeLi token exchange failed: ${res.status} ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    userId: data.user_id,
  };
}

/** Refresh an expired access token */
async function refreshMeliToken(refreshToken: string): Promise<MeliTokens> {
  const res = await fetch(`${MELI_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_APP_ID || "",
      client_secret: process.env.ML_SECRET_KEY || "",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`MeLi token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    userId: data.user_id,
  };
}

/** Get a valid access token, refreshing if needed.
 *  Pass userId explicitly for cron jobs where auth() is not available. */
export async function getMeliToken(userIdOverride?: string): Promise<string> {
  // Import dynamically to avoid circular deps and allow cron usage
  let userId: string;
  if (userIdOverride) {
    userId = userIdOverride;
  } else {
    const { requireUserId } = await import("@/lib/auth-helper");
    userId = await requireUserId();
  }

  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, "mercadolibre"),
      eq(socialAccounts.userId, userId),
    ),
  });

  if (!account) {
    throw new Error("MercadoLibre no esta conectado. Ve a Configuracion para conectar tu cuenta.");
  }

  const expiresAt = account.tokenExpiresAt ?? new Date(0);

  // Refresh 5 minutes before expiry
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshTokenValue = account.refreshToken;
    if (!refreshTokenValue) {
      throw new Error("MercadoLibre refresh token no disponible. Reconecta tu cuenta.");
    }

    const tokens = await refreshMeliToken(refreshTokenValue);

    await db
      .update(socialAccounts)
      .set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        metadata: { userId: tokens.userId },
      })
      .where(
        and(
          eq(socialAccounts.platform, "mercadolibre"),
          eq(socialAccounts.userId, userId),
        ),
      );

    return tokens.accessToken;
  }

  return account.accessToken;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Fetch with retry on 429 */
async function meliFetch<T>(url: string, token: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (res.status === 401) {
      throw new Error("MeLi token expired or revoked");
    }

    if (!res.ok) {
      throw new Error(`MeLi API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  throw new Error("MeLi API rate limit exceeded after retries");
}

/** Search properties on MercadoLibre */
export async function searchMeliProperties(params: {
  type: string;
  operation: string;
  city?: string | null;
  query?: string;
  siteId?: string;
  limit?: number;
}): Promise<MeliSearchResult[]> {
  const token = await getMeliToken();
  const siteId = params.siteId || "MLV";
  const limit = params.limit || 50;

  // Build category from type + operation
  const categoryKey = `${params.type}-${params.operation}`;
  const categoryId = CATEGORY_MAP[siteId]?.[categoryKey];

  const searchParams = new URLSearchParams({ limit: String(limit) });
  if (categoryId) searchParams.set("category", categoryId);
  if (params.query) searchParams.set("q", params.query);
  else if (params.city) searchParams.set("q", `${params.type} ${params.city}`);

  const url = `${MELI_API}/sites/${siteId}/search?${searchParams}`;
  const data = await meliFetch<MeliSearchResponse>(url, token);

  return data.results;
}

// ---------------------------------------------------------------------------
// Data cleaning
// ---------------------------------------------------------------------------

/** Clean raw ML listing to reduce tokens for Groq */
export function cleanListing(raw: MeliSearchResult): CleanedListing {
  const attrs: Record<string, string> = {};
  for (const a of raw.attributes) {
    if (a.value_name) attrs[a.id] = a.value_name;
  }

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

/** Clean an array of listings */
export function cleanListings(raw: MeliSearchResult[]): CleanedListing[] {
  return raw.map(cleanListing);
}

/** Map Propi property type to ML category */
export function mapCategory(
  type: string,
  operation: string,
  siteId = "MLV",
): string | null {
  const key = `${type}-${operation === "sale_rent" ? "sale" : operation}`;
  return CATEGORY_MAP[siteId]?.[key] || null;
}
