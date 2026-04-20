"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { ImportContactsDialog } from "./import-contacts-dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function ContactsHeader({ count }: { count: number }) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            {count} contacto{count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
            <InfoTooltip text="Importa contactos desde un archivo CSV, vCard (.vcf), o directamente desde tu telefono (Chrome Android)." />
          </button>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Contacto</span>
          </Link>
        </div>
      </div>

      <ImportContactsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  );
}
