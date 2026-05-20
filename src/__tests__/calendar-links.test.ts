import { describe, it, expect } from "vitest";
import { buildGoogleCalendarUrl } from "@/lib/calendar-links";

describe("buildGoogleCalendarUrl", () => {
  const baseParams = {
    title: "Visita a propiedad",
    startsAt: new Date("2026-06-01T14:00:00Z"),
    endsAt: new Date("2026-06-01T15:00:00Z"),
  };

  it("generates a valid Google Calendar URL", () => {
    const url = buildGoogleCalendarUrl(baseParams);
    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
  });

  it("includes the title", () => {
    const url = buildGoogleCalendarUrl(baseParams);
    expect(url).toContain("text=Visita+a+propiedad");
  });

  it("formats dates in Google Calendar format (no dashes/colons)", () => {
    const url = buildGoogleCalendarUrl(baseParams);
    // Should contain dates like 20260601T140000Z/20260601T150000Z
    expect(url).toContain("20260601T140000Z");
    expect(url).toContain("20260601T150000Z");
  });

  it("includes description when provided", () => {
    const url = buildGoogleCalendarUrl({
      ...baseParams,
      description: "Llevar documentos",
    });
    expect(url).toContain("details=Llevar+documentos");
  });

  it("includes location when provided", () => {
    const url = buildGoogleCalendarUrl({
      ...baseParams,
      location: "Altamira, Caracas",
    });
    expect(url).toContain("location=Altamira");
  });

  it("omits description when not provided", () => {
    const url = buildGoogleCalendarUrl(baseParams);
    expect(url).not.toContain("details=");
  });

  it("omits location when not provided", () => {
    const url = buildGoogleCalendarUrl(baseParams);
    expect(url).not.toContain("location=");
  });

  it("encodes special characters in title", () => {
    const url = buildGoogleCalendarUrl({
      ...baseParams,
      title: "Reunión & firma",
    });
    expect(url).toContain("Reuni%C3%B3n+%26+firma");
  });
});
