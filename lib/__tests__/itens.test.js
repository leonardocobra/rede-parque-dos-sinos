import { describe, it, expect } from "vitest";
import { formatarPreco, resumoItem, validarItem, MAX_ITENS, PRECO_TIPOS } from "../itens";

describe("formatarPreco", () => {
  it("formata preço fixo em BRL", () => {
    expect(formatarPreco(45, "fixo")).toBe("R$ 45,00");
  });

  it("prefixa 'a partir de' no tipo a_partir", () => {
    expect(formatarPreco(45, "a_partir")).toBe("a partir de R$ 45,00");
  });

  it("mostra 'sob orçamento' ignorando o valor", () => {
    expect(formatarPreco(999, "sob_orcamento")).toBe("sob orçamento");
    expect(formatarPreco(null, "sob_orcamento")).toBe("sob orçamento");
  });

  it("agrupa milhar e mantém 2 casas", () => {
    expect(formatarPreco(1234.5, "fixo")).toBe("R$ 1.234,50");
    expect(formatarPreco(1000000, "fixo")).toBe("R$ 1.000.000,00");
  });

  it("aceita preço como string numérica", () => {
    expect(formatarPreco("30", "fixo")).toBe("R$ 30,00");
  });

  it("degrada para null sem preço (e não sendo sob orçamento)", () => {
    expect(formatarPreco(null, "fixo")).toBeNull();
    expect(formatarPreco(undefined, "a_partir")).toBeNull();
    expect(formatarPreco("", "fixo")).toBeNull();
  });

  it("retorna null para valor não numérico", () => {
    expect(formatarPreco("abc", "fixo")).toBeNull();
  });

  it("trata tipo ausente como valor simples", () => {
    expect(formatarPreco(50)).toBe("R$ 50,00");
  });
});

describe("resumoItem", () => {
  it("junta preço e disponibilidade com separador", () => {
    expect(resumoItem({ preco: 45, preco_tipo: "a_partir", disponibilidade: "agenda aberta" })).toBe(
      "a partir de R$ 45,00 · agenda aberta"
    );
  });

  it("mostra só a disponibilidade quando não há preço", () => {
    expect(resumoItem({ preco: null, disponibilidade: "pronta entrega" })).toBe("pronta entrega");
  });

  it("mostra só o preço quando não há disponibilidade", () => {
    expect(resumoItem({ preco: 45, preco_tipo: "fixo" })).toBe("R$ 45,00");
  });

  it("retorna string vazia para item sem preço nem disponibilidade", () => {
    expect(resumoItem({ titulo: "Item simples" })).toBe("");
    expect(resumoItem(null)).toBe("");
  });
});

describe("validarItem", () => {
  it("exige título", () => {
    expect(validarItem({ titulo: "" }).ok).toBe(false);
    expect(validarItem({ titulo: "   " }).ok).toBe(false);
    expect(validarItem({}).ok).toBe(false);
    expect(validarItem(null).ok).toBe(false);
  });

  it("aceita item com título", () => {
    expect(validarItem({ titulo: "Bolo vulcão" }).ok).toBe(true);
  });
});

describe("constantes", () => {
  it("expõe o teto de itens e os tipos de preço alinhados ao banco", () => {
    expect(MAX_ITENS).toBe(20);
    expect(PRECO_TIPOS.map((t) => t.value)).toEqual(["a_partir", "fixo", "sob_orcamento"]);
  });
});
