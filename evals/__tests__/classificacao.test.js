// Evals determinísticos — Fase 4 AI Native Lab
//
// Para cada um dos 30 cenários de classificacao.json verifica se
// inferirCategoria() produz a categoria esperada.
// Não chama nenhuma API externa — roda em todo CI.

import { describe, it, expect } from "vitest";
import { inferirCategoria } from "../../lib/ai/evals";
import cenarios from "../fixtures/classificacao.json";

describe("Evals — classificação de serviços (determinística)", () => {
  it.each(cenarios)(
    "$id  '$servico'  →  $categoria_esperada",
    ({ servico, categoria_esperada }) => {
      expect(inferirCategoria(servico)).toBe(categoria_esperada);
    }
  );

  it("fixtures cobrem todas as 7 categorias do CATS_ENUM", () => {
    const cats = new Set(cenarios.map((c) => c.categoria_esperada));
    const esperadas = new Set([
      "Construção e Reforma",
      "Limpeza e Cuidados",
      "Tecnologia e Digital",
      "Ensino e Educação",
      "Beleza e Moda",
      "Veículos",
      "Outros Serviços",
    ]);
    for (const cat of esperadas) {
      expect(cats, `Categoria "${cat}" não coberta`).toContain(cat);
    }
  });

  it("total de 30 cenários carregados", () => {
    expect(cenarios).toHaveLength(30);
  });
});
