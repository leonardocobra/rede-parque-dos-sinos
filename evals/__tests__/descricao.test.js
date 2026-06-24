// Evals de qualidade de descrição — Fase 4 AI Native Lab
//
// Usa Claude Haiku como juiz (LLM-as-judge) para avaliar se descrições
// "boas" obtêm score ≥ score_minimo e descrições "ruins" obtêm score ≤ score_maximo.
//
// Requer ANTHROPIC_API_KEY no ambiente. Sem a variável, todos os 20 casos
// são ignorados (skipIf) — comportamento correto para CI sem credenciais.
// Execute localmente ou em CI dedicado para obter o sinal real de qualidade.

import { describe, it, expect } from "vitest";
import { julgarDescricao } from "../../lib/ai/evals";
import cenarios from "../fixtures/descricao.json";

const semKey = !process.env.ANTHROPIC_API_KEY;

describe("Evals — qualidade de descrição (LLM-as-judge)", () => {
  for (const c of cenarios) {
    it.skipIf(semKey)(
      `${c.id}  ${c.servico}  [${c.qualidade}]`,
      async () => {
        const { score, justificativa } = await julgarDescricao(c.texto, {
          servico: c.servico,
          contexto: c.contexto,
        });

        expect(score, "score fora do intervalo 1-5").toBeGreaterThanOrEqual(1);
        expect(score, "score fora do intervalo 1-5").toBeLessThanOrEqual(5);

        if (c.qualidade === "boa") {
          expect(
            score,
            `[${c.id}] esperado score ≥ ${c.score_minimo}, obtido ${score}. Juiz: "${justificativa}"`
          ).toBeGreaterThanOrEqual(c.score_minimo);
        } else {
          expect(
            score,
            `[${c.id}] esperado score ≤ ${c.score_maximo}, obtido ${score}. Juiz: "${justificativa}"`
          ).toBeLessThanOrEqual(c.score_maximo);
        }
      },
      30_000 // 30 s por chamada ao Haiku
    );
  }

  it("fixtures contêm 15 descrições boas e 5 ruins", () => {
    const boas = cenarios.filter((c) => c.qualidade === "boa").length;
    const ruins = cenarios.filter((c) => c.qualidade === "ruim").length;
    expect(boas).toBe(15);
    expect(ruins).toBe(5);
  });

  it("total de 20 cenários carregados", () => {
    expect(cenarios).toHaveLength(20);
  });
});
