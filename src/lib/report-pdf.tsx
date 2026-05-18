import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { FullReportData } from "@/server/actions/reports";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  brand: "#0A2B1D",
  brandLight: "#E3E1DC",
  accent: "#059669",
  text: "#1a1a1a",
  muted: "#666666",
  light: "#999999",
  border: "#e5e5e5",
  bgAlt: "#f8f8f8",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.text,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // Cover page
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: colors.brand,
    color: colors.brandLight,
    paddingHorizontal: 50,
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 14,
    marginBottom: 40,
    textAlign: "center",
    opacity: 0.7,
  },
  coverAgent: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  coverPeriod: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 4,
  },
  coverGenerated: {
    fontSize: 10,
    textAlign: "center",
    opacity: 0.4,
    marginTop: 60,
  },
  // Section headers
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
  },
  // KPI cards row
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgAlt,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 2,
  },
  kpiDelta: {
    fontSize: 8,
  },
  // Tables
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.brand,
    color: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  tableCell: {
    fontSize: 8,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableCellRight: {
    fontSize: 8,
    textAlign: "right",
  },
  tableCellRightBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  // Totals row
  totalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.bgAlt,
    borderTopWidth: 2,
    borderTopColor: colors.brand,
    marginTop: 2,
  },
  // Summary text
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 20,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.light,
  },
  // Pipeline bar
  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pipelineLabel: {
    width: 80,
    fontSize: 8,
    color: colors.muted,
  },
  pipelineBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  pipelineBarFill: {
    height: 14,
    backgroundColor: "#3b82f6",
    borderRadius: 3,
    justifyContent: "center",
    paddingLeft: 4,
  },
  pipelineCount: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stageLabels: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  showing: "Mostrando",
  offer: "Oferta",
  closed: "Cerrado",
  lost: "Perdido",
};

const typeLabels: Record<string, string> = {
  apartment: "Apto",
  house: "Casa",
  office: "Oficina",
  commercial: "Local",
  land: "Terreno",
  warehouse: "Galpon",
  other: "Otro",
};

const opLabels: Record<string, string> = {
  sale: "Venta",
  rent: "Alquiler",
  sale_rent: "V/A",
  sell: "Venta",
  lease: "Alquiler",
};

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function deltaText(d: number): string {
  if (d === 0) return "sin cambio";
  return (d > 0 ? "+" : "") + d + "%";
}

function deltaColor(d: number): string {
  if (d > 0) return colors.accent;
  if (d < 0) return "#ef4444";
  return colors.muted;
}

// ---------------------------------------------------------------------------
// Footer component (reused on every page)
// ---------------------------------------------------------------------------

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidencial — Propi CRM</Text>
      <Text style={s.footerText}>
        Generado: {fmtDate(generatedAt)}
      </Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) =>
          `Pagina ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function ReportPDF({ data }: { data: FullReportData }) {
  const maxPipelineCount = Math.max(
    ...data.pipeline.stages.map((st) => st.count),
    1,
  );

  return (
    <Document
      title={`Reporte Propi — ${data.period.startDate} a ${data.period.endDate}`}
      author="Propi CRM"
    >
      {/* ================================================================ */}
      {/* PAGE 1: COVER                                                    */}
      {/* ================================================================ */}
      <Page size="LETTER" style={s.coverPage}>
        <Text style={s.coverTitle}>Reporte de Rendimiento</Text>
        <Text style={s.coverSubtitle}>Propi CRM</Text>
        <Text style={s.coverAgent}>{data.agentName}</Text>
        <Text style={s.coverPeriod}>
          {fmtDate(data.period.startDate)} — {fmtDate(data.period.endDate)}
        </Text>
        <Text style={s.coverGenerated}>
          Generado: {fmtDate(data.generatedAt)}
        </Text>
      </Page>

      {/* ================================================================ */}
      {/* PAGE 2: EXECUTIVE SUMMARY                                        */}
      {/* ================================================================ */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>Resumen Ejecutivo</Text>

        {/* KPI cards */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Volumen Cerrado</Text>
            <Text style={s.kpiValue}>{fmt(data.transactions.totalVolume)}</Text>
            <Text style={[s.kpiDelta, { color: deltaColor(data.comparison.transactionsDelta) }]}>
              {deltaText(data.comparison.transactionsDelta)} vs periodo anterior
            </Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Comisiones</Text>
            <Text style={[s.kpiValue, { color: colors.accent }]}>
              {fmt(data.transactions.totalCommission)}
            </Text>
            <Text style={[s.kpiDelta, { color: colors.muted }]}>
              {data.transactions.closed} transacciones
            </Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Leads Nuevos</Text>
            <Text style={s.kpiValue}>{data.pipeline.newLeads}</Text>
            <Text style={[s.kpiDelta, { color: deltaColor(data.comparison.leadsDelta) }]}>
              {deltaText(data.comparison.leadsDelta)} vs periodo anterior
            </Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Citas</Text>
            <Text style={s.kpiValue}>{data.activity.appointmentsCreated}</Text>
            <Text style={[s.kpiDelta, { color: deltaColor(data.comparison.appointmentsDelta) }]}>
              {deltaText(data.comparison.appointmentsDelta)} vs periodo anterior
            </Text>
          </View>
        </View>

        {/* Summary paragraph */}
        <Text style={s.summaryText}>
          {`En el periodo del ${fmtDate(data.period.startDate)} al ${fmtDate(data.period.endDate)}, ` +
            (data.transactions.closed > 0
              ? `se cerraron ${data.transactions.closed} transacciones por un volumen total de ${fmt(data.transactions.totalVolume)}, generando ${fmt(data.transactions.totalCommission)} en comisiones` +
                (data.transactionSubtotals.avgCommissionRate > 0
                  ? ` (tasa promedio: ${data.transactionSubtotals.avgCommissionRate}%)`
                  : "") +
                ". "
              : "no se cerraron transacciones en este periodo. ") +
            `El pipeline cuenta con ${data.pipeline.stages.reduce((s, st) => s + st.count, 0)} leads activos` +
            (data.pipeline.conversionRate > 0
              ? ` con una tasa de conversion del ${data.pipeline.conversionRate}%`
              : "") +
            `. Se crearon ${data.activity.appointmentsCreated} citas` +
            (data.activity.appointmentsCompleted > 0
              ? ` (${data.activity.appointmentsCompleted} completadas)`
              : "") +
            ` y se agregaron ${data.activity.contactsCreated} contactos nuevos.` +
            (data.inventory.totalActive > 0
              ? ` El inventario activo tiene ${data.inventory.totalActive} propiedades con un precio promedio de ${fmt(data.inventory.avgPrice)}.`
              : "")}
        </Text>

        {/* Property summary */}
        <Text style={s.sectionTitle}>Resumen de Propiedades</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Total</Text>
            <Text style={s.kpiValue}>{data.summary.totalProperties}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Activas</Text>
            <Text style={s.kpiValue}>{data.summary.activeProperties}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Vendidas</Text>
            <Text style={s.kpiValue}>{data.summary.soldProperties}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Alquiladas</Text>
            <Text style={s.kpiValue}>{data.summary.rentedProperties}</Text>
          </View>
        </View>

        <PageFooter generatedAt={data.generatedAt} />
      </Page>

      {/* ================================================================ */}
      {/* PAGE 3: TRANSACTIONS                                             */}
      {/* ================================================================ */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>Transacciones Cerradas</Text>

        {data.transactions.deals.length === 0 ? (
          <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 20 }}>
            Sin transacciones en este periodo
          </Text>
        ) : (
          <View style={s.table}>
            {/* Header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { flex: 3 }]}>Propiedad</Text>
              <Text style={[s.tableHeaderText, { flex: 1 }]}>Operacion</Text>
              <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Precio</Text>
              <Text style={[s.tableHeaderText, { flex: 0.7, textAlign: "right" }]}>Com. %</Text>
              <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Comision</Text>
              <Text style={[s.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Fecha</Text>
            </View>

            {/* Rows */}
            {data.transactions.deals.map((deal, i) => (
              <View key={deal.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 3 }]}>{deal.title}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{opLabels[deal.operation] || deal.operation}</Text>
                <Text style={[s.tableCellRight, { flex: 1.5 }]}>{fmt(deal.soldPrice)}</Text>
                <Text style={[s.tableCellRight, { flex: 0.7 }]}>{deal.commissionRate}%</Text>
                <Text style={[s.tableCellRightBold, { flex: 1.5, color: colors.accent }]}>{fmt(deal.commission)}</Text>
                <Text style={[s.tableCellRight, { flex: 1.2 }]}>{fmtDate(deal.closedAt)}</Text>
              </View>
            ))}

            {/* Subtotals */}
            {data.transactionSubtotals.sales.count > 0 && (
              <View style={s.totalRow}>
                <Text style={[s.tableCellBold, { flex: 3 }]}>Subtotal Ventas ({data.transactionSubtotals.sales.count})</Text>
                <Text style={[s.tableCell, { flex: 1 }]} />
                <Text style={[s.tableCellRightBold, { flex: 1.5 }]}>{fmt(data.transactionSubtotals.sales.volume)}</Text>
                <Text style={[s.tableCell, { flex: 0.7 }]} />
                <Text style={[s.tableCellRightBold, { flex: 1.5, color: colors.accent }]}>{fmt(data.transactionSubtotals.sales.commission)}</Text>
                <Text style={[s.tableCell, { flex: 1.2 }]} />
              </View>
            )}
            {data.transactionSubtotals.rentals.count > 0 && (
              <View style={s.totalRow}>
                <Text style={[s.tableCellBold, { flex: 3 }]}>Subtotal Alquileres ({data.transactionSubtotals.rentals.count})</Text>
                <Text style={[s.tableCell, { flex: 1 }]} />
                <Text style={[s.tableCellRightBold, { flex: 1.5 }]}>{fmt(data.transactionSubtotals.rentals.volume)}</Text>
                <Text style={[s.tableCell, { flex: 0.7 }]} />
                <Text style={[s.tableCellRightBold, { flex: 1.5, color: colors.accent }]}>{fmt(data.transactionSubtotals.rentals.commission)}</Text>
                <Text style={[s.tableCell, { flex: 1.2 }]} />
              </View>
            )}

            {/* Grand total */}
            <View style={[s.totalRow, { backgroundColor: colors.brand }]}>
              <Text style={[s.tableCellBold, { flex: 3, color: colors.white }]}>TOTAL</Text>
              <Text style={[s.tableCell, { flex: 1 }]} />
              <Text style={[s.tableCellRightBold, { flex: 1.5, color: colors.white }]}>{fmt(data.transactions.totalVolume)}</Text>
              <Text style={[s.tableCellRight, { flex: 0.7, color: colors.brandLight }]}>{data.transactionSubtotals.avgCommissionRate}%</Text>
              <Text style={[s.tableCellRightBold, { flex: 1.5, color: colors.brandLight }]}>{fmt(data.transactions.totalCommission)}</Text>
              <Text style={[s.tableCell, { flex: 1.2 }]} />
            </View>
          </View>
        )}

        <PageFooter generatedAt={data.generatedAt} />
      </Page>

      {/* ================================================================ */}
      {/* PAGE 4: PIPELINE                                                 */}
      {/* ================================================================ */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>Pipeline de Leads</Text>

        {/* Pipeline bars */}
        <View style={{ marginBottom: 16 }}>
          {data.pipeline.stages.map((stage) => {
            const pct = Math.max(Math.round((stage.count / maxPipelineCount) * 100), 5);
            return (
              <View key={stage.stage} style={s.pipelineRow}>
                <Text style={s.pipelineLabel}>{stageLabels[stage.stage] || stage.stage}</Text>
                <View style={s.pipelineBarBg}>
                  <View style={[s.pipelineBarFill, { width: `${pct}%` }]}>
                    <Text style={s.pipelineCount}>{stage.count}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Pipeline summary */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Total Leads</Text>
            <Text style={s.kpiValue}>
              {data.pipeline.stages.reduce((sum, st) => sum + st.count, 0)}
            </Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Leads Nuevos (periodo)</Text>
            <Text style={s.kpiValue}>{data.pipeline.newLeads}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Tasa de Conversion</Text>
            <Text style={s.kpiValue}>{data.pipeline.conversionRate}%</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* ACTIVITY COMPARISON                                          */}
        {/* ============================================================ */}
        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Actividad del Periodo</Text>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 3 }]}>Metrica</Text>
            <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Este periodo</Text>
            <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Periodo anterior</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>Cambio</Text>
          </View>
          {data.activityComparison.map((row, i) => (
            <View key={row.metric} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCell, { flex: 3 }]}>{row.metric}</Text>
              <Text style={[s.tableCellRightBold, { flex: 1.5 }]}>{row.current}</Text>
              <Text style={[s.tableCellRight, { flex: 1.5 }]}>{row.previous || "-"}</Text>
              <Text style={[s.tableCellRight, { flex: 1, color: deltaColor(row.delta) }]}>
                {row.delta !== 0 ? deltaText(row.delta) : "-"}
              </Text>
            </View>
          ))}
        </View>

        <PageFooter generatedAt={data.generatedAt} />
      </Page>

      {/* ================================================================ */}
      {/* PAGE 5: ACTIVE INVENTORY                                         */}
      {/* ================================================================ */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>
          Inventario Activo ({data.inventory.totalActive} propiedades)
        </Text>

        {data.inventory.items.length === 0 ? (
          <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 20 }}>
            Sin propiedades activas
          </Text>
        ) : (
          <>
            {/* Summary */}
            <View style={[s.kpiRow, { marginBottom: 16 }]}>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>Propiedades Activas</Text>
                <Text style={s.kpiValue}>{data.inventory.totalActive}</Text>
              </View>
              <View style={s.kpiCard}>
                <Text style={s.kpiLabel}>Precio Promedio</Text>
                <Text style={s.kpiValue}>{fmt(data.inventory.avgPrice)}</Text>
              </View>
            </View>

            {/* Table */}
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderText, { flex: 3 }]}>Propiedad</Text>
                <Text style={[s.tableHeaderText, { flex: 1 }]}>Tipo</Text>
                <Text style={[s.tableHeaderText, { flex: 1 }]}>Operacion</Text>
                <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Precio</Text>
                <Text style={[s.tableHeaderText, { flex: 1.2 }]}>Ciudad</Text>
                <Text style={[s.tableHeaderText, { flex: 0.8, textAlign: "right" }]}>Dias</Text>
              </View>
              {data.inventory.items.map((item, i) => (
                <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{item.title}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{typeLabels[item.type] || item.type}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{opLabels[item.operation] || item.operation}</Text>
                  <Text style={[s.tableCellRight, { flex: 1.5 }]}>{fmt(item.price)}</Text>
                  <Text style={[s.tableCell, { flex: 1.2 }]}>{item.city}</Text>
                  <Text style={[s.tableCellRight, { flex: 0.8 }]}>{item.daysOnMarket}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <PageFooter generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}
