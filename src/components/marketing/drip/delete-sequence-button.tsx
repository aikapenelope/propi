"use client";

import { Trash2 } from "lucide-react";
import { deleteDripSequence } from "@/server/actions/drip-campaigns";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSequenceButton({ sequenceId }: { sequenceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Eliminar esta secuencia? Los contactos inscritos seran desinscritos.")) return;
    setLoading(true);
    try {
      await deleteDripSequence(sequenceId);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
