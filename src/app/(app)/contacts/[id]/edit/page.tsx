import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContact, getTags } from "@/server/actions/contacts";
import { getAgents } from "@/server/actions/agents";
import { ContactForm } from "@/components/contacts/contact-form";

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({
  params,
}: EditContactPageProps) {
  const { id } = await params;
  const [contact, availableTags, agents] = await Promise.all([
    getContact(id),
    getTags(),
    getAgents(),
  ]);

  if (!contact) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6">
      <Link
        href={`/contacts/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Editar Contacto
      </h1>
      <div className="max-w-2xl">
        <ContactForm
          contact={contact}
          selectedTagIds={contact.contactTags.map((ct) => ct.tag.id)}
          availableTags={availableTags}
          agents={agents.map((a) => ({ id: a.id, name: a.name }))}
        />
      </div>
    </div>
  );
}
