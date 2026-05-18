"use client";

import { Trash2 } from "lucide-react";
import { deleteMagicSearch } from "@/server/actions/magic-searches";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSearchButton({ searchId }: { searchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteMagicSearch(searchId);
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
      className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Eliminar busqueda"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
