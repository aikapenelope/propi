"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function CommissionCalculator() {
  const [salePrice, setSalePrice] = useState("");
  const [commissionRate, setCommissionRate] = useState("3");
  const [currency, setCurrency] = useState("USD");

  const price = parseFloat(salePrice) || 0;
  const rate = parseFloat(commissionRate) || 0;
  const commission = price * (rate / 100);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Calculadora de Comisiones
        </h2>
      </div>

      <div className="space-y-3">
        {/* Sale price */}
        <div>
          <label
            htmlFor="calc-price"
            className="block text-xs text-muted-foreground"
          >
            Precio de Venta
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="calc-price"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0"
              className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Commission rate */}
        <div>
          <label
            htmlFor="calc-rate"
            className="block text-xs text-muted-foreground"
          >
            Porcentaje de Comision (%)
          </label>
          <input
            id="calc-rate"
            type="number"
            step="0.1"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Result */}
        <div className="rounded-lg bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Comision</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(commission, currency)}
          </p>
          {price > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {rate}% de {formatCurrency(price, currency)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
