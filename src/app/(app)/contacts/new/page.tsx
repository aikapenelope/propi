import { ContactForm } from "@/components/contacts/contact-form";
import { getTags } from "@/server/actions/contacts";

export default async function NewContactPage() {
  const availableTags = await getTags();

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Nuevo Contacto
      </h1>
      <div className="max-w-2xl">
        <ContactForm availableTags={availableTags} />
      </div>
    </div>
  );
}
