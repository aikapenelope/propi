"use client";

import { useState } from "react";
import { Calculator, DollarSign, Percent, Users, Building2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

/**
 * Commission simulator for real estate agents.
 * Pure client-side — no server actions, no DB.
 *
 * Calculates:
 * - Gross commission from property price
 * - Agency/broker split
 * - Agent net commission
 * - IVA (16% Venezuela) if applicable
 */

const OPERATION_OPTIONS = [
  { value: "sale", label: "Venta" },
  { value: "rent", label: "Alquiler" },
];

export default function CommissionsPage() {
  const [price, setPrice] = useState("");
  const [operation, setOperation] = useState("sale");
  const [commissionRate, setCommissionRate] = useState("5");
  const [agencySplit, setAgencySplit] = useState("50");
  const [includeIva, setIncludeIva] = useState(false);

  const priceNum = parseFloat(price.replace(/,/g, "")) || 0;
  const rateNum = parseFloat(commissionRate) || 0;
  const splitNum = parseFloat(agencySplit) || 0;

  const grossCommission = priceNum * (rateNum / 100);
  const agencyAmount = grossCommission * (splitNum / 100);
  const agentAmount = grossCommission - agencyAmount;
  const ivaAmount = includeIva ? grossCommission * 0.16 : 0;
  const agentNet = agentAmount - (includeIva ? agentAmount * 0.16 : 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Simulador de Comisiones
          <InfoTooltip text="Calcula tu comision neta por operacion. Ajusta el porcentaje, el split con la agencia, y el IVA." />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calcula tu comision por operacion inmobiliaria.
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4 mb-8">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Precio del inmueble (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="150,000"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {/* Operation + Rate row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Operacion
            </label>
            <select
              value={operation}
              onChange={(e) => {
                setOperation(e.target.value);
                if (e.target.value === "rent") setCommissionRate("10");
                else setCommissionRate("5");
              }}
              className={inputClass}
            >
              {OPERATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Comision (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className={`${inputClass} pr-8`}
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Agency split */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1">
            Split agencia / agente
            <InfoTooltip text="Porcentaje que se queda la agencia vs lo que recibes tu. 50/50 es el estandar en Venezuela." />
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={agencySplit}
                onChange={(e) => setAgencySplit(e.target.value)}
                className="w-full accent-primary"
              />
            </div>
            <span className="text-sm font-medium text-foreground w-24 text-right">
              {splitNum}% / {100 - splitNum}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Agencia: {splitNum}%
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Agente: {100 - splitNum}%
            </span>
          </div>
        </div>

        {/* IVA toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIncludeIva(!includeIva)}
            className={`relative h-6 w-11 rounded-full transition-colors ${includeIva ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${includeIva ? "translate-x-5" : ""}`}
            />
          </button>
          <span className="text-sm text-foreground flex items-center gap-1.5">
            Incluir IVA (16%)
            <InfoTooltip text="Impuesto al Valor Agregado de Venezuela. Se aplica sobre tu porcion de la comision." />
          </span>
        </div>
      </div>

      {/* Results */}
      {priceNum > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4" style={{ background: "var(--card-bg)" }}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              {operation === "sale" ? "Venta" : "Alquiler"} — {rateNum}% comision
            </div>
            <div className="text-2xl font-bold text-foreground">
              {fmt(priceNum)}
            </div>
          </div>

          {/* Breakdown */}
          <div className="divide-y divide-border">
            <Row label="Comision bruta" value={fmt(grossCommission)} sub={`${rateNum}% del precio`} />
            <Row label="Agencia" value={fmt(agencyAmount)} sub={`${splitNum}% de la comision`} muted />
            <Row label="Agente (bruto)" value={fmt(agentAmount)} sub={`${100 - splitNum}% de la comision`} />
            {includeIva && (
              <Row label="IVA (16%)" value={`-${fmt(ivaAmount)}`} sub="Sobre la comision del agente" muted />
            )}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
              <div>
                <div className="text-sm font-semibold text-primary">Tu comision neta</div>
                <div className="text-xs text-muted-foreground">Lo que recibes</div>
              </div>
              <div className="text-2xl font-bold text-primary">{fmt(agentNet)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, sub, muted }: { label: string; value: string; sub: string; muted?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <div>
        <div className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className={`text-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
