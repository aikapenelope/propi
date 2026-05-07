"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Users,
  BarChart3,
  DollarSign,
  Calendar,
  Building2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { getSharedWithMe } from "@/server/actions/metric-shares";
import { getReportDataForUser, type ReportData } from "@/server/actions/reports";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import Link from "next/link";

interface MetricShare {
  id: string;
  agentId: string;
  brokerEmail: string;
  status: string;
  permissions: unknown;
  createdAt: Date;
  revokedAt: Date | null;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TeamReportsPage() {
  const [shares, setShares] = useState<MetricShare[]>([]);
  const [agentReports, setAgentReports] = useState<
    Map<string, ReportData>
  >(new Map());
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Default to current month
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);

  useEffect(() => {
    startTransition(async () => {
      const s = await getSharedWithMe();
      setShares(s as MetricShare[]);

      // Fetch reports for each agent
      const reportsMap = new Map<string, ReportData>();
      for (const share of s) {
        try {
          const report = await getReportDataForUser(share.agentId, {
            startDate,
            endDate,
          });
          reportsMap.set(share.agentId, report);
        } catch {
          // Agent may have revoked or data unavailable
        }
      }
      setAgentReports(reportsMap);
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate totals
  const totals = {
    volume: 0,
    transactions: 0,
    leads: 0,
    appointments: 0,
    commission: 0,
  };

  agentReports.forEach((report) => {
    totals.volume += report.transactions.totalVolume;
    totals.transactions += report.transactions.closed;
    totals.leads += report.pipeline.newLeads;
    totals.appointments += report.activity.appointmentsCreated;
    totals.commission += report.transactions.totalCommission;
  });

  if (isLoading || isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-3 md:px-8 py-4 md:py-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Users className="h-6 w-6" />
          Dashboard de Equipo
        </h1>
        <div className="text-center py-16 bg-[var(--card-bg)] border border-border rounded-2xl">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">
            Ningun agente ha compartido sus metricas contigo
          </p>
          <p className="text-xs text-muted-foreground">
            Los agentes pueden compartir desde Reportes &gt; Compartir Metricas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Dashboard de Equipo
            <InfoTooltip text="Metricas consolidadas de los agentes que compartieron sus datos contigo. Periodo: este mes." />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {shares.length} agente{shares.length !== 1 ? "s" : ""} compartiendo
          </p>
        </div>
        <Link
          href="/reports"
          className="text-xs text-primary hover:underline"
        >
          Mi reporte
        </Link>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <TotalCard
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          label="Volumen Total"
          value={formatCurrency(totals.volume)}
        />
        <TotalCard
          icon={<Building2 className="h-4 w-4 text-primary" />}
          label="Transacciones"
          value={String(totals.transactions)}
        />
        <TotalCard
          icon={<DollarSign className="h-4 w-4 text-amber-400" />}
          label="Comisiones"
          value={formatCurrency(totals.commission)}
        />
        <TotalCard
          icon={<Users className="h-4 w-4 text-blue-400" />}
          label="Leads Nuevos"
          value={String(totals.leads)}
        />
        <TotalCard
          icon={<Calendar className="h-4 w-4 text-purple-400" />}
          label="Citas"
          value={String(totals.appointments)}
        />
      </div>

      {/* Agent breakdown table */}
      <div className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Desglose por Agente
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">Agente</th>
                <th className="text-right px-3 py-3 font-medium">Props Activas</th>
                <th className="text-right px-3 py-3 font-medium">Vendidas</th>
                <th className="text-right px-3 py-3 font-medium">Comision</th>
                <th className="text-right px-3 py-3 font-medium">Leads</th>
                <th className="text-right px-3 py-3 font-medium">Conversion</th>
                <th className="text-right px-5 py-3 font-medium">Citas</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(agentReports.entries()).map(([agentId, report]) => (
                <tr
                  key={agentId}
                  className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {agentId.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {agentId.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="text-right px-3 py-3 text-foreground">
                    {report.summary.activeProperties}
                  </td>
                  <td className="text-right px-3 py-3 text-foreground">
                    {report.transactions.closed}
                  </td>
                  <td className="text-right px-3 py-3 font-medium text-emerald-400">
                    {formatCurrency(report.transactions.totalCommission)}
                  </td>
                  <td className="text-right px-3 py-3 text-foreground">
                    {report.pipeline.newLeads}
                  </td>
                  <td className="text-right px-3 py-3 text-foreground">
                    {report.pipeline.conversionRate}%
                  </td>
                  <td className="text-right px-5 py-3 text-foreground">
                    {report.activity.appointmentsCreated}
                  </td>
                </tr>
              ))}

              {/* Totals row */}
              <tr className="bg-white/[0.03] font-semibold">
                <td className="px-5 py-3 text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Total
                </td>
                <td className="text-right px-3 py-3 text-foreground">
                  {Array.from(agentReports.values()).reduce(
                    (s, r) => s + r.summary.activeProperties,
                    0,
                  )}
                </td>
                <td className="text-right px-3 py-3 text-foreground">
                  {totals.transactions}
                </td>
                <td className="text-right px-3 py-3 text-emerald-400">
                  {formatCurrency(totals.commission)}
                </td>
                <td className="text-right px-3 py-3 text-foreground">
                  {totals.leads}
                </td>
                <td className="text-right px-3 py-3 text-foreground">-</td>
                <td className="text-right px-5 py-3 text-foreground">
                  {totals.appointments}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TotalCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
