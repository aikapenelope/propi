import { FileText, User, Building2 } from "lucide-react";
import { getDocuments } from "@/server/actions/documents";
import { formatDate } from "@/lib/utils";
import { UploadDocumentButton } from "@/components/documents/upload-document-button";

const typeLabels: Record<string, string> = {
  contract: "Contrato",
  id_copy: "Documento ID",
  deed: "Escritura",
  appraisal: "Avaluo",
  floor_plan: "Plano",
  invoice: "Factura",
  other: "Otro",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const documentList = await getDocuments();

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            {documentList.length} documento
            {documentList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <UploadDocumentButton />
      </div>

      {/* Document list */}
      {documentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No hay documentos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube tu primer documento para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentList.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {doc.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{typeLabels[doc.type ?? "other"] ?? doc.type}</span>
                  {doc.sizeBytes && (
                    <span>{formatFileSize(doc.sizeBytes)}</span>
                  )}
                  {doc.contact && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {doc.contact.name}
                    </span>
                  )}
                  {doc.property && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {doc.property.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span className="hidden text-xs text-muted-foreground md:block">
                {formatDate(doc.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
