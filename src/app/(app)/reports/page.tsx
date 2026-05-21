"use client";

import { useState, useTransition } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Building2,
  Loader2,
} from "lucide-react";
import { getReportData, type ReportData } from "@/server/actions/reports";
import { InfoTooltip } from "@/components/ui/info-tooltip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PeriodPreset = "month" | "quarter" | "year" | "custom";

const stageLabels: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  showing: "Mostrando",
  offer: "Oferta",
  closed: "Cerrado",
  lost: "Perdido",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a Date to YYYY-MM-DD using the browser's local timezone components.
 *
 * toISOString() always returns UTC, so after 8pm Venezuela time (UTC-4) it
 * would return tomorrow's date and cause the report range to overshoot by one
 * day. Using getFullYear/getMonth/getDate reads the device-local date instead.
 */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getPresetDates(preset: PeriodPreset): { start: string; end: string } {
  const now = new Date();
  let start: Date;
  const end: Date = now;

  switch (preset) {
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: toLocalDateStr(start),
    end: toLocalDateStr(end),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const dates =
      preset === "custom"
        ? { start: customStart, end: customEnd }
        : getPresetDates(preset);

    if (!dates.start || !dates.end) return;

    startTransition(async () => {
      const data = await getReportData({
        startDate: dates.start,
        endDate: dates.end,
      });
      setReport(data);
    });
  }

  function handleExportCSV() {
    if (!report) return;
    const rows = [
      ["Propiedad", "Operacion", "Precio Cierre", "Comision %", "Comision $", "Fecha Cierre"],
      ...report.transactions.deals.map((d) => [
        `"${d.title}"`,
        d.operation,
        d.soldPrice.toString(),
        d.commissionRate.toString(),
        d.commission.toFixed(2),
        d.closedAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-propi-${report.period.startDate}-a-${report.period.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputClass =
    "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6 print:px-0 print:py-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            Reportes
            <InfoTooltip text="Genera reportes de tu actividad por periodo. Incluye transacciones, pipeline, actividad y comparativa." />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analiza tu rendimiento por periodo
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5 mb-6 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Periodo
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PeriodPreset)}
              className={inputClass}
            >
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {preset === "custom" && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generar
          </button>

          {report && (
            <>
              <button onClick={handleExportCSV} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                CSV
              </button>
              <a
                href={`/api/reports/pdf?start=${report.period.startDate}&end=${report.period.endDate}`}
                download
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </a>
            </>
          )}
        </div>
      </div>

      {/* Report content */}
      {report && (
        <div className="space-y-6">
          {/* Print header (only visible when printing) */}
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold">Reporte Propi</h1>
            <p className="text-sm text-gray-500">{report.period.startDate} a {report.period.endDate}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<DollarSign className="h-4 w-4 text-emerald-400" />} label="Volumen Cerrado" value={fmt(report.transactions.totalVolume)} delta={report.comparison.transactionsDelta} />
            <MetricCard icon={<Building2 className="h-4 w-4 text-primary" />} label="Transacciones" value={String(report.transactions.closed)} delta={report.comparison.transactionsDelta} />
            <MetricCard icon={<Users className="h-4 w-4 text-blue-400" />} label="Leads Nuevos" value={String(report.pipeline.newLeads)} delta={report.comparison.leadsDelta} />
            <MetricCard icon={<Calendar className="h-4 w-4 text-amber-400" />} label="Citas" value={String(report.activity.appointmentsCreated)} delta={report.comparison.appointmentsDelta} />
          </div>

          {/* Transactions + Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transactions */}
            <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Transacciones Cerradas
              </h2>
              {report.transactions.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin transacciones en este periodo</p>
              ) : (
                <div className="space-y-2">
                  {report.transactions.deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.operation === "sale" ? "Venta" : "Alquiler"} — {fmtDate(deal.closedAt)}
                        </p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-bold text-emerald-400">{fmt(deal.commission)}</p>
                        <p className="text-xs text-muted-foreground">{deal.commissionRate}% de {fmt(deal.soldPrice)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-border flex justify-between">
                    <span className="text-sm font-medium text-foreground">Total Comisiones</span>
                    <span className="text-sm font-bold text-emerald-400">{fmt(report.transactions.totalCommission)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline */}
            <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Pipeline de Leads
              </h2>
              <div className="space-y-2 mb-4">
                {report.pipeline.stages.map((s) => {
                  const maxCount = Math.max(...report.pipeline.stages.map((st) => st.count), 1);
                  const width = Math.max(Math.round((s.count / maxCount) * 100), 5);
                  return (
                    <div key={s.stage} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{stageLabels[s.stage] || s.stage}</span>
                      <div className="flex-1 h-6 bg-white/[0.03] rounded-md overflow-hidden">
                        <div className="h-full bg-blue-500/30 rounded-md flex items-center px-2" style={{ width: `${width}%` }}>
                          <span className="text-xs font-medium text-foreground">{s.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-border flex justify-between text-sm">
                <span className="text-muted-foreground">Conversion</span>
                <span className="font-bold text-foreground">{report.pipeline.conversionRate}%</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Actividad del Periodo
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ActivityStat label="Citas creadas" value={report.activity.appointmentsCreated} />
              <ActivityStat label="Citas completadas" value={report.activity.appointmentsCompleted} />
              <ActivityStat label="Contactos nuevos" value={report.activity.contactsCreated} />
              <ActivityStat label="Notas" value={report.activity.notesTaken} />
              <ActivityStat label="Campanas email" value={report.activity.emailsSent} />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !isPending && (
        <div className="text-center py-16">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Selecciona un periodo y genera tu reporte</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: number }) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center">{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <DeltaBadge value={delta} />
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">sin cambio</span>;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value}%
    </span>
  );
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/[0.02]">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
