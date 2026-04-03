"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { updatePropertyStatus } from "@/server/actions/properties";

interface PublishToggleProps {
  propertyId: string;
  currentStatus: string;
}

export function PublishToggle({ propertyId, currentStatus }: PublishToggleProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDraft = currentStatus === "draft" || currentStatus === "inactive";

  async function handleToggle() {
    setLoading(true);
    try {
      await updatePropertyStatus(
        propertyId,
        isDraft ? "active" : "draft",
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
        isDraft
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {isDraft ? (
        <>
          <Eye className="h-3.5 w-3.5" />
          {loading ? "Publicando..." : "Publicar"}
        </>
      ) : (
        <>
          <EyeOff className="h-3.5 w-3.5" />
          {loading ? "Ocultando..." : "Ocultar"}
        </>
      )}
    </button>
  );
}
