import { describe, it, expect } from "vitest";
import { computeStats, sortProfissionais, ORDENACOES, ORDENACAO_PADRAO } from "../catalogo";

// Helpers para montar avaliações de teste.
function aval(profId, { nota = 5, pontual = true, novamente = true, conforme = true } = {}) {
  return { profissional_id: profId, nota, pontual, novamente, conforme };
}

describe("computeStats", () => {
  it("retorna null quando não há avaliações", () => {
    expect(computeStats("p1", [])).toBeNull();
    expect(computeStats("p1", [aval("outro")])).toBeNull();
    expect(computeStats("p1", null)).toBeNull();
  });

  it("calcula média, contagem e percentuais", () => {
    const avals = [
      aval("p1", { nota: 5, pontual: true, novamente: true, conforme: true }),
      aval("p1", { nota: 4, pontual: false, novamente: true, conforme: true }),
    ];
    const st = computeStats("p1", avals);
    expect(st.count).toBe(2);
    expect(st.avg).toBe(4.5);
    expect(st.pontual).toBe(50);
    expect(st.novamente).toBe(100);
    expect(st.conforme).toBe(100);
  });

  it("arredonda a média para uma casa decimal", () => {
    const avals = [aval("p1", { nota: 5 }), aval("p1", { nota: 4 }), aval("p1", { nota: 4 })];
    expect(computeStats("p1", avals).avg).toBe(4.3);
  });

  it("marca recomendado com 80%+ de novamente e ao menos 3 avaliações", () => {
    const tres = [aval("p1"), aval("p1"), aval("p1")];
    expect(computeStats("p1", tres).recomendado).toBe(true);
  });

  it("não marca recomendado com menos de 3 avaliações", () => {
    expect(computeStats("p1", [aval("p1"), aval("p1")]).recomendado).toBe(false);
  });

  it("não marca recomendado quando novamente fica abaixo de 80%", () => {
    const avals = [
      aval("p1", { novamente: true }),
      aval("p1", { novamente: false }),
      aval("p1", { novamente: false }),
    ];
    expect(computeStats("p1", avals).recomendado).toBe(false);
  });
});

describe("sortProfissionais", () => {
  const p1 = { id: "p1", criado_em: "2026-01-01T00:00:00Z" }; // mais antigo
  const p2 = { id: "p2", criado_em: "2026-03-01T00:00:00Z" };
  const p3 = { id: "p3", criado_em: "2026-06-01T00:00:00Z" }; // mais novo

  it("expõe as opções e o padrão", () => {
    expect(ORDENACOES.map((o) => o.value)).toEqual(["relevancia", "avaliacao", "recentes"]);
    expect(ORDENACAO_PADRAO).toBe("relevancia");
  });

  it("não muta o array de entrada", () => {
    const entrada = [p1, p2, p3];
    const copia = [...entrada];
    sortProfissionais(entrada, [], "recentes");
    expect(entrada).toEqual(copia);
  });

  it("recentes: ordena do mais novo para o mais antigo", () => {
    const r = sortProfissionais([p1, p2, p3], [], "recentes");
    expect(r.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
  });

  it("avaliacao: maior média primeiro, sem avaliação no fim", () => {
    const avals = [
      // p1: média 5
      aval("p1", { nota: 5 }),
      // p2: média 3
      aval("p2", { nota: 3 }),
      // p3: sem avaliação
    ];
    const r = sortProfissionais([p2, p3, p1], avals, "avaliacao");
    expect(r.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("avaliacao: empate de média vai para quem tem mais avaliações", () => {
    const avals = [aval("p1", { nota: 5 }), aval("p2", { nota: 5 }), aval("p2", { nota: 5 })];
    const r = sortProfissionais([p1, p2], avals, "avaliacao");
    expect(r.map((p) => p.id)).toEqual(["p2", "p1"]);
  });

  it("relevancia: recomendados primeiro, depois por recência", () => {
    // p1 (antigo) é recomendado; p2 e p3 não têm avaliações.
    const avals = [aval("p1"), aval("p1"), aval("p1")];
    const r = sortProfissionais([p2, p1, p3], avals, "relevancia");
    expect(r[0].id).toBe("p1"); // recomendado sobe
    expect(r.slice(1).map((p) => p.id)).toEqual(["p3", "p2"]); // resto por recência
  });

  it("usa relevancia como padrão quando o modo é omitido", () => {
    const avals = [aval("p1"), aval("p1"), aval("p1")];
    const r = sortProfissionais([p2, p1, p3], avals);
    expect(r[0].id).toBe("p1");
  });
});
