import { describe, it, expect } from "vitest";
import { computaAnaliticasPerfil } from "../painelAnalytics";

const agora = new Date("2026-06-19T12:00:00Z");
const ts = (diasAtras, hora = "10:00:00") => {
  const d = new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10) + "T" + hora + "Z";
};

describe("computaAnaliticasPerfil", () => {
  it("lista vazia retorna zeros e série de 30 pontos zerados", () => {
    const r = computaAnaliticasPerfil([], { agora });
    expect(r.perfilViews).toBe(0);
    expect(r.contatos).toBe(0);
    expect(r.fontes).toEqual([]);
    expect(r.serie).toHaveLength(30);
    expect(r.serie.every((p) => p.perfilViews === 0 && p.contatos === 0)).toBe(true);
  });

  it("conta profile_view e contact_click corretamente", () => {
    const eventos = [
      { tipo: "profile_view", origem: "instagram", criado_em: ts(1) },
      { tipo: "profile_view", origem: "instagram", criado_em: ts(2) },
      { tipo: "contact_click", origem: "direto", criado_em: ts(1) },
    ];
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.perfilViews).toBe(2);
    expect(r.contatos).toBe(1);
  });

  it("ignora tipos desconhecidos", () => {
    const eventos = [{ tipo: "page_view", origem: "busca", criado_em: ts(1) }];
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.perfilViews).toBe(0);
    expect(r.contatos).toBe(0);
  });

  it("agrupa fontes por origem e ordena por total desc", () => {
    const eventos = [
      { tipo: "profile_view", origem: "instagram", criado_em: ts(1) },
      { tipo: "profile_view", origem: "instagram", criado_em: ts(2) },
      { tipo: "contact_click", origem: "instagram", criado_em: ts(3) },
      { tipo: "profile_view", origem: "busca", criado_em: ts(1) },
      { tipo: "contact_click", origem: "direto", criado_em: ts(5) },
    ];
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.fontes[0].origem).toBe("instagram");
    expect(r.fontes[0].total).toBe(3);
    expect(r.fontes[1].origem).toBe("busca");
    expect(r.fontes[2].origem).toBe("direto");
  });

  it("origem null/undefined cai em 'direto'", () => {
    const eventos = [
      { tipo: "profile_view", origem: null, criado_em: ts(1) },
      { tipo: "profile_view", origem: undefined, criado_em: ts(2) },
    ];
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.fontes).toHaveLength(1);
    expect(r.fontes[0].origem).toBe("direto");
    expect(r.fontes[0].total).toBe(2);
  });

  it("série diária bucketiza por dia corretamente", () => {
    const eventos = [
      { tipo: "profile_view", origem: "instagram", criado_em: ts(0) },
      { tipo: "profile_view", origem: "instagram", criado_em: ts(0) },
      { tipo: "contact_click", origem: "direto", criado_em: ts(0) },
      { tipo: "profile_view", origem: "busca", criado_em: ts(2) },
    ];
    const r = computaAnaliticasPerfil(eventos, { agora });
    const hoje = r.serie[r.serie.length - 1];
    const doisAtras = r.serie[r.serie.length - 3];
    expect(hoje.perfilViews).toBe(2);
    expect(hoje.contatos).toBe(1);
    expect(doisAtras.perfilViews).toBe(1);
  });

  it("eventos fora da janela de 30 dias são ignorados na série", () => {
    const eventos = [
      { tipo: "profile_view", origem: "instagram", criado_em: ts(31) },
    ];
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.serie.every((p) => p.perfilViews === 0)).toBe(true);
    // KPIs ainda contam (o filtro de janela é feito na query da API)
    expect(r.perfilViews).toBe(1);
  });

  it("limita fontes a 5 entradas", () => {
    const origens = ["a", "b", "c", "d", "e", "f"];
    const eventos = origens.map((o) => ({
      tipo: "profile_view",
      origem: o,
      criado_em: ts(1),
    }));
    const r = computaAnaliticasPerfil(eventos, { agora });
    expect(r.fontes.length).toBeLessThanOrEqual(5);
  });

  it("série tem exatamente 30 pontos com dias em ordem crescente", () => {
    const r = computaAnaliticasPerfil([], { agora });
    expect(r.serie).toHaveLength(30);
    for (let i = 1; i < r.serie.length; i++) {
      expect(r.serie[i].dia > r.serie[i - 1].dia).toBe(true);
    }
    expect(r.serie[r.serie.length - 1].dia).toBe("2026-06-19");
  });
});
