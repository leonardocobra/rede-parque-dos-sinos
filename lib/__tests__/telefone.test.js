import { describe, it, expect } from "vitest";
import { soDigitos, telefoneCombina, filtrarPorTelefone } from "../telefone";

describe("soDigitos", () => {
  it("remove máscara, espaços e parênteses", () => {
    expect(soDigitos("(12) 98103-4707")).toBe("12981034707");
    expect(soDigitos("12 98103-4707")).toBe("12981034707");
    expect(soDigitos("+55 12 98103 4707")).toBe("5512981034707");
  });

  it("retorna string vazia para valor vazio, nulo ou sem dígitos", () => {
    expect(soDigitos("")).toBe("");
    expect(soDigitos(null)).toBe("");
    expect(soDigitos(undefined)).toBe("");
    expect(soDigitos("abc-")).toBe("");
  });
});

describe("telefoneCombina", () => {
  it("casa independentemente da formatação dos dois lados (bug do cadastro órfão)", () => {
    // salvo sem máscara, buscado com máscara
    expect(telefoneCombina("12981034707", "12 98103-4707")).toBe(true);
    // salvo com máscara, buscado sem máscara
    expect(telefoneCombina("(12) 98103-4707", "12981034707")).toBe(true);
  });

  it("casa por substring de dígitos (busca parcial)", () => {
    expect(telefoneCombina("12981034707", "98103")).toBe(true);
    expect(telefoneCombina("(12) 98103-4707", "4707")).toBe(true);
  });

  it("não casa números diferentes", () => {
    expect(telefoneCombina("12981034707", "999990000")).toBe(false);
  });

  it("é falso quando a busca não tem dígitos ou o telefone é vazio", () => {
    expect(telefoneCombina("12981034707", "")).toBe(false);
    expect(telefoneCombina("12981034707", "abc")).toBe(false);
    expect(telefoneCombina(null, "1298")).toBe(false);
  });
});

describe("filtrarPorTelefone", () => {
  const cadastros = [
    { id: "a", telefone: "12981034707" },
    { id: "b", telefone: "(12) 99999-0000" },
    { id: "c", telefone: "12 98103-4707" },
  ];

  it("retorna todos os cadastros cujos dígitos contêm a busca", () => {
    const r = filtrarPorTelefone(cadastros, "98103-4707");
    expect(r.map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("retorna lista vazia quando a busca não tem dígitos", () => {
    expect(filtrarPorTelefone(cadastros, "   ")).toEqual([]);
    expect(filtrarPorTelefone(cadastros, "abc")).toEqual([]);
  });

  it("tolera lista nula e telefones ausentes", () => {
    expect(filtrarPorTelefone(null, "1298")).toEqual([]);
    expect(filtrarPorTelefone([{ id: "x" }], "1298")).toEqual([]);
  });
});
