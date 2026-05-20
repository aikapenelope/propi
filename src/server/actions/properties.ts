"use server";

import { db } from "@/lib/db";
import { properties, propertyTags, propertyImages } from "@/server/schema";
import { eq, ilike, or, desc, and, gte, lte, lt, type SQL } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sanitizeLike } from "@/lib/sanitize";
import { s3, MEDIA_BUCKET } from "@/lib/s3";
import { requireUserId } from "@/lib/auth-helper";
import { propertySchema, parseUuid } from "@/lib/validators";
import { checkStorageQuota } from "@/lib/storage-quota";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PropertyFormData = {
  title: string;
  description?: string;
  type?: string;
  operation?: string;
  status?: string;
  price?: string;
  currency?: string;
  area?: string;
  bedrooms?: string;
  bathrooms?: string;
  parkingSpaces?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  tagIds?: string[];
  externalLinks?: string[];
  /** Closing fields (optional — only relevant when status is sold/rented) */
  closedAt?: string;
  soldPrice?: string;
  commissionRate?: string;
};

export type PropertyFilters = {
  search?: string;
  type?: string;
  operation?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  /** Cursor for pagination: ISO timestamp of the last item's updatedAt */
  cursor?: string;
  /** Page size (default 30) */
  pageSize?: number;
};

/** Paginated response with items and next cursor */
export type PaginatedProperties = {
  items: Awaited<ReturnType<typeof fetchProperties>>;
  nextCursor: string | null;
  hasMore: boolean;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 30;

export async function getProperties(
  filters: PropertyFilters = {},
): Promise<PaginatedProperties> {
  const userId = await requireUserId();
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE;

  const getCached = unstable_cache(
    () => fetchProperties(userId, filters, pageSize),
    [`properties-${userId}-${JSON.stringify(filters)}`],
    { revalidate: 30, tags: [`properties-${userId}`] },
  );

  const items = await getCached();
  const hasMore = items.length > pageSize;
  const trimmed = hasMore ? items.slice(0, pageSize) : items;
  const nextCursor = hasMore
    ? trimmed[trimmed.length - 1].updatedAt.toISOString()
    : null;

  return { items: trimmed, nextCursor, hasMore };
}

async function fetchProperties(
  userId: string,
  filters: PropertyFilters,
  pageSize: number,
) {
  const conditions: SQL[] = [eq(properties.userId, userId)];

  if (filters.search) {
    const searchCondition = or(
      ilike(properties.title, `%${sanitizeLike(filters.search)}%`),
      ilike(properties.address, `%${sanitizeLike(filters.search)}%`),
      ilike(properties.city, `%${sanitizeLike(filters.search)}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (filters.type) {
    conditions.push(
      eq(
        properties.type,
        filters.type as "apartment" | "house" | "land" | "commercial" | "office" | "warehouse" | "other",
      ),
    );
  }

  if (filters.operation) {
    conditions.push(
      eq(
        properties.operation,
        filters.operation as "sale" | "rent" | "sale_rent",
      ),
    );
  }

  if (filters.status) {
    conditions.push(
      eq(
        properties.status,
        filters.status as "draft" | "active" | "reserved" | "sold" | "rented" | "inactive",
      ),
    );
  }

  if (filters.minPrice) {
    conditions.push(gte(properties.price, filters.minPrice));
  }

  if (filters.maxPrice) {
    conditions.push(lte(properties.price, filters.maxPrice));
  }

  // Cursor-based pagination: fetch items older than the cursor
  if (filters.cursor) {
    conditions.push(lt(properties.updatedAt, new Date(filters.cursor)));
  }

  return db.query.properties.findMany({
    where: and(...conditions),
    with: {
      images: {
        orderBy: [propertyImages.sortOrder],
        limit: 1,
      },
      propertyTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(properties.updatedAt)],
    // Fetch one extra to detect if there are more pages
    limit: pageSize + 1,
  });
}

/**
 * Lightweight list of all properties for dropdowns/selects.
 * Returns only id + title (no images, no tags, no pagination).
 * Cached for 60s since it's used in forms that don't need real-time data.
 */
export async function getPropertyOptions() {
  const userId = await requireUserId();

  const getCached = unstable_cache(
    () =>
      db.query.properties.findMany({
        where: eq(properties.userId, userId),
        columns: { id: true, title: true },
        orderBy: [desc(properties.updatedAt)],
        limit: 500,
      }),
    [`property-options-${userId}`],
    { revalidate: 60, tags: [`properties-${userId}`] },
  );

  return getCached();
}

export async function getProperty(id: string) {
  parseUuid(id, "Property ID");
  const userId = await requireUserId();

  return db.query.properties.findFirst({
    where: and(eq(properties.id, id), eq(properties.userId, userId)),
    with: {
      images: {
        orderBy: [propertyImages.sortOrder],
      },
      propertyTags: {
        with: { tag: true },
      },
      appointments: {
        orderBy: [desc(properties.updatedAt)],
        limit: 5,
      },
      documents: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createProperty(data: PropertyFormData) {
  const userId = await requireUserId();
  const validated = propertySchema.parse(data);

  const property = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(properties)
      .values({
        title: validated.title,
        description: validated.description || null,
        type: validated.type || "apartment",
        operation: validated.operation || "sale",
        status: validated.status || "draft",
        price: validated.price || null,
        currency: validated.currency || "USD",
        area: validated.area || null,
        bedrooms: validated.bedrooms ? parseInt(validated.bedrooms, 10) : null,
        bathrooms: validated.bathrooms ? parseInt(validated.bathrooms, 10) : null,
        parkingSpaces: validated.parkingSpaces ? parseInt(validated.parkingSpaces, 10) : null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        zipCode: validated.zipCode || null,
        country: validated.country || "VE",
        latitude: validated.latitude || null,
        longitude: validated.longitude || null,
        externalLinks: validated.externalLinks ?? null,
        closedAt: validated.closedAt ? new Date(validated.closedAt) : null,
        soldPrice: validated.soldPrice || null,
        commissionRate: validated.commissionRate || null,
        userId,
      })
      .returning();

    if (validated.tagIds && validated.tagIds.length > 0) {
      await tx.insert(propertyTags).values(
        validated.tagIds.map((tagId) => ({
          propertyId: created.id,
          tagId,
        })),
      );
    }

    return created;
  });

  revalidatePath("/properties");
  revalidateTag(`properties-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");
  return property;
}

export async function updatePropertyLinks(
  id: string,
  externalLinks: string[],
) {
  const userId = await requireUserId();
  await db
    .update(properties)
    .set({ externalLinks: externalLinks.slice(0, 3) })
    .where(and(eq(properties.id, id), eq(properties.userId, userId)));
  revalidatePath(`/properties/${id}`);
}

export async function updatePropertyStatus(
  id: string,
  status: "draft" | "active" | "reserved" | "sold" | "rented" | "inactive",
) {
  const userId = await requireUserId();
  await db
    .update(properties)
    .set({ status })
    .where(and(eq(properties.id, id), eq(properties.userId, userId)));
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  revalidateTag(`properties-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");
}

export async function updateProperty(id: string, data: PropertyFormData) {
  parseUuid(id, "Property ID");
  const userId = await requireUserId();
  const validated = propertySchema.parse(data);

  const property = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(properties)
      .set({
        title: validated.title,
        description: validated.description || null,
        type: validated.type || "apartment",
        operation: validated.operation || "sale",
        status: validated.status || "draft",
        price: validated.price || null,
        currency: validated.currency || "USD",
        area: validated.area || null,
        bedrooms: validated.bedrooms ? parseInt(validated.bedrooms, 10) : null,
        bathrooms: validated.bathrooms ? parseInt(validated.bathrooms, 10) : null,
        parkingSpaces: validated.parkingSpaces ? parseInt(validated.parkingSpaces, 10) : null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        zipCode: validated.zipCode || null,
        country: validated.country || "VE",
        latitude: validated.latitude || null,
        longitude: validated.longitude || null,
        externalLinks: validated.externalLinks ?? null,
        closedAt: validated.closedAt ? new Date(validated.closedAt) : null,
        soldPrice: validated.soldPrice || null,
        commissionRate: validated.commissionRate || null,
      })
      .where(and(eq(properties.id, id), eq(properties.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error("Propiedad no encontrada.");
    }

    // Replace tags atomically: delete existing, insert new
    await tx.delete(propertyTags).where(eq(propertyTags.propertyId, id));
    if (validated.tagIds && validated.tagIds.length > 0) {
      await tx.insert(propertyTags).values(
        validated.tagIds.map((tagId) => ({
          propertyId: id,
          tagId,
        })),
      );
    }

    return updated;
  });

  revalidatePath("/properties");
  revalidateTag(`properties-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");
  revalidatePath(`/properties/${id}`);
  return property;
}

export async function deleteProperty(id: string) {
  parseUuid(id, "Property ID");
  const userId = await requireUserId();

  // Fetch images BEFORE deleting the property (cascade will remove DB rows)
  const images = await db.query.propertyImages.findMany({
    where: eq(propertyImages.propertyId, id),
    columns: { key: true },
  });

  // Delete property (cascades to property_images, property_tags in DB)
  await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.userId, userId)));

  // Clean up image files from MinIO (don't fail if some are missing)
  for (const img of images) {
    try {
      await s3.send(
        new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: img.key }),
      );
    } catch {
      // File may already be gone — continue with the rest
    }
  }

  revalidatePath("/properties");
  revalidateTag(`properties-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");
}

// ---------------------------------------------------------------------------
// Image upload (presigned URL for client-side upload to MinIO)
// ---------------------------------------------------------------------------

/** Generate a MinIO key for a property image upload. */
export async function getUploadKey(
  propertyId: string,
  filename: string,
) {
  const userId = await requireUserId();

  // Verify the property belongs to this user before generating a key.
  // Prevents generating upload paths for properties owned by others.
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
    columns: { id: true },
  });
  if (!property) throw new Error("Propiedad no encontrada.");

  await checkStorageQuota(userId);
  const key = `${userId}/properties/${propertyId}/${Date.now()}-${filename}`;
  return { key };
}

export async function addPropertyImage(
  propertyId: string,
  key: string,
  filename: string,
  isCover = false,
) {
  const userId = await requireUserId();
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
    with: { images: true },
  });
  if (!property) throw new Error("Property not found");

  if (property.images.length >= 4) {
    throw new Error("Maximo 4 imagenes por propiedad.");
  }

  const [image] = await db
    .insert(propertyImages)
    .values({
      propertyId,
      key,
      filename,
      isCover,
    })
    .returning();

  revalidatePath(`/properties/${propertyId}`);
  return image;
}

export async function deletePropertyImage(imageId: string, _key?: string) {
  // Verify the image belongs to a property owned by the user
  const userId = await requireUserId();
  const image = await db.query.propertyImages.findFirst({
    where: eq(propertyImages.id, imageId),
    with: { property: true },
  });
  if (!image || image.property.userId !== userId) {
    throw new Error("Image not found");
  }

  // Use the key from the DB record, not the client parameter, to prevent
  // a malicious client from deleting arbitrary MinIO objects.
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: image.key,
      }),
    );
  } catch (err) {
    console.error("MinIO delete error (continuing):", err);
  }

  // Always delete from DB
  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));
  revalidatePath(`/properties/${image.propertyId}`);
}

/** Get a public-facing URL for a property image via the proxy. */
export async function getImageUrl(key: string) {
  await requireUserId();
  // Use the image proxy (catch-all route handles slashes in key)
  return `/api/images/${key}`;
}
