/**
 * Google Calendar deep link generator.
 *
 * Builds a URL that opens Google Calendar with the event pre-filled.
 * No API, no OAuth, no dependencies — just a URL with query parameters.
 *
 * Google Calendar URL format:
 * https://calendar.google.com/calendar/render?action=TEMPLATE
 *   &text=Title
 *   &dates=20260517T140000/20260517T150000  (UTC, no dashes/colons)
 *   &details=Description
 *   &location=Place
 */

/** Format a Date to Google Calendar's required format: YYYYMMDDTHHmmSSZ */
function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}/u, "");
}

/** Build a Google Calendar deep link for an appointment. */
export function buildGoogleCalendarUrl(params: {
  title: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  location?: string;
}): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set(
    "dates",
    `${formatGCalDate(params.startsAt)}/${formatGCalDate(params.endsAt)}`,
  );

  if (params.description) {
    url.searchParams.set("details", params.description);
  }
  if (params.location) {
    url.searchParams.set("location", params.location);
  }

  return url.toString();
}
