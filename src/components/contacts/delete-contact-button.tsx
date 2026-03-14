"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteContact } from "@/server/actions/contacts";

export function DeleteContactButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await deleteContact(id);
    router.push("/contacts");
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
        >
          Confirmar
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Eliminar
    </button>
  );
}
