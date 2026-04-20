import { describe, expect, it } from "vitest";
import { isValidPhone, normalizeJmbg, normalizePhone } from "@/lib/registration";

describe("registration helpers", () => {
  it("normalizeJmbg prihvata 13 cifara", () => {
    expect(normalizeJmbg("2902990170028")).toBe("2902990170028");
    expect(normalizeJmbg("290 299 0170028")).toBe("2902990170028");
  });

  it("normalizeJmbg odbija ostalo", () => {
    expect(normalizeJmbg("123")).toBeNull();
    expect(normalizeJmbg("")).toBeNull();
  });

  it("normalizePhone skraćuje razmake", () => {
    expect(normalizePhone("  +387 61  000  000  ")).toBe("+387 61 000 000");
  });

  it("isValidPhone", () => {
    expect(isValidPhone("+38761000000")).toBe(true);
    expect(isValidPhone("061")).toBe(false);
  });
});
