/**
 * Feature flags for Propi CRM.
 *
 * ENABLE_META_INBOX: When true, shows Inbox, Instagram API, Facebook API,
 * and Meta token configuration. When false, these are hidden and replaced
 * with assisted publishing (direct links to platforms).
 *
 * Set via environment variable. Defaults to false (hidden).
 * To enable: add NEXT_PUBLIC_ENABLE_META_INBOX=true in Coolify env vars.
 */
export const ENABLE_META_INBOX =
  process.env.NEXT_PUBLIC_ENABLE_META_INBOX === "true";
