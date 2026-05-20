import { describe, it, expect } from "vitest";
import {
  parseUuid,
  contactSchema,
  propertySchema,
  appointmentSchema,
  taskSchema,
} from "@/lib/validators";

// ---------------------------------------------------------------------------
// parseUuid
// ---------------------------------------------------------------------------

describe("parseUuid", () => {
  it("accepts valid UUID v4", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(parseUuid(uuid)).toBe(uuid);
  });

  it("rejects empty string", () => {
    expect(() => parseUuid("")).toThrow("ID invalido");
  });

  it("rejects non-UUID string", () => {
    expect(() => parseUuid("not-a-uuid")).toThrow("ID invalido");
  });

  it("rejects partial UUID", () => {
    expect(() => parseUuid("550e8400-e29b-41d4")).toThrow("ID invalido");
  });

  it("uses custom label in error message", () => {
    expect(() => parseUuid("bad", "Property ID")).toThrow(
      "Property ID invalido",
    );
  });
});

// ---------------------------------------------------------------------------
// contactSchema
// ---------------------------------------------------------------------------

describe("contactSchema", () => {
  it("validates minimal contact (name only)", () => {
    const result = contactSchema.parse({ name: "Juan Perez" });
    expect(result.name).toBe("Juan Perez");
    expect(result.source).toBe("other");
  });

  it("validates full contact", () => {
    const result = contactSchema.parse({
      name: "Maria Garcia",
      email: "maria@example.com",
      phone: "+58412123456",
      company: "Inmobiliaria XYZ",
      source: "referral",
      prefPropertyType: "apartment",
      prefOperation: "sale",
    });
    expect(result.email).toBe("maria@example.com");
    expect(result.source).toBe("referral");
  });

  it("rejects empty name", () => {
    expect(() => contactSchema.parse({ name: "" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      contactSchema.parse({ name: "Test", email: "not-an-email" }),
    ).toThrow();
  });

  it("accepts empty email (optional)", () => {
    const result = contactSchema.parse({ name: "Test", email: "" });
    expect(result.email).toBeUndefined();
  });

  it("trims whitespace from optional fields", () => {
    const result = contactSchema.parse({ name: "Test", company: "  Acme  " });
    expect(result.company).toBe("Acme");
  });

  it("rejects invalid source enum", () => {
    expect(() =>
      contactSchema.parse({ name: "Test", source: "invalid_source" }),
    ).toThrow();
  });

  it("accepts valid tagIds array", () => {
    const result = contactSchema.parse({
      name: "Test",
      tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.tagIds).toHaveLength(1);
  });

  it("rejects invalid UUID in tagIds", () => {
    expect(() =>
      contactSchema.parse({ name: "Test", tagIds: ["not-a-uuid"] }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// propertySchema
// ---------------------------------------------------------------------------

describe("propertySchema", () => {
  it("validates minimal property (title only)", () => {
    const result = propertySchema.parse({ title: "Apartamento en Altamira" });
    expect(result.title).toBe("Apartamento en Altamira");
    expect(result.type).toBe("apartment");
    expect(result.operation).toBe("sale");
    expect(result.status).toBe("draft");
    expect(result.currency).toBe("USD");
    expect(result.country).toBe("VE");
  });

  it("validates full property", () => {
    const result = propertySchema.parse({
      title: "Casa en La Lagunita",
      type: "house",
      operation: "sale",
      status: "active",
      price: "350000",
      area: "250",
      bedrooms: "4",
      bathrooms: "3",
      parkingSpaces: "2",
      city: "Caracas",
      state: "Miranda",
    });
    expect(result.type).toBe("house");
    expect(result.price).toBe("350000");
  });

  it("rejects empty title", () => {
    expect(() => propertySchema.parse({ title: "" })).toThrow();
  });

  it("rejects title over 500 chars", () => {
    expect(() => propertySchema.parse({ title: "x".repeat(501) })).toThrow();
  });

  it("rejects invalid property type", () => {
    expect(() =>
      propertySchema.parse({ title: "Test", type: "castle" }),
    ).toThrow();
  });

  it("rejects invalid operation", () => {
    expect(() =>
      propertySchema.parse({ title: "Test", operation: "donate" }),
    ).toThrow();
  });

  it("accepts valid externalLinks", () => {
    const result = propertySchema.parse({
      title: "Test",
      externalLinks: ["https://example.com/listing"],
    });
    expect(result.externalLinks).toHaveLength(1);
  });

  it("rejects invalid URLs in externalLinks", () => {
    expect(() =>
      propertySchema.parse({ title: "Test", externalLinks: ["not-a-url"] }),
    ).toThrow();
  });

  it("rejects more than 3 external links", () => {
    expect(() =>
      propertySchema.parse({
        title: "Test",
        externalLinks: [
          "https://a.com",
          "https://b.com",
          "https://c.com",
          "https://d.com",
        ],
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// appointmentSchema
// ---------------------------------------------------------------------------

describe("appointmentSchema", () => {
  const validAppointment = {
    title: "Visita a propiedad",
    startsAt: "2026-06-01T10:00:00",
    endsAt: "2026-06-01T11:00:00",
  };

  it("validates minimal appointment", () => {
    const result = appointmentSchema.parse(validAppointment);
    expect(result.title).toBe("Visita a propiedad");
    expect(result.status).toBe("scheduled");
  });

  it("validates with optional fields", () => {
    const result = appointmentSchema.parse({
      ...validAppointment,
      location: "Altamira, Caracas",
      contactId: "550e8400-e29b-41d4-a716-446655440000",
      status: "confirmed",
    });
    expect(result.location).toBe("Altamira, Caracas");
    expect(result.status).toBe("confirmed");
  });

  it("rejects empty title", () => {
    expect(() =>
      appointmentSchema.parse({ ...validAppointment, title: "" }),
    ).toThrow();
  });

  it("rejects missing startsAt", () => {
    expect(() =>
      appointmentSchema.parse({ title: "Test", endsAt: "2026-06-01T11:00:00" }),
    ).toThrow();
  });

  it("rejects endsAt before startsAt", () => {
    expect(() =>
      appointmentSchema.parse({
        title: "Test",
        startsAt: "2026-06-01T11:00:00",
        endsAt: "2026-06-01T10:00:00",
      }),
    ).toThrow();
  });

  it("rejects endsAt equal to startsAt", () => {
    expect(() =>
      appointmentSchema.parse({
        title: "Test",
        startsAt: "2026-06-01T10:00:00",
        endsAt: "2026-06-01T10:00:00",
      }),
    ).toThrow();
  });

  it("rejects invalid contactId UUID", () => {
    expect(() =>
      appointmentSchema.parse({
        ...validAppointment,
        contactId: "not-a-uuid",
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// taskSchema
// ---------------------------------------------------------------------------

describe("taskSchema", () => {
  it("validates minimal task", () => {
    const result = taskSchema.parse({ title: "Llamar a cliente" });
    expect(result.title).toBe("Llamar a cliente");
  });

  it("validates task with due date", () => {
    const result = taskSchema.parse({
      title: "Enviar contrato",
      dueAt: "2026-06-15",
    });
    expect(result.dueAt).toBe("2026-06-15");
  });

  it("validates task with contact and property", () => {
    const result = taskSchema.parse({
      title: "Seguimiento",
      contactId: "550e8400-e29b-41d4-a716-446655440000",
      propertyId: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.contactId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects empty title", () => {
    expect(() => taskSchema.parse({ title: "" })).toThrow();
  });

  it("rejects title over 500 chars", () => {
    expect(() => taskSchema.parse({ title: "x".repeat(501) })).toThrow();
  });
});
