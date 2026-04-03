"use server";

import { db } from "@/lib/db";
import { properties, propertyTags, propertyImages } from "@/server/schema";
import { eq, ilike, or, desc, and, gte, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, MEDIA_BUCKET } from "@/lib/s3";
import { requireUserId } from "@/lib/auth-helper";
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
};

export type PropertyFilters = {
  search?: string;
  type?: string;
  operation?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getProperties(filters: PropertyFilters = {}) {
  const userId = await requireUserId();
  const conditions: SQL[] = [eq(properties.userId, userId)];

  if (filters.search) {
    const searchCondition = or(
      ilike(properties.title, `%${filters.search}%`),
      ilike(properties.address, `%${filters.search}%`),
      ilike(properties.city, `%${filters.search}%`),
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
  });
}

export async function getProperty(id: string) {
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

  const [property] = await db
    .insert(properties)
    .values({
      title: data.title,
      description: data.description || null,
      type:
        (data.type as typeof properties.$inferInsert.type) || "apartment",
      operation:
        (data.operation as typeof properties.$inferInsert.operation) || "sale",
      status:
        (data.status as typeof properties.$inferInsert.status) || "draft",
      price: data.price || null,
      currency: data.currency || "USD",
      area: data.area || null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
      parkingSpaces: data.parkingSpaces ? parseInt(data.parkingSpaces) : null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      country: data.country || "VE",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      userId,
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(propertyTags).values(
      data.tagIds.map((tagId) => ({
        propertyId: property.id,
        tagId,
      })),
    );
  }

  revalidatePath("/properties");
  return property;
}

export async function updateProperty(id: string, data: PropertyFormData) {
  const userId = await requireUserId();

  const [property] = await db
    .update(properties)
    .set({
      title: data.title,
      description: data.description || null,
      type:
        (data.type as typeof properties.$inferInsert.type) || "apartment",
      operation:
        (data.operation as typeof properties.$inferInsert.operation) || "sale",
      status:
        (data.status as typeof properties.$inferInsert.status) || "draft",
      price: data.price || null,
      currency: data.currency || "USD",
      area: data.area || null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
      parkingSpaces: data.parkingSpaces ? parseInt(data.parkingSpaces) : null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      country: data.country || "VE",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    })
    .where(and(eq(properties.id, id), eq(properties.userId, userId)))
    .returning();

  // Replace tags
  await db.delete(propertyTags).where(eq(propertyTags.propertyId, id));
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(propertyTags).values(
      data.tagIds.map((tagId) => ({
        propertyId: id,
        tagId,
      })),
    );
  }

  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return property;
}

export async function deleteProperty(id: string) {
  const userId = await requireUserId();
  await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.userId, userId)));
  revalidatePath("/properties");
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
  // Verify the property belongs to the user
  const userId = await requireUserId();
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
  });
  if (!property) throw new Error("Property not found");

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

export async function deletePropertyImage(imageId: string, key: string) {
  // Verify the image belongs to a property owned by the user
  const userId = await requireUserId();
  const image = await db.query.propertyImages.findFirst({
    where: eq(propertyImages.id, imageId),
    with: { property: true },
  });
  if (!image || image.property.userId !== userId) {
    throw new Error("Image not found");
  }

  // Delete from MinIO
  await s3.send(
    new DeleteObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
    }),
  );

  // Delete from DB
  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));
}

export async function getImageUrl(key: string) {
  // Key is already scoped by userId prefix ({userId}/properties/...)
  // but verify the caller is authenticated
  await requireUserId();

  const command = new GetObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
