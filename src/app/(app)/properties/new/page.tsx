import { PropertyForm } from "@/components/properties/property-form";
import { getTags } from "@/server/actions/contacts";

export default async function NewPropertyPage() {
  const availableTags = await getTags();

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Nueva Propiedad
      </h1>
      <div className="max-w-3xl">
        <PropertyForm availableTags={availableTags} />
      </div>
    </div>
  );
}
