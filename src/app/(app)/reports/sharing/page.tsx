"use client";

import { useState, useEffect, useTransition } from "react";
import { Share2, Mail, Trash2, Plus, Loader2, XCircle, CheckCircle2 } from "lucide-react";
import {
  getMyShares,
  createMetricShare,
  revokeMetricShare,
  deleteMetricShare,
} from "@/server/actions/metric-shares";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import Link from "next/link";

type ShareStatus = "pending" | "active" | "revoked";

interface MetricShare {
  id: string;
  brokerEmail: string;
  status: ShareStatus;
  createdAt: Date;
}

export default function SharingPage() {
  const [shares, setShares] = useState<MetricShare[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const s = await getMyShares();
      setShares(s as MetricShare[]);
    });
  }, []);

  function handleAddShare() {
    if (!newEmail.trim()) return;
    startTransition(async () => {
      await createMetricShare({ brokerEmail: newEmail });
      setShares((await getMyShares()) as MetricShare[]);
      setNewEmail("");
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeMetricShare(id);
      setShares((await getMyShares()) as MetricShare[]);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMetricShare(id);
      setShares((await getMyShares()) as MetricShare[]);
    });
  }

  const inputClass =
    "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="max-w-[800px] mx-auto px-3 md:px-8 py-4 md:py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Compartir Metricas
            <InfoTooltip text="Comparte tus metricas con tu broker. Ellos veran un resumen sin acceso a datos de contactos." />
          </h1>
          <Link href="/reports" className="text-xs text-primary hover:underline">
            Volver a Reportes
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Autoriza a tu broker a ver tus metricas de rendimiento
        </p>
      </div>

      {/* Metric Shares */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Acceso a metricas</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Email del broker"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddShare()}
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleAddShare}
            disabled={isPending || !newEmail.trim()}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Agregar
          </button>
        </div>

        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No has compartido metricas con nadie</p>
        ) : (
          <div className="space-y-2">
            {shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{share.brokerEmail}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {share.status === "active" && <><CheckCircle2 className="h-3 w-3 text-emerald-400" />Activo</>}
                      {share.status === "revoked" && <><XCircle className="h-3 w-3 text-red-400" />Revocado</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {share.status === "active" && (
                    <button onClick={() => handleRevoke(share.id)} disabled={isPending} className="h-8 px-3 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                      Revocar
                    </button>
                  )}
                  {share.status === "revoked" && (
                    <button onClick={() => handleDelete(share.id)} disabled={isPending} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info about PDF reports */}
      <div className="mt-6 rounded-xl border border-border p-4 text-sm text-muted-foreground">
        <p>
          Los reportes se descargan como PDF desde{" "}
          <Link href="/reports" className="text-primary hover:underline">Reportes</Link>.
          Ya no se envian por email automaticamente.
        </p>
      </div>
    </div>
  );
}
