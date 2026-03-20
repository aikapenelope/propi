"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createAgent,
  updateAgent,
  type AgentFormData,
} from "@/server/actions/agents";

interface AgentFormProps {
  agent?: {
    id: string;
    clerkUserId: string;
    name: string;
    email: string;
    phone: string | null;
    commissionRate: string | null;
  };
}

export function AgentForm({ agent }: AgentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!agent;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data: AgentFormData = {
      clerkUserId: fd.get("clerkUserId") as string,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      commissionRate: (fd.get("commissionRate") as string) || undefined,
    };

    try {
      if (isEditing) {
        await updateAgent(agent.id, data);
      } else {
        await createAgent(data);
      }
      router.push("/agents");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Clerk User ID *
        </label>
        <input
          name="clerkUserId"
          required
          defaultValue={agent?.clerkUserId}
          placeholder="user_2x..."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          ID del usuario en Clerk. Lo encuentras en el dashboard de Clerk.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Nombre *
          </label>
          <input
            name="name"
            required
            defaultValue={agent?.name}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={agent?.email}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Telefono
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={agent?.phone ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Comision (%)
          </label>
          <input
            name="commissionRate"
            type="number"
            step="0.01"
            defaultValue={agent?.commissionRate ?? "3.00"}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Agente"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
