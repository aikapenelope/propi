import nodemailer from "nodemailer";

/**
 * Nodemailer transporter configured from env vars.
 * Lazy-initialized on first use.
 */
let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP no esta configurado. Agrega SMTP_HOST, SMTP_USER, SMTP_PASS en las variables de entorno.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function getMailFrom(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@propi.app";
}
