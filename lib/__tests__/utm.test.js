import { describe, it, expect } from "vitest";
import { adicionarUtm, CANAIS_DIVULGACAO, FONTE_PERFIL } from "../utm";

describe("adicionarUtm", () => {
  const base = "https://arede.app.br/profissional/123";

  it("acrescenta utm_source", () => {
    expect(adicionarUtm(base, "instagram")).toBe(
      "https://arede.app.br/profissional/123?utm_source=instagram"
    );
  });

  it("acrescenta medium e campaign quando informados", () => {
    expect(adicionarUtm(base, "instagram", { medium: "bio", campaign: "junho" })).toBe(
      "https://arede.app.br/profissional/123?utm_source=instagram&utm_medium=bio&utm_campaign=junho"
    );
  });

  it("preserva query existente sem duplicar", () => {
    const r = adicionarUtm(`${base}?ref=x`, "whatsapp");
    expect(r).toContain("ref=x");
    expect(r).toContain("utm_source=whatsapp");
  });

  it("sobrescreve utm_source já presente em vez de duplicar", () => {
    const r = adicionarUtm(`${base}?utm_source=antigo`, "facebook");
    expect(r).toBe("https://arede.app.br/profissional/123?utm_source=facebook");
  });

  it("sem source, retorna a URL intacta", () => {
    expect(adicionarUtm(base, "")).toBe(base);
  });
});

describe("CANAIS_DIVULGACAO", () => {
  it("todo canal tem id, rotulo e source", () => {
    for (const c of CANAIS_DIVULGACAO) {
      expect(c.id).toBeTruthy();
      expect(c.rotulo).toBeTruthy();
      expect(c.source).toBeTruthy();
      expect(c.dica).toBeTruthy();
    }
  });
});

describe("FONTE_PERFIL", () => {
  it("é a fonte do link genérico do dono (bucket próprio, não 'direto')", () => {
    expect(FONTE_PERFIL).toBe("perfil");
    expect(adicionarUtm("https://arede.app.br/profissional/1", FONTE_PERFIL)).toContain(
      "utm_source=perfil"
    );
  });
});
