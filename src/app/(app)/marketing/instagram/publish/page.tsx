import { PublishIgForm } from "@/components/marketing/instagram/publish-ig-form";

export default function InstagramPublishPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Publicar en Instagram
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Publica una foto en tu cuenta de Instagram Business. La imagen debe
        estar disponible en una URL publica (puedes usar MinIO con un link
        publico o cualquier CDN).
      </p>
      <div className="max-w-xl">
        <PublishIgForm />
      </div>
    </div>
  );
}
