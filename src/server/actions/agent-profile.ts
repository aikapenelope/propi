"use server";

import { db } from "@/lib/db";
import { agentProfiles, properties, propertyImages } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentProfileFormData = {
  slug: string;
  displayName: string;
  bio?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  agency?: string;
  city?: string;
  whatsapp?: string;
  published?: boolean;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get the current user's agent profile (for settings page). */
export async function getAgentProfile() {
  const userId = await requireUserId();
  return db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, userId),
  });
}

/** Get a public agent profile by slug (for the portal page, no auth). */
export async function getAgentProfileBySlug(slug: string) {
  return db.query.agentProfiles.findFirst({
    where: and(
      eq(agentProfiles.slug, slug),
      eq(agentProfiles.published, true),
    ),
  });
}

/** Get active properties for a public agent portal (no auth). */
export async function getAgentProperties(
  userId: string,
  filters?: { type?: string; operation?: string },
) {
  const conditions = [
    eq(properties.userId, userId),
    eq(properties.status, "active"),
  ];

  if (filters?.type) {
    conditions.push(
      eq(
        properties.type,
        filters.type as "apartment" | "house" | "land" | "commercial" | "office" | "warehouse" | "other",
      ),
    );
  }

  if (filters?.operation) {
    conditions.push(
      eq(
        properties.operation,
        filters.operation as "sale" | "rent" | "sale_rent",
      ),
    );
  }

  return db.query.properties.findMany({
    where: and(...conditions),
    with: {
      images: {
        orderBy: [propertyImages.sortOrder],
        limit: 1,
      },
    },
    orderBy: [desc(properties.updatedAt)],
    columns: {
      id: true,
      title: true,
      type: true,
      operation: true,
      price: true,
      currency: true,
      area: true,
      bedrooms: true,
      bathrooms: true,
      parkingSpaces: true,
      city: true,
      address: true,
    },
    limit: 50,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create or update the agent profile. */
export async function upsertAgentProfile(data: AgentProfileFormData) {
  const userId = await requireUserId();

  // Validate slug format (lowercase, alphanumeric, hyphens only)
  const slugClean = data.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slugClean.length < 3) {
    throw new Error("El slug debe tener al menos 3 caracteres.");
  }

  // Check slug uniqueness (exclude own profile)
  const existing = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.slug, slugClean),
    columns: { userId: true },
  });

  if (existing && existing.userId !== userId) {
    throw new Error("Este slug ya esta en uso. Elige otro.");
  }

  const profile = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, userId),
    columns: { id: true },
  });

  const values = {
    slug: slugClean,
    displayName: data.displayName,
    bio: data.bio || null,
    phone: data.phone || null,
    email: data.email || null,
    photoUrl: data.photoUrl || null,
    agency: data.agency || null,
    city: data.city || null,
    whatsapp: data.whatsapp || null,
    published: data.published ?? false,
  };

  if (profile) {
    await db
      .update(agentProfiles)
      .set(values)
      .where(eq(agentProfiles.userId, userId));
  } else {
    await db.insert(agentProfiles).values({ ...values, userId });
  }

  revalidatePath("/marketing/settings");
  revalidatePath(`/agente/${slugClean}`);
  return { slug: slugClean };
}
