"use server";

import { db } from "@/lib/db";
import { contacts } from "@/server/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

/** Parse a CSV string into an array of ImportedContact. */
export async function parseCSV(csvText: string): Promise<ImportedContact[]> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parse header row (handle quoted fields)
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Map common header names to our fields
  const nameIdx = findHeaderIndex(headers, [
    "name", "nombre", "full name", "nombre completo", "first name",
    "nombre y apellido", "contacto",
  ]);
  const emailIdx = findHeaderIndex(headers, [
    "email", "correo", "e-mail", "correo electronico", "mail",
  ]);
  const phoneIdx = findHeaderIndex(headers, [
    "phone", "telefono", "tel", "celular", "mobile", "phone 1 - value",
    "numero", "whatsapp",
  ]);
  const companyIdx = findHeaderIndex(headers, [
    "company", "empresa", "organizacion", "organization", "inmobiliaria",
  ]);

  if (nameIdx === -1) {
    throw new Error(
      "No se encontro la columna de nombre. Asegurate de que tu CSV tenga una columna llamada 'Nombre', 'Name', o 'Contacto'.",
    );
  }

  const result: ImportedContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const name = values[nameIdx]?.trim();
    if (!name) continue;

    // If there's a "first name" but no combined name, check for last name
    const lastNameIdx = findHeaderIndex(headers, [
      "last name", "apellido", "apellidos",
    ]);
    const fullName = lastNameIdx !== -1 && values[lastNameIdx]?.trim()
      ? `${name} ${values[lastNameIdx].trim()}`
      : name;

    result.push({
      name: fullName,
      email: emailIdx !== -1 ? values[emailIdx]?.trim() || undefined : undefined,
      phone: phoneIdx !== -1 ? values[phoneIdx]?.trim() || undefined : undefined,
      company: companyIdx !== -1 ? values[companyIdx]?.trim() || undefined : undefined,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// vCard Parser
// ---------------------------------------------------------------------------

/** Parse a vCard (.vcf) string into an array of ImportedContact. */
export async function parseVCard(vcfText: string): Promise<ImportedContact[]> {
  const result: ImportedContact[] = [];
  const cards = vcfText.split("BEGIN:VCARD");

  for (const card of cards) {
    if (!card.includes("END:VCARD")) continue;

    const lines = unfoldVCardLines(card);
    let name = "";
    let email = "";
    let phone = "";
    let company = "";

    for (const line of lines) {
      // FN (formatted name) — preferred
      if (line.startsWith("FN:") || line.startsWith("FN;")) {
        name = extractVCardValue(line);
      }
      // N (structured name) — fallback if no FN
      else if (!name && (line.startsWith("N:") || line.startsWith("N;"))) {
        const parts = extractVCardValue(line).split(";");
        const lastName = parts[0]?.trim() || "";
        const firstName = parts[1]?.trim() || "";
        name = [firstName, lastName].filter(Boolean).join(" ");
      }
      // EMAIL
      else if (line.startsWith("EMAIL:") || line.startsWith("EMAIL;")) {
        if (!email) email = extractVCardValue(line);
      }
      // TEL
      else if (line.startsWith("TEL:") || line.startsWith("TEL;")) {
        if (!phone) phone = extractVCardValue(line);
      }
      // ORG
      else if (line.startsWith("ORG:") || line.startsWith("ORG;")) {
        company = extractVCardValue(line).split(";")[0]?.trim() || "";
      }
    }

    if (name) {
      result.push({
        name,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Import to database
// ---------------------------------------------------------------------------

/** Import parsed contacts into the database for the current user. */
export async function importContacts(
  parsed: ImportedContact[],
): Promise<ImportResult> {
  const userId = await requireUserId();
  let imported = 0;
  let skipped = 0;
  const duplicates = 0;
  const errors: string[] = [];

  // Load existing contacts for duplicate detection (by email or phone)
  const existing = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    columns: { email: true, phone: true },
  });

  const existingEmails = new Set(
    existing.map((c) => c.email?.toLowerCase()).filter(Boolean),
  );
  const existingPhones = new Set(
    existing.map((c) => c.phone?.replace(/\D/g, "")).filter(Boolean),
  );

  for (const contact of parsed) {
    try {
      if (!contact.name || contact.name.length < 2) {
        skipped++;
        continue;
      }

      // Skip duplicates: match by email or phone (normalized)
      const emailNorm = contact.email?.toLowerCase();
      const phoneNorm = contact.phone?.replace(/\D/g, "");

      if (emailNorm && existingEmails.has(emailNorm)) {
        skipped++;
        continue;
      }
      if (phoneNorm && phoneNorm.length >= 7 && existingPhones.has(phoneNorm)) {
        skipped++;
        continue;
      }

      await db.insert(contacts).values({
        name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        source: "other",
        leadStatus: "new",
        userId,
      });

      // Track newly imported contacts to avoid duplicates within the same batch
      if (emailNorm) existingEmails.add(emailNorm);
      if (phoneNorm && phoneNorm.length >= 7) existingPhones.add(phoneNorm);

      imported++;
    } catch (err) {
      errors.push(
        `Error importando "${contact.name}": ${err instanceof Error ? err.message : "desconocido"}`,
      );
    }
  }

  revalidatePath("/contacts");
  revalidatePath("/pipeline");

  return { imported, skipped: skipped + duplicates, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a single CSV line handling quoted fields with commas inside. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Find the index of a header matching any of the given aliases. */
function findHeaderIndex(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Unfold vCard continuation lines (lines starting with space/tab). */
function unfoldVCardLines(text: string): string[] {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
}

/** Extract the value from a vCard property line (after the last colon). */
function extractVCardValue(line: string): string {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return "";
  return line.slice(colonIdx + 1).trim();
}
