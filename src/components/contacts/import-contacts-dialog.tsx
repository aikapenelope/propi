"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Check, AlertTriangle, X, Smartphone } from "lucide-react";
import {
  parseCSV,
  parseVCard,
  importContacts,
} from "@/server/actions/import-contacts";
import type { ImportedContact, ImportResult } from "@/server/actions/import-contacts";

// Contact Picker API type declarations (Chrome Android 80+)
interface ContactPickerContact {
  name?: string[];
  tel?: string[];
  email?: string[];
}

interface ContactsManager {
  select(
    properties: string[],
    options?: { multiple?: boolean },
  ): Promise<ContactPickerContact[]>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

type Step = "upload" | "preview" | "importing" | "done";

export function ImportContactsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ImportedContact[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Detect Contact Picker API (Chrome Android 80+).
  // Computed once per render — no effect needed since navigator doesn't change.
  const hasContactPicker =
    typeof window !== "undefined" &&
    "contacts" in navigator &&
    "ContactsManager" in window;

  if (!open) return null;

  function reset() {
    setStep("upload");
    setParsed([]);
    setResult(null);
    setError(null);
    setFileName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const ext = file.name.toLowerCase();

      let contacts: ImportedContact[];
      if (ext.endsWith(".vcf") || ext.endsWith(".vcard")) {
        contacts = await parseVCard(text);
      } else if (ext.endsWith(".csv") || ext.endsWith(".txt")) {
        contacts = await parseCSV(text);
      } else {
        setError("Formato no soportado. Usa archivos .csv o .vcf");
        return;
      }

      if (contacts.length === 0) {
        setError("No se encontraron contactos en el archivo.");
        return;
      }

      setParsed(contacts);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al leer el archivo");
    }
  }

  /** Import contacts directly from the phone's contact list (Chrome Android). */
  async function handlePickFromDevice() {
    if (!navigator.contacts) return;
    setError(null);

    try {
      const picked = await navigator.contacts.select(
        ["name", "tel", "email"],
        { multiple: true },
      );

      if (picked.length === 0) return;

      const contacts: ImportedContact[] = picked
        .filter((c) => c.name?.[0])
        .map((c) => ({
          name: c.name![0],
          phone: c.tel?.[0] || undefined,
          email: c.email?.[0] || undefined,
        }));

      if (contacts.length === 0) {
        setError("No se encontraron contactos con nombre.");
        return;
      }

      setFileName(`${contacts.length} contactos del telefono`);
      setParsed(contacts);
      setStep("preview");
    } catch {
      // User cancelled the picker — do nothing
    }
  }

  async function handleImport() {
    setStep("importing");
    try {
      const res = await importContacts(parsed);
      setResult(res);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      setStep("preview");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Importar Contactos
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step: Upload */}
          {step === "upload" && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arrastra un archivo o haz click para seleccionar
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CSV (.csv) o vCard (.vcf)
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.vcf,.vcard,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {/* Contact Picker API: native phone contact selector (Chrome Android) */}
              {hasContactPicker && (
                <button
                  onClick={handlePickFromDevice}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  <Smartphone className="h-4 w-4 text-primary" />
                  Importar desde contactos del telefono
                </button>
              )}

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Formatos soportados:</p>
                <ul className="space-y-1 ml-3 list-disc">
                  <li><strong>CSV</strong> — Exportado desde Excel, Google Sheets, u otro CRM. Debe tener columna de nombre.</li>
                  <li><strong>vCard (.vcf)</strong> — Exportado desde tu telefono (Android/iPhone), WhatsApp, o Google Contacts.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{fileName}</span>
                <span className="text-muted-foreground">
                  — {parsed.length} contacto{parsed.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Telefono</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Empresa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 50).map((c, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-foreground">{c.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.email || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.company || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 50 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                    ...y {parsed.length - 50} mas
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={reset}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Importar {parsed.length} contacto{parsed.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-foreground">
                Importando {parsed.length} contactos...
              </p>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && result && (
            <div>
              <div className="flex flex-col items-center gap-3 py-6">
                <Check className="h-10 w-10 text-green-500" />
                <p className="text-lg font-bold text-foreground">
                  {result.imported} contacto{result.imported !== 1 ? "s" : ""} importado{result.imported !== 1 ? "s" : ""}
                </p>
                {result.skipped > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {result.skipped} omitido{result.skipped !== 1 ? "s" : ""} (sin nombre)
                  </p>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="mb-4 max-h-32 overflow-y-auto rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                  {result.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
