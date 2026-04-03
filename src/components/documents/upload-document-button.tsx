"use client";

import { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import {
  getDocumentUploadKey,
  createDocument,
} from "@/server/actions/documents";
import { getContacts } from "@/server/actions/contacts";
import { getProperties } from "@/server/actions/properties";

type Contact = { id: string; name: string };
type Property = { id: string; title: string };

const typeOptions = [
  { value: "contract", label: "Contrato" },
  { value: "id_copy", label: "Documento ID" },
  { value: "deed", label: "Escritura" },
  { value: "appraisal", label: "Avaluo" },
  { value: "floor_plan", label: "Plano" },
  { value: "invoice", label: "Factura" },
  { value: "other", label: "Otro" },
];

export function UploadDocumentButton() {
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("other");
  const [contactId, setContactId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showForm) {
      getContacts().then((c) => setContacts(c.map((x) => ({ id: x.id, name: x.name }))));
      getProperties().then((p) => setProperties(p.map((x) => ({ id: x.id, title: x.title }))));
    }
  }, [showForm]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setShowForm(true);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const { key } = await getDocumentUploadKey(file.name);

      // Upload via server-side API route (MinIO is on private network)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);
      formData.append("bucket", "docs");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      await createDocument({
        name: file.name,
        type: docType,
        key,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        contactId: contactId || undefined,
        propertyId: propertyId || undefined,
      });

      setShowForm(false);
      setFile(null);
      setDocType("other");
      setContactId("");
      setPropertyId("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCancel() {
    setShowForm(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const selectClass =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
      />

      {!showForm && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Subir Documento
        </button>
      )}

      {showForm && file && (
        <div className="rounded-lg border border-border p-4 max-w-md">
          <p className="mb-3 text-sm font-medium text-foreground">
            {file.name}{" "}
            <span className="text-muted-foreground">
              ({(file.size / 1024).toFixed(0)} KB)
            </span>
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Tipo de documento
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className={selectClass}
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground">
                Vincular a contacto (opcional)
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className={selectClass}
              >
                <option value="">Ninguno</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground">
                Vincular a propiedad (opcional)
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className={selectClass}
              >
                <option value="">Ninguna</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir"}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
