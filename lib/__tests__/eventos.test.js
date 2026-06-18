import { describe, it, expect } from "vitest";
import { parseUtm, derivarOrigem } from "../eventos";

describe("parseUtm", () => {
  it("extrai os três campos utm de uma query string", () => {
    expect(parseUtm("?utm_source=instagram&utm_medium=bio&utm_campaign=lancamento")).toEqual({
      utm_source: "instagram",
      utm_medium: "bio",
      utm_campaign: "lancamento",
    });
  });

  it("aceita query sem '?' inicial", () => {
    expect(parseUtm("utm_source=google")).toMatchObject({ utm_source: "google" });
  });

  it("retorna null para campos ausentes", () => {
    expect(parseUtm("")).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    });
  });

  it("trata valor vazio como null", () => {
    expect(parseUtm("?utm_source=").utm_source).toBeNull();
  });
});

describe("derivarOrigem", () => {
  it("sem referrer é direto", () => {
    expect(derivarOrigem("", "arede.app.br")).toBe("direto");
  });

  it("referrer inválido cai para direto", () => {
    expect(derivarOrigem("não-é-url", "arede.app.br")).toBe("direto");
  });

  it("navegação interna não troca a origem (null)", () => {
    expect(derivarOrigem("https://arede.app.br/catalogo", "arede.app.br")).toBeNull();
  });

  it("reconhece Instagram", () => {
    expect(derivarOrigem("https://www.instagram.com/", "arede.app.br")).toBe("instagram");
    expect(derivarOrigem("https://l.instagram.com/?u=x", "arede.app.br")).toBe("instagram");
  });

  it("agrupa buscadores como busca", () => {
    expect(derivarOrigem("https://www.google.com/search?q=x", "arede.app.br")).toBe("busca");
    expect(derivarOrigem("https://www.bing.com/", "arede.app.br")).toBe("busca");
  });

  it("trata links de mensageiros/sociais como compartilhado", () => {
    expect(derivarOrigem("https://wa.me/", "arede.app.br")).toBe("compartilhado");
    expect(derivarOrigem("https://t.co/abc", "arede.app.br")).toBe("compartilhado");
    expect(derivarOrigem("https://m.facebook.com/", "arede.app.br")).toBe("compartilhado");
  });

  it("guarda o host de outras origens externas", () => {
    expect(derivarOrigem("https://algumblog.com.br/post", "arede.app.br")).toBe("algumblog.com.br");
  });
});
