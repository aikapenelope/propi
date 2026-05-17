"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Searchable contact picker with autocomplete.
 *
 * Replaces plain <select> dropdowns for contact selection.
 * Supports two modes:
 *
 * 1. Form mode (name prop): renders a hidden input for FormData submission.
 *    <ContactPicker name="contactId" contacts={contacts} defaultValue={id} />
 *
 * 2. Controlled mode (value + onChange): parent manages state.
 *    <ContactPicker contacts={contacts} value={id} onChange={setId} />
 *
 * Features:
 * - Type-to-search with accent normalization (María matches "maria")
 * - Shows name + email/phone as secondary text
 * - Max 5 suggestions
 * - Click outside or Escape closes dropdown
 * - Clear button to reset selection
 */

export interface ContactPickerItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface ContactPickerProps {
  contacts: ContactPickerItem[];
  /** Field name for form submission (renders hidden input). */
  name?: string;
  /** Controlled value (contact ID). */
  value?: string;
  /** Callback when selection changes (controlled mode). */
  onChange?: (contactId: string) => void;
  /** Initial value for uncontrolled/form mode. */
  defaultValue?: string | null;
  /** Placeholder text. */
  placeholder?: string;
  /** Additional CSS class for the input. */
  className?: string;
}

/** Normalize a string for accent-insensitive comparison. */
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

export function ContactPicker({
  contacts,
  name,
  value: controlledValue,
  onChange,
  defaultValue,
  placeholder = "Buscar contacto...",
  className,
}: ContactPickerProps) {
  const isControlled = controlledValue !== undefined;
  const initialId = isControlled ? controlledValue : (defaultValue ?? "");
  const initialContact = contacts.find((c) => c.id === initialId);

  const [selectedId, setSelectedId] = useState(initialId);
  const [query, setQuery] = useState(initialContact?.name ?? "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync controlled value
  useEffect(() => {
    if (isControlled) {
      setSelectedId(controlledValue);
      const contact = contacts.find((c) => c.id === controlledValue);
      setQuery(contact?.name ?? "");
    }
  }, [controlledValue, contacts, isControlled]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore selected name if user typed but didn't pick
        if (selectedId) {
          const contact = contacts.find((c) => c.id === selectedId);
          if (contact) setQuery(contact.name);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedId, contacts]);

  const selectContact = useCallback(
    (contact: ContactPickerItem) => {
      setSelectedId(contact.id);
      setQuery(contact.name);
      setOpen(false);
      onChange?.(contact.id);
    },
    [onChange],
  );

  function clearSelection() {
    setSelectedId("");
    setQuery("");
    setOpen(false);
    onChange?.("");
    inputRef.current?.focus();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(val.length >= 1);
    // Clear selection when user edits the text
    if (selectedId) {
      setSelectedId("");
      onChange?.("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Filter contacts by query
  const needle = normalize(query);
  const suggestions =
    open && needle.length >= 1
      ? contacts
          .filter((c) => {
            const haystack = normalize(
              [c.name, c.email, c.phone].filter(Boolean).join(" "),
            );
            return haystack.includes(needle);
          })
          .slice(0, 5)
      : [];

  const inputClass =
    className ??
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div ref={wrapperRef} className="relative">
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={selectedId} />}

      {/* Visible search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 1 && !selectedId && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass}
        />
        {selectedId && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Limpiar seleccion"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectContact(c)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.name}
                </p>
                {(c.email || c.phone) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {c.email || c.phone}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {open && needle.length >= 2 && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-background shadow-lg p-3">
          <p className="text-xs text-muted-foreground text-center">
            No se encontraron contactos
          </p>
        </div>
      )}
    </div>
  );
}
