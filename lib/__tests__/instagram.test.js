import { describe, it, expect } from "vitest";
import { instagramUrl } from "../instagram";

describe("instagramUrl", () => {
  it("monta URL a partir de um handle simples", () => {
    expect(instagramUrl("joao.silva")).toBe("https://instagram.com/joao.silva");
  });

  it("remove o @ inicial", () => {
    expect(instagramUrl("@joao")).toBe("https://instagram.com/joao");
  });

  it("aceita URL completa com https e www", () => {
    expect(instagramUrl("https://www.instagram.com/joao")).toBe("https://instagram.com/joao");
  });

  it("aceita instagram.com sem protocolo", () => {
    expect(instagramUrl("instagram.com/joao")).toBe("https://instagram.com/joao");
  });

  it("remove barra final, query e fragmento", () => {
    expect(instagramUrl("instagram.com/joao/?hl=pt#x")).toBe("https://instagram.com/joao");
  });

  it("remove espaços ao redor e internos", () => {
    expect(instagramUrl("  @ joao ")).toBe("https://instagram.com/joao");
  });

  it("retorna null para valor vazio, nulo ou não-string", () => {
    expect(instagramUrl("")).toBeNull();
    expect(instagramUrl("   ")).toBeNull();
    expect(instagramUrl(null)).toBeNull();
    expect(instagramUrl(undefined)).toBeNull();
    expect(instagramUrl(123)).toBeNull();
  });

  it("retorna null para handle inválido", () => {
    expect(instagramUrl("@@@")).toBeNull();
    expect(instagramUrl("joão silva!")).toBeNull();
  });
});
