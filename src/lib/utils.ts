import { clsx, type ClassValue } from "clsx";

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format currency for display. */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date for display. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
