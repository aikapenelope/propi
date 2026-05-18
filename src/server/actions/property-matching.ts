"use server";

import { db } from "@/lib/db";
import { contacts, properties } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

/**
 * Find contacts whose preferences match a given property.
 *
 * Matching rules (all optional, more matches = better):
 * - prefPropertyType matches property.type
 * - prefCity matches property.city (case-insensitive)
 * - prefBudgetMax >= property.price
 * - prefOperation matches property.operation
 *
 * Returns contacts sorted by match quality (most criteria matched first).
 */
export async function findMatchingContacts(propertyId: string) {
  const userId = await requireUserId();

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
    columns: {
      type: true,
      operation: true,
      price: true,
      city: true,
    },
  });

  if (!property) return [];

  // Get all contacts that have at least one preference set
  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      prefPropertyType: true,
      prefCity: true,
      prefBudgetMax: true,
      prefOperation: true,
    },
  });

  // Score each contact by how many preferences match
  const scored = allContacts
    .map((contact) => {
      let score = 0;
      let total = 0;

      if (contact.prefPropertyType) {
        total++;
        if (contact.prefPropertyType === property.type) score++;
      }

      if (contact.prefOperation) {
        total++;
        if (
          contact.prefOperation === property.operation ||
          property.operation === "sale_rent"
        )
          score++;
      }

      if (contact.prefCity) {
        total++;
        if (
          property.city &&
          contact.prefCity.toLowerCase() === property.city.toLowerCase()
        )
          score++;
      }

      if (contact.prefBudgetMax && property.price) {
        total++;
        if (parseFloat(contact.prefBudgetMax) >= parseFloat(property.price))
          score++;
      }

      return { ...contact, score, total };
    })
    .filter((c) => c.score > 0) // Only contacts with at least 1 match
    .sort((a, b) => b.score - a.score) // Best matches first
    .slice(0, 10); // Top 10

  return scored;
}
