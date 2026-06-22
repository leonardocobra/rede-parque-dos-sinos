import { describe, it, expect } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("converte acentos e espaços para kebab-case", () => {
    expect(slugify("Parque dos Sinos")).toBe("parque-dos-sinos");
    expect(slugify("Construção e Reforma")).toBe("construcao-e-reforma");
    expect(slugify("Jardim São José")).toBe("jardim-sao-jose");
  });

  it("agrupa variações de caixa no mesmo slug", () => {
    expect(slugify("Parque dos Sinos")).toBe(slugify("parque dos sinos"));
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(slugify("")).toBe("");
    expect(slugify(null)).toBe("");
    expect(slugify(undefined)).toBe("");
  });

  it("não deixa hífens no início ou fim", () => {
    expect(slugify("  Teste  ")).toBe("teste");
    expect(slugify("--Teste--")).toBe("teste");
  });
});
