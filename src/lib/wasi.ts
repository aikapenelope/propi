import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WasiCredentials {
  idCompany: string;
  wasiToken: string;
}

interface WasiPropertyData {
  title: string;
  for_sale: string;
  for_rent: string;
  id_property_type: number;
  sale_price: string;
  rent_price: string;
  id_currency: number;
  bedrooms: string;
  bathrooms: string;
  garages: string;
  area: string;
  address: string;
  id_country: number;
  observations: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WASI_API = "https://api.wasi.co/v1";

/** Map Propi property types to Wasi id_property_type */
const WASI_TYPE_MAP: Record<string, number> = {
  apartment: 2,
  house: 1,
  office: 5,
  commercial: 6,
  land: 3,
  warehouse: 7,
  other: 14,
};

/** Wasi currency IDs */
const WASI_CURRENCY_MAP: Record<string, number> = {
  USD: 2,
  VES: 4,
  EUR: 3,
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Get Wasi credentials from social_accounts for the current user */
export async function getWasiCredentials(): Promise<WasiCredentials> {
  const userId = await requireUserId();
  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, "wasi"),
      eq(socialAccounts.userId, userId),
    ),
  });

  if (!account) {
    throw new Error(
      "Wasi no esta conectado. Ve a Configuracion para agregar tus credenciales.",
    );
  }

  const meta = account.metadata as Record<string, string> | null;
  const idCompany = account.platformAccountId;
  const wasiToken = meta?.wasiToken || account.accessToken;

  if (!idCompany || !wasiToken) {
    throw new Error("Credenciales de Wasi incompletas. Reconecta en Configuracion.");
  }

  return { idCompany, wasiToken };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function wasiFetch<T>(
  path: string,
  creds: WasiCredentials,
  options?: { method?: string; body?: Record<string, unknown> },
): Promise<T> {
  const url = `${WASI_API}${path}?id_company=${creds.idCompany}&wasi_token=${creds.wasiToken}`;

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : {},
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Wasi API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Publish property
// ---------------------------------------------------------------------------

/** Map a Propi property to Wasi format and publish */
export async function publishToWasi(property: {
  title: string;
  description: string | null;
  type: string;
  operation: string;
  price: string | null;
  currency: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  address: string | null;
  city: string | null;
}): Promise<{ id_property: number }> {
  const creds = await getWasiCredentials();

  const isSale = property.operation === "sale" || property.operation === "sale_rent";
  const isRent = property.operation === "rent" || property.operation === "sale_rent";

  const wasiData: WasiPropertyData = {
    title: property.title,
    for_sale: isSale ? "true" : "false",
    for_rent: isRent ? "true" : "false",
    id_property_type: WASI_TYPE_MAP[property.type] || 14,
    sale_price: isSale && property.price ? property.price : "0",
    rent_price: isRent && property.price ? property.price : "0",
    id_currency: WASI_CURRENCY_MAP[property.currency || "USD"] || 2,
    bedrooms: String(property.bedrooms || 0),
    bathrooms: String(property.bathrooms || 0),
    garages: String(property.parkingSpaces || 0),
    area: property.area || "0",
    address: [property.address, property.city].filter(Boolean).join(", "),
    id_country: 4, // Venezuela
    observations: property.description || "",
  };

  const result = await wasiFetch<{ id_property: number }>(
    "/property/add",
    creds,
    { method: "POST", body: wasiData as unknown as Record<string, unknown> },
  );

  return result;
}

/** Upload an image to a Wasi property */
export async function uploadWasiImage(
  wasiPropertyId: number,
  imageBuffer: Buffer,
  filename: string,
  position: number,
): Promise<void> {
  const creds = await getWasiCredentials();

  const formData = new FormData();
  formData.append("image", new Blob([new Uint8Array(imageBuffer)]), filename);
  formData.append("position", String(position));

  const url =
    `${WASI_API}/property/upload-image/${wasiPropertyId}` +
    `?id_company=${creds.idCompany}&wasi_token=${creds.wasiToken}`;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Wasi image upload failed: ${res.status}`);
  }
}

/** Sync property to Wasi's partner portals */
export async function syncWasiPortals(wasiPropertyId: number): Promise<void> {
  const creds = await getWasiCredentials();
  await wasiFetch(`/portal/send-property/${wasiPropertyId}`, creds, {
    method: "POST",
  });
}
