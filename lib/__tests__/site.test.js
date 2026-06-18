import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { siteUrl, absUrl } from "../site";

describe("siteUrl", () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("usa NEXT_PUBLIC_SITE_URL quando definida", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://arede.com.br";
    expect(siteUrl()).toBe("https://arede.com.br");
  });

  it("prefixa https quando falta protocolo e remove barra final", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "arede.com.br/";
    expect(siteUrl()).toBe("https://arede.com.br");
  });

  it("cai para VERCEL_URL (com https) quando não há env explícita", () => {
    process.env.VERCEL_URL = "rede-abc.vercel.app";
    expect(siteUrl()).toBe("https://rede-abc.vercel.app");
  });

  it("prioriza NEXT_PUBLIC_SITE_URL sobre VERCEL_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://arede.com.br";
    process.env.VERCEL_URL = "rede-abc.vercel.app";
    expect(siteUrl()).toBe("https://arede.com.br");
  });

  it("usa localhost em desenvolvimento sem env", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("absUrl", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://arede.com.br";
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("monta URL absoluta a partir de um caminho", () => {
    expect(absUrl("/profissional/1")).toBe("https://arede.com.br/profissional/1");
  });

  it("normaliza caminho sem barra inicial", () => {
    expect(absUrl("sitemap.xml")).toBe("https://arede.com.br/sitemap.xml");
  });

  it("retorna a raiz por padrão", () => {
    expect(absUrl()).toBe("https://arede.com.br/");
  });
});
