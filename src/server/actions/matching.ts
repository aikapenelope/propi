"use server";

import { db } from "@/lib/db";
import { contacts, properties } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

/**
 * Full matching engine: crosses ALL active properties against ALL contacts
 * with preferences. Returns matches grouped by property, sorted by score.
 *
 * Matching rules:
 * - prefPropertyType matches property.type
 * - prefCity matches property.city (case-insensitive)
 * - prefBudgetMax >= property.price
 * - prefOperation matches property.operation (with smart cross-matching)
 *
 * Operation cross-matching:
 * - Contact "sale" matches property "sale" or "sale_rent"
 * - Contact "rent" matches property "rent" or "sale_rent"
 * - Contact "sale_rent" matches property "sale", "rent", or "sale_rent"
 * - Contact "sell" matches property "sale" or "sale_rent" (owner wants to sell)
 * - Contact "lease" matches property "rent" or "sale_rent" (owner wants to lease)
 *
 * This runs entirely in memory — no data is written to the DB.
 * Called on demand via a button, not via cron.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchedContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  prefPropertyType: string | null;
  prefCity: string | null;
  prefBudgetMax: string | null;
  prefOperation: string | null;
  score: number;
  totalCriteria: number;
}

export interface PropertyWithMatches {
  id: string;
  title: string;
  type: string;
  operation: string;
  status: string;
  price: string | null;
  currency: string | null;
  city: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  matches: MatchedContact[];
}

// ---------------------------------------------------------------------------
// Operation matching logic
// ---------------------------------------------------------------------------

/** Check if a contact's preferred operation is compatible with a property's operation. */
function operationsMatch(
  contactOp: string | null,
  propertyOp: string,
): boolean {
  if (!contactOp) return false;

  // Buyer/renter side
  if (contactOp === "sale") return propertyOp === "sale" || propertyOp === "sale_rent";
  if (contactOp === "rent") return propertyOp === "rent" || propertyOp === "sale_rent";
  if (contactOp === "sale_rent") return propertyOp === "sale" || propertyOp === "rent" || propertyOp === "sale_rent";

  // Owner side (wants to sell/lease their property)
  if (contactOp === "sell") return propertyOp === "sale" || propertyOp === "sale_rent";
  if (contactOp === "lease") return propertyOp === "rent" || propertyOp === "sale_rent";

  return false;
}

// ---------------------------------------------------------------------------
// Main matching function
// ---------------------------------------------------------------------------

/**
 * Run the full matching engine.
 * Returns active properties that have at least one matching contact,
 * sorted by number of matches (most matches first).
 */
export async function runFullMatching(): Promise<PropertyWithMatches[]> {
  const userId = await requireUserId();

  // Load all active properties and all contacts with at least one preference
  const [activeProperties, allContacts] = await Promise.all([
    db.query.properties.findMany({
      where: and(
        eq(properties.userId, userId),
        eq(properties.status, "active"),
      ),
      columns: {
        id: true,
        title: true,
        type: true,
        operation: true,
        status: true,
        price: true,
        currency: true,
        city: true,
        address: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
      },
    }),
    db.query.contacts.findMany({
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
    }),
  ]);

  // Filter contacts that have at least one preference set
  const contactsWithPrefs = allContacts.filter(
    (c) => c.prefPropertyType || c.prefCity || c.prefBudgetMax || c.prefOperation,
  );

  if (contactsWithPrefs.length === 0 || activeProperties.length === 0) {
    return [];
  }

  // Cross-match every property against every contact
  const results: PropertyWithMatches[] = [];

  for (const property of activeProperties) {
    const matches: MatchedContact[] = [];

    for (const contact of contactsWithPrefs) {
      let score = 0;
      let totalCriteria = 0;

      // Type match
      if (contact.prefPropertyType) {
        totalCriteria++;
        if (contact.prefPropertyType === property.type) score++;
      }

      // Operation match (smart cross-matching)
      if (contact.prefOperation) {
        totalCriteria++;
        if (operationsMatch(contact.prefOperation, property.operation)) score++;
      }

      // City match (case-insensitive)
      if (contact.prefCity) {
        totalCriteria++;
        if (
          property.city &&
          contact.prefCity.toLowerCase() === property.city.toLowerCase()
        ) {
          score++;
        }
      }

      // Budget match (contact's max budget >= property price)
      if (contact.prefBudgetMax && property.price) {
        totalCriteria++;
        if (parseFloat(contact.prefBudgetMax) >= parseFloat(property.price)) {
          score++;
        }
      }

      // Only include if at least 1 criterion matches
      if (score > 0) {
        matches.push({
          ...contact,
          score,
          totalCriteria,
        });
      }
    }

    if (matches.length > 0) {
      // Sort matches by score descending
      matches.sort((a, b) => b.score - a.score);

      results.push({
        ...property,
        matches,
      });
    }
  }

  // Sort properties by number of matches descending
  results.sort((a, b) => b.matches.length - a.matches.length);

  return results;
}
