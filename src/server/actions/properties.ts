"use server";

import { db } from "@/lib/db";
import { properties, propertyTags, propertyImages } from "@/server/schema";
import { eq, ilike, or, desc, and, gte, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, MEDIA_BUCKET } from "@/lib/s3";

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
  const conditions: SQL[] = [];

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
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      agent: true,
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
  return db.query.properties.findFirst({
    where: eq(properties.id, id),
    with: {
      agent: true,
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
      country: data.country || "CO",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
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
      country: data.country || "CO",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    })
    .where(eq(properties.id, id))
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
  await db.delete(properties).where(eq(properties.id, id));
  revalidatePath("/properties");
}

// ---------------------------------------------------------------------------
// Image upload (presigned URL for client-side upload to MinIO)
// ---------------------------------------------------------------------------

export async function getUploadUrl(
  propertyId: string,
  filename: string,
  contentType: string,
) {
  const key = `properties/${propertyId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 600 });

  return { url, key };
}

export async function addPropertyImage(
  propertyId: string,
  key: string,
  filename: string,
  isCover = false,
) {
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
