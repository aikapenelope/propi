/**
 * WhatsApp appointment reminder template.
 *
 * Template stored in localStorage with variables:
 * {nombre}, {motivo}, {fecha}, {hora}, {ubicacion}
 *
 * Pattern adapted from Aurora's whatsapp.ts.
 */

const STORAGE_KEY = "propi:whatsapp-appt-template";

export const DEFAULT_TEMPLATE =
  "Hola {nombre}, te recuerdo tu cita: {motivo}, el {fecha} a las {hora}.{ubicacion} Te espero!";

/** Get the current template (from localStorage or default). */
export function getTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE;
}

/** Save a custom template to localStorage. */
export function saveTemplate(template: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, template);
}

/** Reset to the default template. */
export function resetTemplate(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Build the WhatsApp message from template + variables. */
export function buildMessage(vars: {
  nombre: string;
  motivo: string;
  fecha: string;
  hora: string;
  ubicacion?: string;
}): string {
  const template = getTemplate();
  return template
    .replace(/\{nombre\}/gu, vars.nombre)
    .replace(/\{motivo\}/gu, vars.motivo)
    .replace(/\{fecha\}/gu, vars.fecha)
    .replace(/\{hora\}/gu, vars.hora)
    .replace(
      /\{ubicacion\}/gu,
      vars.ubicacion ? ` Lugar: ${vars.ubicacion}.` : "",
    );
}

/** Build a wa.me URL that opens WhatsApp with the message pre-filled. */
export function buildWhatsAppUrl(
  phone: string,
  vars: {
    nombre: string;
    motivo: string;
    fecha: string;
    hora: string;
    ubicacion?: string;
  },
): string {
  const cleanPhone = phone.replace(/\D/gu, "");
  const message = buildMessage(vars);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
