"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAppointment } from "@/server/actions/appointments";

export function DeleteAppointmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await deleteAppointment(id);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors"
        >
          Si
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded border border-border px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      title="Eliminar cita"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
