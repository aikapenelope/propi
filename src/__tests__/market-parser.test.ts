import { describe, it, expect } from "vitest";
import { parseMarketQuery } from "@/lib/market-parser";

describe("parseMarketQuery", () => {
  it("extracts property type", () => {
    const result = parseMarketQuery("apartamento en Caracas");
    expect(result.propertyType).toBe("Apartamento");
  });

  it("extracts operation", () => {
    const result = parseMarketQuery("casa en venta");
    expect(result.operation).toBe("Venta");
    expect(result.propertyType).toBe("Casa");
  });

  it("extracts neighborhood and defaults city to Caracas", () => {
    const result = parseMarketQuery("apto en Altamira");
    expect(result.neighborhood).toBe("Altamira");
    expect(result.city).toBe("Caracas");
  });

  it("extracts city when no neighborhood matches", () => {
    const result = parseMarketQuery("casa en Maracaibo");
    expect(result.city).toBe("Maracaibo");
    expect(result.neighborhood).toBeNull();
  });

  it("extracts area range", () => {
    const result = parseMarketQuery("apto 80-120m2 en Chacao");
    expect(result.areaMin).toBe(80);
    expect(result.areaMax).toBe(120);
  });

  it("extracts single area with +/- 20% range", () => {
    const result = parseMarketQuery("apartamento 100m2");
    expect(result.areaMin).toBe(80);
    expect(result.areaMax).toBe(120);
  });

  it("extracts bedrooms", () => {
    const result = parseMarketQuery("apto 3 habitaciones en Altamira");
    expect(result.bedrooms).toBe(3);
  });

  it("extracts bathrooms", () => {
    const result = parseMarketQuery("casa 2 banos");
    expect(result.bathrooms).toBe(2);
  });

  it("extracts price range", () => {
    const result = parseMarketQuery("apto $100K-200K en Caracas");
    expect(result.priceMin).toBe(100000);
    expect(result.priceMax).toBe(200000);
  });

  it("extracts 'menos de' price", () => {
    const result = parseMarketQuery("apto menos de $150K");
    expect(result.priceMax).toBe(150000);
    expect(result.priceMin).toBeNull();
  });

  it("extracts 'mas de' price", () => {
    const result = parseMarketQuery("casa mas de $200K");
    expect(result.priceMin).toBe(200000);
    expect(result.priceMax).toBeNull();
  });

  it("handles rent operation", () => {
    const result = parseMarketQuery("oficina en alquiler en Las Mercedes");
    expect(result.operation).toBe("Alquiler");
    expect(result.propertyType).toBe("Oficina");
    expect(result.neighborhood).toBe("Las Mercedes");
  });

  it("preserves original query as freeText", () => {
    const query = "apartamento 80m2 en Altamira";
    const result = parseMarketQuery(query);
    expect(result.freeText).toBe(query);
  });

  it("returns nulls for unrecognized input", () => {
    const result = parseMarketQuery("hola mundo");
    expect(result.propertyType).toBeNull();
    expect(result.operation).toBeNull();
    expect(result.city).toBeNull();
    expect(result.neighborhood).toBeNull();
  });
});
