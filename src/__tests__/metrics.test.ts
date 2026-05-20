import { describe, it, expect } from "vitest";
import { normalizeRoutePath } from "@/lib/metrics";

describe("normalizeRoutePath", () => {
  it("replaces UUID v4 with [id]", () => {
    expect(
      normalizeRoutePath("/properties/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("/properties/[id]");
  });

  it("replaces multiple UUIDs", () => {
    expect(
      normalizeRoutePath(
        "/contacts/550e8400-e29b-41d4-a716-446655440000/notes/660e8400-e29b-41d4-a716-446655440001",
      ),
    ).toBe("/contacts/[id]/notes/[id]");
  });

  it("normalizes /api/images catch-all route", () => {
    expect(
      normalizeRoutePath("/api/images/user_abc/properties/uuid/photo.jpg"),
    ).toBe("/api/images/[...key]");
  });

  it("normalizes sign-in catch-all segments", () => {
    expect(normalizeRoutePath("/sign-in/factor-one")).toBe("/sign-in/[...]");
  });

  it("normalizes sign-up catch-all segments", () => {
    expect(normalizeRoutePath("/sign-up/verify-email")).toBe("/sign-up/[...]");
  });

  it("preserves paths without dynamic segments", () => {
    expect(normalizeRoutePath("/api/health")).toBe("/api/health");
  });

  it("preserves /api/metrics", () => {
    expect(normalizeRoutePath("/api/metrics")).toBe("/api/metrics");
  });

  it("preserves /dashboard", () => {
    expect(normalizeRoutePath("/dashboard")).toBe("/dashboard");
  });

  it("handles UUID in the middle of a path", () => {
    expect(
      normalizeRoutePath(
        "/properties/550e8400-e29b-41d4-a716-446655440000/edit",
      ),
    ).toBe("/properties/[id]/edit");
  });

  it("handles /p/[id] public property page", () => {
    expect(
      normalizeRoutePath("/p/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("/p/[id]");
  });

  it("is case-insensitive for UUIDs", () => {
    expect(
      normalizeRoutePath("/contacts/550E8400-E29B-41D4-A716-446655440000"),
    ).toBe("/contacts/[id]");
  });
});
