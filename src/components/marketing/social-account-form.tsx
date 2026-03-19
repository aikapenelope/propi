"use client";

import { useState } from "react";
import {
  upsertSocialAccount,
  deleteSocialAccount,
} from "@/server/actions/social-accounts";

interface SocialAccountFormProps {
  platform: "instagram" | "facebook";
  existing?: {
    platformAccountId: string;
    accountName: string | null;
    accessToken: string;
    tokenExpiresAt?: string;
  };
}

export function SocialAccountForm({
  platform,
  existing,
}: SocialAccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const idLabel =
    platform === "instagram"
      ? "Instagram Business Account ID"
      : "Facebook Page ID";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await upsertSocialAccount({
        platform,
        accessToken: fd.get("accessToken") as string,
        platformAccountId: fd.get("platformAccountId") as string,
        accountName: (fd.get("accountName") as string) || undefined,
        tokenExpiresAt: (fd.get("tokenExpiresAt") as string) || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await deleteSocialAccount(platform);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-foreground">
          {idLabel} *
        </label>
        <input
          name="platformAccountId"
          required
          defaultValue={existing?.platformAccountId}
          placeholder="17841400000000000"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground">
          Nombre de cuenta
        </label>
        <input
          name="accountName"
          defaultValue={existing?.accountName ?? ""}
          placeholder="@tu_cuenta"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground">
          Access Token (long-lived) *
        </label>
        <div className="relative">
          <input
            name="accessToken"
            required
            type={showToken ? "text" : "password"}
            defaultValue={existing?.accessToken}
            placeholder="EAAxxxxxxx..."
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            {showToken ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground">
          Fecha de expiracion del token
        </label>
        <input
          name="tokenExpiresAt"
          type="date"
          defaultValue={
            existing?.tokenExpiresAt
              ? existing.tokenExpiresAt.split("T")[0]
              : ""
          }
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : existing ? "Actualizar" : "Conectar"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading}
            className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
          >
            Desconectar
          </button>
        )}
      </div>
    </form>
  );
}
