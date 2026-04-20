"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check, ExternalLink } from "lucide-react";
import { upsertSocialAccount, deleteSocialAccount } from "@/server/actions/social-accounts";
import { hapticSuccess } from "@/lib/haptics";

interface ResendConfigFormProps {
  existing?: {
    apiKey: string;
  };
}

export function ResendConfigForm({ existing }: ResendConfigFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? "");
  const [success, setSuccess] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    startTransition(async () => {
      await upsertSocialAccount({
        platform: "resend",
        accessToken: apiKey.trim(),
        platformAccountId: "resend",
        accountName: "Resend",
      });
      hapticSuccess();
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await deleteSocialAccount("resend");
      setApiKey("");
      router.refresh();
    });
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono";

  return (
    <div>
      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="re_..."
          className={inputClass}
        />
        <button
          type="submit"
          disabled={isPending || !apiKey.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {success ? "Guardado" : "Guardar"}
        </button>
      </form>

      {existing && (
        <button
          onClick={handleDisconnect}
          disabled={isPending}
          className="mt-2 text-xs text-destructive hover:underline disabled:opacity-50"
        >
          Desconectar
        </button>
      )}

      <div className="mt-3 text-xs text-muted-foreground space-y-1">
        <p>
          Cada usuario configura su propia API key. Free tier: 3,000 emails/mes.
        </p>
        <a
          href="https://resend.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Obtener API key en resend.com
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
