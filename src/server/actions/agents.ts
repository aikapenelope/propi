"use server";

import { db } from "@/lib/db";
import { agents } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AgentFormData = {
  clerkUserId: string;
  name: string;
  email: string;
  phone?: string;
  commissionRate?: string;
};

export async function getAgents() {
  return db.query.agents.findMany({
    orderBy: [desc(agents.createdAt)],
  });
}

export async function getAgent(id: string) {
  return db.query.agents.findFirst({
    where: eq(agents.id, id),
  });
}

export async function createAgent(data: AgentFormData) {
  const [agent] = await db
    .insert(agents)
    .values({
      clerkUserId: data.clerkUserId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      commissionRate: data.commissionRate || "3.00",
    })
    .returning();

  revalidatePath("/agents");
  return agent;
}

export async function updateAgent(id: string, data: AgentFormData) {
  const [agent] = await db
    .update(agents)
    .set({
      clerkUserId: data.clerkUserId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      commissionRate: data.commissionRate || "3.00",
    })
    .where(eq(agents.id, id))
    .returning();

  revalidatePath("/agents");
  return agent;
}

export async function deleteAgent(id: string) {
  await db.delete(agents).where(eq(agents.id, id));
  revalidatePath("/agents");
}
