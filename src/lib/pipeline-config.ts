/**
 * Lead pipeline status configuration.
 * Separated from server actions because "use server" files
 * can only export async functions.
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "showing"
  | "offer"
  | "closed"
  | "lost";

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string }
> = {
  new: { label: "Nuevo", color: "#6366f1" },
  contacted: { label: "Contactado", color: "#3b82f6" },
  qualified: { label: "Calificado", color: "#8b5cf6" },
  showing: { label: "Mostrando", color: "#f59e0b" },
  offer: { label: "Oferta", color: "#f97316" },
  closed: { label: "Cerrado", color: "#22c55e" },
  lost: { label: "Perdido", color: "#ef4444" },
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[];
