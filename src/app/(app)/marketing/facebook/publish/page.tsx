import { PublishFbForm } from "@/components/marketing/facebook/publish-fb-form";

export default function FacebookPublishPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Publicar en Facebook
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Publica un post en tu pagina de Facebook. Puedes incluir un link
        opcional.
      </p>
      <div className="max-w-xl">
        <PublishFbForm />
      </div>
    </div>
  );
}
