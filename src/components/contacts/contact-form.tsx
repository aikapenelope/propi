"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createContact,
  updateContact,
  type ContactFormData,
} from "@/server/actions/contacts";
import { TagSelector } from "@/components/ui/tag-selector";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const sourceOptions = [
  { value: "website", label: "Sitio Web" },
  { value: "referral", label: "Referido" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "portal", label: "Portal Inmobiliario" },
  { value: "walk_in", label: "Visita Directa" },
  { value: "phone", label: "Telefono" },
  { value: "other", label: "Otro" },
];

const propertyTypeOptions = [
  { value: "", label: "Sin preferencia" },
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "office", label: "Oficina" },
  { value: "warehouse", label: "Bodega" },
  { value: "other", label: "Otro" },
];

const operationOptions = [
  { value: "", label: "Sin preferencia" },
  { value: "sale", label: "Comprar" },
  { value: "rent", label: "Alquilar" },
  { value: "sale_rent", label: "Comprar o Alquilar" },
];

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface ContactFormProps {
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
    source: string | null;
    prefPropertyType: string | null;
    prefCity: string | null;
    prefBudgetMax: string | null;
    prefOperation: string | null;
    birthDate: Date | null;
  };
  selectedTagIds?: string[];
  availableTags: Tag[];
}

export function ContactForm({
  contact,
  selectedTagIds = [],
  availableTags,
}: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);

  const isEditing = !!contact;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: ContactFormData = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      company: (formData.get("company") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      source: (formData.get("source") as string) || undefined,
      prefPropertyType: (formData.get("prefPropertyType") as string) || undefined,
      prefCity: (formData.get("prefCity") as string) || undefined,
      prefBudgetMax: (formData.get("prefBudgetMax") as string) || undefined,
      prefOperation: (formData.get("prefOperation") as string) || undefined,
      birthDate: (formData.get("birthDate") as string) || undefined,
      tagIds,
    };

    try {
      if (isEditing) {
        await updateContact(contact.id, data);
        router.push(`/contacts/${contact.id}`);
      } else {
        const newContact = await createContact(data);
        router.push(`/contacts/${newContact.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          Nombre *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={contact?.name}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Email & Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-foreground"
          >
            Telefono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={contact?.phone ?? ""}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium text-foreground"
        >
          Empresa
        </label>
        <input
          id="company"
          name="company"
          type="text"
          defaultValue={contact?.company ?? ""}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Source */}
      <div>
        <label
          htmlFor="source"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          Fuente
          <InfoTooltip text="De donde llego este contacto. Te ayuda a medir que canal genera mas leads." />
        </label>
        <select
          id="source"
          name="source"
          defaultValue={contact?.source ?? "other"}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {sourceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Birthday */}
      <div>
        <label
          htmlFor="birthDate"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          Fecha de nacimiento
          <InfoTooltip text="Opcional. Recibiras una notificacion el dia de su cumpleanos." />
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={
            contact?.birthDate
              ? new Date(contact.birthDate).toISOString().slice(0, 10)
              : ""
          }
          className="mt-1 h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Tags */}
      <TagSelector
        availableTags={availableTags}
        selectedIds={tagIds}
        onToggle={toggleTag}
      />

      {/* Search Preferences (for property matching) */}
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-3">
          Preferencias de busqueda
          <InfoTooltip text="Opcional. Si llenas estas preferencias, Propi puede sugerirte propiedades compatibles con este contacto." />
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Opcional. Permite encontrar propiedades compatibles con este contacto.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prefPropertyType"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Tipo de propiedad
            </label>
            <select
              id="prefPropertyType"
              name="prefPropertyType"
              defaultValue={contact?.prefPropertyType ?? ""}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {propertyTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="prefOperation"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Operacion
            </label>
            <select
              id="prefOperation"
              name="prefOperation"
              defaultValue={contact?.prefOperation ?? ""}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {operationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="prefCity"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Ciudad preferida
            </label>
            <input
              id="prefCity"
              name="prefCity"
              type="text"
              defaultValue={contact?.prefCity ?? ""}
              placeholder="Caracas, Valencia..."
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="prefBudgetMax"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1"
            >
              Presupuesto maximo (USD)
              <InfoTooltip text="En dolares. Se usa para el matching automatico con propiedades." />
            </label>
            <input
              id="prefBudgetMax"
              name="prefBudgetMax"
              type="number"
              min="0"
              step="1000"
              defaultValue={contact?.prefBudgetMax ?? ""}
              placeholder="150000"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-foreground"
        >
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={contact?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading
            ? "Guardando..."
            : isEditing
              ? "Actualizar Contacto"
              : "Crear Contacto"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
