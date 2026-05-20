import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isBlocked } from "@/lib/plan-gate";

describe("isBlocked", () => {
  beforeEach(() => {
    // Fix "now" to 2026-05-19 for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Allow access cases ---

  it("allows when sessionClaims is null", () => {
    expect(isBlocked(null)).toBe(false);
  });

  it("allows when sessionClaims is undefined", () => {
    expect(isBlocked(undefined)).toBe(false);
  });

  it("allows when metadata is undefined", () => {
    expect(isBlocked({ metadata: undefined })).toBe(false);
  });

  it("allows when metadata is empty object", () => {
    expect(isBlocked({ metadata: {} })).toBe(false);
  });

  it("allows when plan is not set (webhook not fired yet)", () => {
    expect(isBlocked({ metadata: { active: true } })).toBe(false);
  });

  it("allows active trial (not expired)", () => {
    expect(
      isBlocked({
        metadata: { plan: "trial", trialEndsAt: "2026-06-01T00:00:00Z" },
      }),
    ).toBe(false);
  });

  it("allows active pro plan (not expired)", () => {
    expect(
      isBlocked({
        metadata: { plan: "pro", paidUntil: "2026-12-01T00:00:00Z" },
      }),
    ).toBe(false);
  });

  it("allows trial with no trialEndsAt (infinite trial)", () => {
    expect(isBlocked({ metadata: { plan: "trial" } })).toBe(false);
  });

  it("allows pro with no paidUntil (lifetime)", () => {
    expect(isBlocked({ metadata: { plan: "pro" } })).toBe(false);
  });

  // --- Block access cases ---

  it("blocks when active is explicitly false", () => {
    expect(isBlocked({ metadata: { active: false } })).toBe(true);
  });

  it("blocks expired trial", () => {
    expect(
      isBlocked({
        metadata: { plan: "trial", trialEndsAt: "2026-05-18T00:00:00Z" },
      }),
    ).toBe(true);
  });

  it("blocks trial expiring exactly now", () => {
    expect(
      isBlocked({
        metadata: { plan: "trial", trialEndsAt: "2026-05-19T12:00:00Z" },
      }),
    ).toBe(true);
  });

  it("blocks expired pro plan", () => {
    expect(
      isBlocked({
        metadata: { plan: "pro", paidUntil: "2026-05-01T00:00:00Z" },
      }),
    ).toBe(true);
  });

  it("blocks deactivated user even with valid plan", () => {
    // active: false takes priority over plan status
    expect(
      isBlocked({
        metadata: {
          active: false,
          plan: "pro",
          paidUntil: "2027-01-01T00:00:00Z",
        },
      }),
    ).toBe(true);
  });
});
