import { describe, it, expect, vi } from "vitest";

// local.js importa profissionais.js, que carrega o cliente Supabase no topo.
// Mock mínimo para o import não exigir env de Supabase — os testes abaixo só
// exercitam as funções puras (combosServicoBairro, filtrarPorServicoBairro).
vi.mock("../supabase", () => ({ supabase: { from: () => {} } }));

import { combosServicoBairro, filtrarPorServicoBairro } from "../local";

const profs = [
  {
    id: "a",
    nome: "Ana",
    bairro: "Parque dos Sinos",
    profissional_servicos: [
      { id: "s1", servico: "Diarista", categoria: "Limpeza e Cuidados" },
      { id: "s2", servico: "Passadeira", categoria: "Limpeza e Cuidados" },
    ],
  },
  {
    id: "b",
    nome: "Bruno",
    bairro: "parque dos sinos", // variação de caixa → mesmo bairro
    profissional_servicos: [{ id: "s3", servico: "Diarista", categoria: "Limpeza e Cuidados" }],
  },
  {
    id: "c",
    nome: "Carla",
    bairro: "Jardim Califórnia",
    profissional_servicos: [{ id: "s4", servico: "Manicure", categoria: "Beleza e Moda" }],
  },
  {
    id: "d",
    nome: "Sem bairro",
    bairro: "",
    profissional_servicos: [{ id: "s5", servico: "Pintor", categoria: "Construção e Reforma" }],
  },
];

describe("combosServicoBairro", () => {
  it("dedup por servico+bairro, agrupando variação de caixa do bairro", () => {
    const combos = combosServicoBairro(profs);
    // Diarista/parque-dos-sinos (Ana e Bruno) conta uma vez só.
    const diaristas = combos.filter(
      (c) => c.servicoSlug === "diarista" && c.localSlug === "parque-dos-sinos"
    );
    expect(diaristas).toHaveLength(1);
  });

  it("ignora profissionais sem bairro", () => {
    const combos = combosServicoBairro(profs);
    expect(combos.some((c) => c.servicoSlug === "pintor")).toBe(false);
  });

  it("inclui slugs, rótulos e categoria", () => {
    const combos = combosServicoBairro(profs);
    const manicure = combos.find((c) => c.servicoSlug === "manicure");
    expect(manicure).toMatchObject({
      servicoSlug: "manicure",
      localSlug: "jardim-california",
      servico: "Manicure",
      bairro: "Jardim Califórnia",
      categoria: "Beleza e Moda",
    });
  });
});

describe("filtrarPorServicoBairro", () => {
  it("lista todos os profissionais da combinação (inclui variação de caixa)", () => {
    const r = filtrarPorServicoBairro(profs, "diarista", "parque-dos-sinos");
    expect(r.profissionais.map((p) => p.id).sort()).toEqual(["a", "b"]);
    expect(r.servico).toBe("Diarista");
    expect(r.bairro).toBe("Parque dos Sinos");
  });

  it("retorna null quando não há combinação", () => {
    expect(filtrarPorServicoBairro(profs, "diarista", "jardim-california")).toBeNull();
    expect(filtrarPorServicoBairro(profs, "inexistente", "parque-dos-sinos")).toBeNull();
  });
});
