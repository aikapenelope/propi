"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createProperty,
  updateProperty,
  type PropertyFormData,
} from "@/server/actions/properties";

const typeOptions = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "office", label: "Oficina" },
  { value: "warehouse", label: "Bodega" },
  { value: "other", label: "Otro" },
];

const operationOptions = [
  { value: "sale", label: "Venta" },
  { value: "rent", label: "Arriendo" },
  { value: "sale_rent", label: "Venta y Arriendo" },
];

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activa" },
  { value: "reserved", label: "Reservada" },
  { value: "sold", label: "Vendida" },
  { value: "rented", label: "Arrendada" },
  { value: "inactive", label: "Inactiva" },
];

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface PropertyFormProps {
  property?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    operation: string;
    status: string;
    price: string | null;
    currency: string | null;
    area: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parkingSpaces: number | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  selectedTagIds?: string[];
  availableTags: Tag[];
}

export function PropertyForm({
  property,
  selectedTagIds = [],
  availableTags,
}: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);

  const isEditing = !!property;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data: PropertyFormData = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      type: (fd.get("type") as string) || undefined,
      operation: (fd.get("operation") as string) || undefined,
      status: (fd.get("status") as string) || undefined,
      price: (fd.get("price") as string) || undefined,
      currency: (fd.get("currency") as string) || undefined,
      area: (fd.get("area") as string) || undefined,
      bedrooms: (fd.get("bedrooms") as string) || undefined,
      bathrooms: (fd.get("bathrooms") as string) || undefined,
      parkingSpaces: (fd.get("parkingSpaces") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      city: (fd.get("city") as string) || undefined,
      state: (fd.get("state") as string) || undefined,
      zipCode: (fd.get("zipCode") as string) || undefined,
      country: (fd.get("country") as string) || undefined,
      tagIds,
    };

    try {
      if (isEditing) {
        await updateProperty(property.id, data);
        router.push(`/properties/${property.id}`);
      } else {
        const newProp = await createProperty(data);
        router.push(`/properties/${newProp.id}`);
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

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Titulo *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={property?.title}
          className={inputClass}
        />
      </div>

      {/* Type, Operation, Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-foreground">
            Tipo
          </label>
          <select id="type" name="type" defaultValue={property?.type ?? "apartment"} className={inputClass}>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="operation" className="block text-sm font-medium text-foreground">
            Operacion
          </label>
          <select id="operation" name="operation" defaultValue={property?.operation ?? "sale"} className={inputClass}>
            {operationOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            Estado
          </label>
          <select id="status" name="status" defaultValue={property?.status ?? "draft"} className={inputClass}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price, Currency, Area */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground">
            Precio
          </label>
          <input id="price" name="price" type="number" step="0.01" defaultValue={property?.price ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-foreground">
            Moneda
          </label>
          <select id="currency" name="currency" defaultValue={property?.currency ?? "USD"} className={inputClass}>
            <option value="USD">USD</option>
            <option value="COP">COP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-foreground">
            Area (m²)
          </label>
          <input id="area" name="area" type="number" step="0.01" defaultValue={property?.area ?? ""} className={inputClass} />
        </div>
      </div>

      {/* Bedrooms, Bathrooms, Parking */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-foreground">
            Habitaciones
          </label>
          <input id="bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-foreground">
            Banos
          </label>
          <input id="bathrooms" name="bathrooms" type="number" defaultValue={property?.bathrooms ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="parkingSpaces" className="block text-sm font-medium text-foreground">
            Parqueaderos
          </label>
          <input id="parkingSpaces" name="parkingSpaces" type="number" defaultValue={property?.parkingSpaces ?? ""} className={inputClass} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground">
          Direccion
        </label>
        <input id="address" name="address" type="text" defaultValue={property?.address ?? ""} className={inputClass} />
      </div>

      {/* City, State, Zip, Country */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground">Ciudad</label>
          <input id="city" name="city" type="text" defaultValue={property?.city ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-foreground">Departamento</label>
          <input id="state" name="state" type="text" defaultValue={property?.state ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-foreground">Codigo Postal</label>
          <input id="zipCode" name="zipCode" type="text" defaultValue={property?.zipCode ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground">Pais</label>
          <input id="country" name="country" type="text" defaultValue={property?.country ?? "CO"} className={inputClass} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Descripcion
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={property?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground">Etiquetas</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: tagIds.includes(tag.id) ? `${tag.color}30` : "transparent",
                  borderColor: tag.color ?? "#6366f1",
                  color: tag.color ?? "#6366f1",
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Propiedad"}
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
