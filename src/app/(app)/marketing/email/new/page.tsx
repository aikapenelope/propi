import { CampaignComposer } from "@/components/marketing/email/campaign-composer";
import { getTags } from "@/server/actions/contacts";

export default async function NewCampaignPage() {
  const tags = await getTags();

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Nueva Campana de Email
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Compone tu email y selecciona el segmento de contactos. Si no
        seleccionas un tag, se enviara a todos los contactos con email.
      </p>
      <div className="max-w-2xl">
        <CampaignComposer tags={tags} />
      </div>
    </div>
  );
}
