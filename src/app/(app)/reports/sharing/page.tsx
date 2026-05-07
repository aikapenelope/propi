"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Share2,
  Mail,
  Trash2,
  Plus,
  Loader2,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getMyShares,
  createMetricShare,
  revokeMetricShare,
  deleteMetricShare,
  getMyScheduledReports,
  createScheduledReport,
  toggleScheduledReport,
  deleteScheduledReport,
} from "@/server/actions/metric-shares";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface MetricShare {
  id: string;
  agentId: string;
  brokerEmail: string;
  status: "pending" | "active" | "revoked";
  permissions: unknown;
  createdAt: Date;
  revokedAt: Date | null;
}

interface ScheduledReport {
  id: string;
  userId: string;
  recipientEmail: string;
  frequency: "weekly" | "monthly";
  active: boolean;
  lastSentAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
}

export default function SharingSettingsPage() {
  const [shares, setShares] = useState<MetricShare[]>([]);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newReportEmail, setNewReportEmail] = useState("");
  const [newFrequency, setNewFrequency] = useState<"weekly" | "monthly">("monthly");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [s, r] = await Promise.all([
        getMyShares(),
        getMyScheduledReports(),
      ]);
      setShares(s as MetricShare[]);
      setReports(r as ScheduledReport[]);
    });
  }, []);

  function handleAddShare() {
    if (!newEmail.trim()) return;
    startTransition(async () => {
      await createMetricShare({ brokerEmail: newEmail });
      const s = await getMyShares();
      setShares(s as MetricShare[]);
      setNewEmail("");
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeMetricShare(id);
      const s = await getMyShares();
      setShares(s as MetricShare[]);
    });
  }

  function handleDeleteShare(id: string) {
    startTransition(async () => {
      await deleteMetricShare(id);
      const s = await getMyShares();
      setShares(s as MetricShare[]);
    });
  }

  function handleAddReport() {
    if (!newReportEmail.trim()) return;
    startTransition(async () => {
      await createScheduledReport({
        recipientEmail: newReportEmail,
        frequency: newFrequency,
      });
      const r = await getMyScheduledReports();
      setReports(r as ScheduledReport[]);
      setNewReportEmail("");
    });
  }

  function handleToggleReport(id: string) {
    startTransition(async () => {
      await toggleScheduledReport(id);
      const r = await getMyScheduledReports();
      setReports(r as ScheduledReport[]);
    });
  }

  function handleDeleteReport(id: string) {
    startTransition(async () => {
      await deleteScheduledReport(id);
      const r = await getMyScheduledReports();
      setReports(r as ScheduledReport[]);
    });
  }

  const inputClass =
    "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="max-w-[800px] mx-auto px-3 md:px-8 py-4 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Share2 className="h-6 w-6" />
          Compartir Metricas
          <InfoTooltip text="Comparte tus metricas con tu broker o lider de equipo. Ellos veran un resumen de tu rendimiento sin acceso a datos de contactos." />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Autoriza a tu broker a ver tus metricas de rendimiento
        </p>
      </div>

      {/* Metric Shares */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 mb-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Acceso a metricas
        </h2>

        {/* Add new share */}
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
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Agregar
          </button>
        </div>

        {/* List */}
        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No has compartido metricas con nadie
          </p>
        ) : (
          <div className="space-y-2">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {share.brokerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {share.status === "active" && (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Activo
                        </>
                      )}
                      {share.status === "revoked" && (
                        <>
                          <XCircle className="h-3 w-3 text-red-400" />
                          Revocado
                        </>
                      )}
                      {share.status === "pending" && (
                        <>
                          <Clock className="h-3 w-3 text-amber-400" />
                          Pendiente
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {share.status === "active" && (
                    <button
                      onClick={() => handleRevoke(share.id)}
                      disabled={isPending}
                      className="h-8 px-3 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Revocar
                    </button>
                  )}
                  {share.status === "revoked" && (
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      disabled={isPending}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Reports */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Reportes automaticos
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Envia tu reporte periodicamente por email
        </p>

        {/* Add new scheduled report */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="email"
            placeholder="Email del destinatario"
            value={newReportEmail}
            onChange={(e) => setNewReportEmail(e.target.value)}
            className={`${inputClass} flex-1 min-w-[200px]`}
          />
          <select
            value={newFrequency}
            onChange={(e) =>
              setNewFrequency(e.target.value as "weekly" | "monthly")
            }
            className={inputClass}
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
          <button
            onClick={handleAddReport}
            disabled={isPending || !newReportEmail.trim()}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Crear
          </button>
        </div>

        {/* List */}
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No tienes reportes automaticos configurados
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {report.recipientEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.frequency === "weekly" ? "Semanal" : "Mensual"}
                      {report.nextRunAt &&
                        ` - Proximo: ${new Date(report.nextRunAt).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleReport(report.id)}
                    disabled={isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${report.active ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${report.active ? "translate-x-5" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    disabled={isPending}
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
