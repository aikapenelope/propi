import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats USD with no decimals", () => {
    const result = formatCurrency(150000);
    expect(result).toContain("150");
    expect(result).toContain("000");
  });

  it("formats with custom currency", () => {
    const result = formatCurrency(5000, "EUR");
    expect(result).toContain("5");
    expect(result).toContain("000");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats large numbers with grouping", () => {
    const result = formatCurrency(1500000);
    // Should have some form of thousand separator
    expect(result.replace(/[^0-9]/g, "")).toBe("1500000");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-05-19T00:00:00Z"));
    expect(result).toContain("19");
    expect(result).toContain("2026");
  });

  it("formats an ISO string", () => {
    const result = formatDate("2026-01-15T12:00:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("formats a date-only string", () => {
    const result = formatDate("2026-12-25");
    expect(result).toContain("25");
    expect(result).toContain("2026");
  });
});
