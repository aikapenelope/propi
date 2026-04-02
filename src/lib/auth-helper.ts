"use server";

import { auth } from "@clerk/nextjs/server";

/**
 * Get the current Clerk userId or throw.
 * Use in every server action that reads or writes user-scoped data.
 *
 * @example
 * export async function getContacts() {
 *   const userId = await requireUserId();
 *   return db.query.contacts.findMany({ where: eq(contacts.userId, userId) });
 * }
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
