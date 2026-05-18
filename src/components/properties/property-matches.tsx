"use client";

import { useState, useTransition } from "react";
import { Users, Sparkles, Phone, Mail, Loader2 } from "lucide-react";
import { findMatchingContacts } from "@/server/actions/property-matching";

interface MatchedContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  total: number;
}

export function PropertyMatches({ propertyId }: { propertyId: string }) {
  const [matches, setMatches] = useState<MatchedContact[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFind() {
    startTransition(async () => {
      const results = await findMatchingContacts(propertyId);
      setMatches(results);
    });
  }

  if (matches === null) {
    return (
      <button
        onClick={handleFind}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Buscar contactos compatibles
      </button>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Contactos compatibles
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          No hay contactos con preferencias que coincidan. Agrega preferencias
          (tipo, ciudad, presupuesto) a tus contactos para activar el matching.
        </p>
        <button
          onClick={() => setMatches(null)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Buscar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {matches.length} contacto{matches.length !== 1 ? "s" : ""} compatible{matches.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setMatches(null)}
          className="text-xs text-primary hover:underline"
        >
          Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {matches.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {contact.name}
              </p>
              <p className="text-xs text-primary">
                {contact.score}/{contact.total} criterios
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1.5">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
