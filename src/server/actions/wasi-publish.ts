"use server";

import { db } from "@/lib/db";
import { properties, propertyImages } from "@/server/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET } from "@/lib/s3";
import { publishToWasi, uploadWasiImage, syncWasiPortals } from "@/lib/wasi";

/**
 * Publish a Propi property to Wasi with all its images.
 * Updates the property's externalIds with the Wasi property ID.
 */
export async function publishPropertyToWasi(propertyId: string) {
  // 1. Get property
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
  });

  if (!property) throw new Error("Propiedad no encontrada");

  // Check if already published
  const externalIds = (property.externalIds as Record<string, string>) || {};
  if (externalIds.wasi) {
    throw new Error(`Ya publicada en Wasi (ID: ${externalIds.wasi})`);
  }

  // 2. Publish property data
  const result = await publishToWasi({
    title: property.title,
    description: property.description,
    type: property.type,
    operation: property.operation,
    price: property.price,
    currency: property.currency,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    address: property.address,
    city: property.city,
  });

  const wasiPropertyId = result.id_property;

  // 3. Upload images
  const images = await db.query.propertyImages.findMany({
    where: eq(propertyImages.propertyId, propertyId),
  });

  for (let i = 0; i < images.length; i++) {
    try {
      // Download from MinIO
      const command = new GetObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: images[i].key,
      });
      const response = await s3.send(command);
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Upload to Wasi
      await uploadWasiImage(
        wasiPropertyId,
        buffer,
        images[i].key.split("/").pop() || `image-${i}.jpg`,
        i + 1,
      );
    } catch (err) {
      console.error(`Failed to upload image ${i} to Wasi:`, err);
      // Continue with other images
    }
  }

  // 4. Sync with Wasi partner portals
  try {
    await syncWasiPortals(wasiPropertyId);
  } catch {
    // Non-critical, portal sync can be retried
  }

  // 5. Save Wasi ID in property
  await db
    .update(properties)
    .set({
      externalIds: { ...externalIds, wasi: String(wasiPropertyId) },
    })
    .where(eq(properties.id, propertyId));

  revalidatePath(`/properties/${propertyId}`);

  return { wasiPropertyId };
}
