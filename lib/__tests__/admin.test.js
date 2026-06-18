import { describe, it, expect } from "vitest";
import { parseAdminEmails, isAdmin, computeVisaoOferta } from "../admin";

describe("parseAdminEmails", () => {
  it("normaliza, separa por vírgula e remove vazios", () => {
    expect(parseAdminEmails(" A@X.com , b@x.com ,, ")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("string vazia vira lista vazia", () => {
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("isAdmin", () => {
  const allow = "leo@arede.app.br, admin@x.com";

  it("aceita e-mail na allowlist (case-insensitive)", () => {
    expect(isAdmin("LEO@arede.app.br", allow)).toBe(true);
  });

  it("recusa e-mail fora da allowlist", () => {
    expect(isAdmin("intruso@x.com", allow)).toBe(false);
  });

  it("fail-closed: sem allowlist, ninguém é admin", () => {
    expect(isAdmin("leo@arede.app.br", "")).toBe(false);
  });

  it("recusa e-mail vazio/nulo", () => {
    expect(isAdmin("", allow)).toBe(false);
    expect(isAdmin(undefined, allow)).toBe(false);
  });
});

describe("computeVisaoOferta", () => {
  const agora = new Date("2026-06-18T12:00:00Z");
  const dias = (n) => new Date(agora.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const profs = [
    { id: "1", foto_url: "x.jpg", user_id: "u1", verificado: true, criado_em: dias(5) },
    { id: "2", foto_url: null, user_id: null, verificado: false, criado_em: dias(40) },
    { id: "3", foto_url: "y.jpg", user_id: "u3", verificado: false, criado_em: dias(100) },
    { id: "4", foto_url: null, user_id: null, verificado: false, criado_em: dias(10) },
  ];
  const servs = [
    { profissional_id: "1", categoria: "Limpeza e Cuidados" },
    { profissional_id: "1", categoria: "Limpeza e Cuidados" }, // mesma cat, não duplica
    { profissional_id: "2", categoria: "Limpeza e Cuidados" },
    { profissional_id: "3", categoria: "Construção e Reforma" },
    { profissional_id: "4", categoria: null }, // ignorado
  ];

  it("agrega totais, contas e selos", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.total).toBe(4);
    expect(v.comConta).toBe(2);
    expect(v.anonimos).toBe(2);
    expect(v.comFoto).toBe(2);
    expect(v.pctComFoto).toBe(50);
    expect(v.verificados).toBe(1);
  });

  it("conta novos por janela de tempo", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.novos30).toBe(2); // dias 5 e 10
    expect(v.novos90).toBe(3); // dias 5, 10 e 40
  });

  it("conta profissionais distintos por categoria, ordenado", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.porCategoria).toEqual([
      { categoria: "Limpeza e Cuidados", total: 2 },
      { categoria: "Construção e Reforma", total: 1 },
    ]);
  });

  it("lida com listas vazias sem dividir por zero", () => {
    const v = computeVisaoOferta([], []);
    expect(v.total).toBe(0);
    expect(v.pctComFoto).toBe(0);
    expect(v.porCategoria).toEqual([]);
  });
});
