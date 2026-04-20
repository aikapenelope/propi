"use client";

import { useState, useTransition } from "react";
import { Mail, Send, X, Loader2, Check } from "lucide-react";
import { sendPropertyByEmail } from "@/server/actions/send-property-email";
import { hapticSuccess } from "@/lib/haptics";

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface SendPropertyEmailButtonProps {
  propertyId: string;
  contacts: Contact[];
}

export function SendPropertyEmailButton({
  propertyId,
  contacts,
}: SendPropertyEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const withEmail = contacts.filter((c) => c.email);

  function toggleContact(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSend() {
    if (selected.size === 0) return;
    setResult(null);

    startTransition(async () => {
      try {
        const res = await sendPropertyByEmail(propertyId, [...selected]);
        hapticSuccess();
        setResult(`Enviado a ${res.sent} contacto${res.sent !== 1 ? "s" : ""}.${res.failed > 0 ? ` ${res.failed} fallido${res.failed !== 1 ? "s" : ""}.` : ""}`);
        setTimeout(() => {
          setOpen(false);
          setResult(null);
          setSelected(new Set());
        }, 2000);
      } catch (err) {
        setResult(err instanceof Error ? err.message : "Error al enviar.");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Mail className="h-4 w-4" />
        Enviar por email
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">
          Enviar ficha por email
        </span>
        <button
          onClick={() => { setOpen(false); setResult(null); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {withEmail.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No tienes contactos con email.
        </p>
      ) : (
        <>
          <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
            {withEmail.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleContact(c.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.email}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {result && (
            <p className={`text-xs mb-3 rounded-lg p-2 ${result.startsWith("Enviado") ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
              {result}
            </p>
          )}

          <button
            onClick={handleSend}
            disabled={isPending || selected.size === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : result?.startsWith("Enviado") ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending
              ? "Enviando..."
              : `Enviar a ${selected.size} contacto${selected.size !== 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}
