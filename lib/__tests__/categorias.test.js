import { describe, it, expect } from "vitest";
import { categoriaParaSlug, slugParaCategoria } from "../categorias";

describe("categoriaParaSlug", () => {
  it("converte acentos e espaços para kebab-case", () => {
    expect(categoriaParaSlug("Construção e Reforma")).toBe("construcao-e-reforma");
    expect(categoriaParaSlug("Limpeza e Cuidados")).toBe("limpeza-e-cuidados");
    expect(categoriaParaSlug("Tecnologia e Digital")).toBe("tecnologia-e-digital");
    expect(categoriaParaSlug("Ensino e Educação")).toBe("ensino-e-educacao");
    expect(categoriaParaSlug("Beleza e Moda")).toBe("beleza-e-moda");
    expect(categoriaParaSlug("Veículos")).toBe("veiculos");
    expect(categoriaParaSlug("Outros Serviços")).toBe("outros-servicos");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(categoriaParaSlug("")).toBe("");
    expect(categoriaParaSlug(null)).toBe("");
  });

  it("não deixa hífens no início ou fim", () => {
    const s = categoriaParaSlug("  Teste  ");
    expect(s).not.toMatch(/^-|-$/);
  });
});

describe("slugParaCategoria", () => {
  it("resolve cada slug de volta ao nome original", () => {
    expect(slugParaCategoria("construcao-e-reforma")).toBe("Construção e Reforma");
    expect(slugParaCategoria("limpeza-e-cuidados")).toBe("Limpeza e Cuidados");
    expect(slugParaCategoria("tecnologia-e-digital")).toBe("Tecnologia e Digital");
    expect(slugParaCategoria("ensino-e-educacao")).toBe("Ensino e Educação");
    expect(slugParaCategoria("beleza-e-moda")).toBe("Beleza e Moda");
    expect(slugParaCategoria("veiculos")).toBe("Veículos");
    expect(slugParaCategoria("outros-servicos")).toBe("Outros Serviços");
  });

  it("retorna null para slug inexistente", () => {
    expect(slugParaCategoria("categoria-inexistente")).toBeNull();
    expect(slugParaCategoria("")).toBeNull();
    expect(slugParaCategoria(null)).toBeNull();
  });
});
