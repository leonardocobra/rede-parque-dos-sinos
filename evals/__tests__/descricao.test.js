// Evals de qualidade de descrição — Fase 4 AI Native Lab
//
// Usa Claude Sonnet como juiz (LLM-as-judge) para avaliar se descrições
// "boas" obtêm score ≥ score_minimo e descrições "ruins" obtêm score ≤ score_maximo.
//
// Trigger de escalonamento ao final: se a taxa de concordância cair abaixo de
// 80% (MT-Bench, Zheng et al. 2023) o teste falha com mensagem acionável
// indicando qual modelo usar para gerador e/ou juiz.
//
// Requer ANTHROPIC_API_KEY no ambiente. Sem a variável, os 20 cenários de
// qualidade e o trigger são ignorados (skipIf) — correto para CI sem credenciais.

import { describe, it, expect } from "vitest";
import { julgarDescricao, calcularEscalaTier } from "../../lib/ai/evals";
import cenarios from "../fixtures/descricao.json";

const semKey = !process.env.ANTHROPIC_API_KEY;

// Acumula resultados de todos os cenários para o trigger de escalonamento.
// Populado antes das asserções em cada teste — coleta mesmo se o teste falhar.
const resultadosColetados = [];

describe("Evals — qualidade de descrição (LLM-as-judge)", () => {
  for (const c of cenarios) {
    it.skipIf(semKey)(
      `${c.id}  ${c.servico}  [${c.qualidade}]`,
      async () => {
        const { score, justificativa } = await julgarDescricao(c.texto, {
          servico: c.servico,
          contexto: c.contexto,
        });

        // Registra ANTES das asserções individuais
        resultadosColetados.push({
          qualidade: c.qualidade,
          score,
          score_minimo: c.score_minimo,
          score_maximo: c.score_maximo,
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
      30_000
    );
  }

  // ---------------------------------------------------------------------------
  // Trigger de escalonamento de modelo
  //
  // Calcula a taxa de concordância (% de descrições "boas" que passam no limiar)
  // e falha com mensagem acionável se cair abaixo dos limiares da literatura:
  //   < 80 % (MT-Bench, Zheng et al. 2023) → escalar gerador: Haiku → Sonnet
  //   < 60 % (HELM, Liang et al. 2022)     → escalar gerador E juiz → Opus
  // ---------------------------------------------------------------------------
  it.skipIf(semKey)(
    "trigger: taxa de concordância ≥ 80% (MT-Bench) — senão escalar modelo",
    () => {
      const boasEsperadas = cenarios.filter((c) => c.qualidade === "boa").length;
      const boasColetadas = resultadosColetados.filter((r) => r.qualidade === "boa");

      // Se nem todas rodaram (erros de API em cenários anteriores), não disparar
      // o trigger — as falhas individuais já aparecem acima
      if (boasColetadas.length < boasEsperadas) return;

      const { tier, mensagem } = calcularEscalaTier(resultadosColetados);
      expect(tier, mensagem ?? "taxa de concordância ok").toBe(0);
    },
    5_000
  );

  // ---------------------------------------------------------------------------
  // Integridade das fixtures (sempre roda, sem API key)
  // ---------------------------------------------------------------------------
  it("fixtures contêm 15 descrições boas e 5 ruins", () => {
    expect(cenarios.filter((c) => c.qualidade === "boa")).toHaveLength(15);
    expect(cenarios.filter((c) => c.qualidade === "ruim")).toHaveLength(5);
  });

  it("total de 20 cenários carregados", () => {
    expect(cenarios).toHaveLength(20);
  });
});
