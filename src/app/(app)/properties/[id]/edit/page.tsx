import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProperty } from "@/server/actions/properties";
import { getTags } from "@/server/actions/contacts";
import { PropertyForm } from "@/components/properties/property-form";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { id } = await params;
  const [property, availableTags] = await Promise.all([
    getProperty(id),
    getTags(),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6">
      <Link
        href={`/properties/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Editar Propiedad
      </h1>
      <div className="max-w-3xl">
        <PropertyForm
          property={property}
          selectedTagIds={property.propertyTags.map((pt) => pt.tag.id)}
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}
