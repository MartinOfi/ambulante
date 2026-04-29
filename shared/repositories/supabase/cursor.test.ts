import { describe, it, expect } from "vitest";
import {
  encodeOrderHistoryCursor,
  decodeOrderHistoryCursor,
  type OrderHistoryCursor,
} from "./cursor";

const SAMPLE: OrderHistoryCursor = {
  createdAt: "2026-04-29T12:34:56.789Z",
  id: 12345,
};

describe("OrderHistoryCursor", () => {
  it("round-trip encode → decode preserva los campos", () => {
    const encoded = encodeOrderHistoryCursor(SAMPLE);
    expect(decodeOrderHistoryCursor(encoded)).toEqual(SAMPLE);
  });

  it("decode de string vacío devuelve null", () => {
    expect(decodeOrderHistoryCursor("")).toBeNull();
  });

  it("decode de basura devuelve null sin throwear", () => {
    expect(decodeOrderHistoryCursor("not-a-valid-base64-payload!!!")).toBeNull();
  });

  it("decode de JSON válido pero schema inválido devuelve null", () => {
    const bogus = Buffer.from(JSON.stringify({ foo: "bar" }), "utf8").toString("base64url");
    expect(decodeOrderHistoryCursor(bogus)).toBeNull();
  });

  it("decode de createdAt no-ISO devuelve null", () => {
    const bogus = Buffer.from(
      JSON.stringify({ createdAt: "2026-04-29", id: 1 }),
      "utf8",
    ).toString("base64url");
    expect(decodeOrderHistoryCursor(bogus)).toBeNull();
  });

  it("decode de id negativo devuelve null", () => {
    const bogus = Buffer.from(
      JSON.stringify({ createdAt: "2026-04-29T00:00:00.000Z", id: -1 }),
      "utf8",
    ).toString("base64url");
    expect(decodeOrderHistoryCursor(bogus)).toBeNull();
  });

  it("encode produce strings base64url-safe", () => {
    const encoded = encodeOrderHistoryCursor(SAMPLE);
    // base64url no usa +, /, ni = padding.
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
