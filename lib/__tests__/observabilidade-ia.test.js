import { describe, it, expect } from "vitest";
import { computeObservabilidadeIA } from "../observabilidade-ia";

const inv = (overrides = {}) => ({
  id: crypto.randomUUID(),
  rota: "/api/ai/onboarding",
  modelo: "claude-haiku-4-5-20251001",
  tokens_in: 100,
  tokens_out: 50,
  custo: 0.0000008,
  latencia_ms: 1200,
  sucesso: true,
  erro: null,
  eval_score: null,
  criado_em: new Date().toISOString(),
  ...overrides,
});

describe("computeObservabilidadeIA", () => {
  it("retorna zeros para lista vazia", () => {
    const r = computeObservabilidadeIA([]);
    expect(r.total).toBe(0);
    expect(r.sucesso).toBe(0);
    expect(r.falhas).toBe(0);
    expect(r.taxaSucesso).toBe(0);
    expect(r.custoTotal).toBe(0);
    expect(r.tokensIn).toBe(0);
    expect(r.tokensOut).toBe(0);
    expect(r.latenciaMedia).toBe(0);
    expect(r.latenciaP95).toBe(0);
    expect(r.porRota).toHaveLength(0);
    expect(r.ultimasFalhas).toHaveLength(0);
    expect(r.evalMediaScore).toBeNull();
  });

  it("conta total, sucesso e falhas corretamente", () => {
    const lista = [
      inv({ sucesso: true }),
      inv({ sucesso: true }),
      inv({ sucesso: false, erro: "timeout" }),
    ];
    const r = computeObservabilidadeIA(lista);
    expect(r.total).toBe(3);
    expect(r.sucesso).toBe(2);
    expect(r.falhas).toBe(1);
    expect(r.taxaSucesso).toBe(67);
  });

  it("soma custo e tokens corretamente", () => {
    const lista = [
      inv({ custo: 0.000001, tokens_in: 200, tokens_out: 100 }),
      inv({ custo: 0.000002, tokens_in: 300, tokens_out: 150 }),
    ];
    const r = computeObservabilidadeIA(lista);
    expect(r.custoTotal).toBeCloseTo(0.000003, 6);
    expect(r.tokensIn).toBe(500);
    expect(r.tokensOut).toBe(250);
  });

  it("calcula latência média e p95", () => {
    const lats = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const lista = lats.map((l) => inv({ latencia_ms: l }));
    const r = computeObservabilidadeIA(lista);
    expect(r.latenciaMedia).toBe(550);
    expect(r.latenciaP95).toBe(1000);
  });

  it("ignora latencia_ms = 0 no cálculo", () => {
    const lista = [inv({ latencia_ms: 0 }), inv({ latencia_ms: 1000 })];
    const r = computeObservabilidadeIA(lista);
    expect(r.latenciaMedia).toBe(1000);
  });

  it("agrupa por rota e ordena por volume", () => {
    const lista = [
      inv({ rota: "/api/agente" }),
      inv({ rota: "/api/agente" }),
      inv({ rota: "/api/ai/onboarding" }),
    ];
    const r = computeObservabilidadeIA(lista);
    expect(r.porRota[0].rota).toBe("/api/agente");
    expect(r.porRota[0].total).toBe(2);
    expect(r.porRota[1].rota).toBe("/api/ai/onboarding");
  });

  it("conta falhas por rota", () => {
    const lista = [
      inv({ rota: "/api/agente", sucesso: false, erro: "err" }),
      inv({ rota: "/api/agente", sucesso: true }),
    ];
    const r = computeObservabilidadeIA(lista);
    expect(r.porRota[0].falhas).toBe(1);
  });

  it("retorna até 5 últimas falhas, ordenadas por mais recente", () => {
    const lista = Array.from({ length: 7 }, (_, i) =>
      inv({
        sucesso: false,
        erro: `err ${i}`,
        criado_em: new Date(2026, 0, i + 1).toISOString(),
      })
    );
    const r = computeObservabilidadeIA(lista);
    expect(r.ultimasFalhas).toHaveLength(5);
    expect(r.ultimasFalhas[0].erro).toBe("err 6");
  });

  it("não inclui erros sem mensagem nas falhas", () => {
    const lista = [inv({ sucesso: false, erro: null })];
    const r = computeObservabilidadeIA(lista);
    expect(r.ultimasFalhas).toHaveLength(0);
  });

  it("calcula eval_score médio ignorando nulls", () => {
    const lista = [
      inv({ eval_score: 4 }),
      inv({ eval_score: 5 }),
      inv({ eval_score: null }),
    ];
    const r = computeObservabilidadeIA(lista);
    expect(r.evalMediaScore).toBe(4.5);
  });

  it("retorna evalMediaScore null quando todos os scores são null", () => {
    const lista = [inv({ eval_score: null }), inv({ eval_score: null })];
    const r = computeObservabilidadeIA(lista);
    expect(r.evalMediaScore).toBeNull();
  });

  it("usa (desconhecida) como rota fallback", () => {
    const lista = [inv({ rota: null })];
    const r = computeObservabilidadeIA(lista);
    expect(r.porRota[0].rota).toBe("(desconhecida)");
  });
});
