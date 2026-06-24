import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock do SDK — deve ser declarado antes do import do módulo testado
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import {
  inferirCategoria,
  julgarDescricao,
  calcularEscalaTier,
  LIMIARES,
  MODELOS_ESCALA,
} from "../ai/evals";

// ---------------------------------------------------------------------------
// inferirCategoria — classificador determinístico
// ---------------------------------------------------------------------------

describe("inferirCategoria", () => {
  it.each([
    ["Eletricista",               "Construção e Reforma" ],
    ["Pedreiro",                  "Construção e Reforma" ],
    ["Encanador",                 "Construção e Reforma" ],
    ["Instalador de ar-condicionado", "Construção e Reforma"],
    ["Eletricista automotivo",    "Veículos"             ],
    ["Mecânico",                  "Veículos"             ],
    ["Funileiro",                 "Veículos"             ],
    ["Diarista",                  "Limpeza e Cuidados"   ],
    ["Cuidador de idosos",        "Limpeza e Cuidados"   ],
    ["Técnico de informática",    "Tecnologia e Digital" ],
    ["Designer gráfico",          "Tecnologia e Digital" ],
    ["Professor particular",      "Ensino e Educação"    ],
    ["Reforço escolar",           "Ensino e Educação"    ],
    ["Cabeleireiro",              "Beleza e Moda"        ],
    ["Barbeiro",                  "Beleza e Moda"        ],
    ["Jardineiro",                "Outros Serviços"      ],
    ["Personal trainer",          "Outros Serviços"      ],
  ])("%s → %s", (servico, esperada) => {
    expect(inferirCategoria(servico)).toBe(esperada);
  });

  it("não distingue maiúsculas de minúsculas", () => {
    expect(inferirCategoria("PEDREIRO")).toBe("Construção e Reforma");
    expect(inferirCategoria("diarista")).toBe("Limpeza e Cuidados");
  });

  it("normaliza acentos antes de comparar", () => {
    expect(inferirCategoria("Mecânico")).toBe("Veículos");
    expect(inferirCategoria("Reforço escolar")).toBe("Ensino e Educação");
  });

  it("'Eletricista' sem qualificador → Construção, não Veículos", () => {
    expect(inferirCategoria("Eletricista")).toBe("Construção e Reforma");
  });

  it("'Eletricista automotivo' → Veículos por 'automotiv'", () => {
    expect(inferirCategoria("Eletricista automotivo")).toBe("Veículos");
  });

  it("retorna 'Outros Serviços' para serviço não mapeado", () => {
    expect(inferirCategoria("xyz não existe")).toBe("Outros Serviços");
    expect(inferirCategoria("Fotógrafo")).toBe("Outros Serviços");
  });
});

// ---------------------------------------------------------------------------
// julgarDescricao — LLM-as-judge (SDK mockado)
// ---------------------------------------------------------------------------

describe("julgarDescricao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      content: [{ text: '{"score": 4, "justificativa": "Descrição específica e profissional."}' }],
    });
  });

  it("retorna score e justificativa parseados do JSON do LLM", async () => {
    const res = await julgarDescricao("Eletricista residencial com 10 anos.", {
      servico: "Eletricista",
    });
    expect(res.score).toBe(4);
    expect(res.justificativa).toBe("Descrição específica e profissional.");
  });

  it("usa Sonnet como juiz — 1 tier acima do gerador Haiku", async () => {
    await julgarDescricao("texto", { servico: "teste" });
    const chamada = mockCreate.mock.calls[0][0];
    expect(chamada.model).toBe(MODELOS_ESCALA.juiz[0]);
    expect(chamada.model).toBe("claude-sonnet-4-6");
  });

  it("funciona sem objeto de contexto", async () => {
    const res = await julgarDescricao("Pintor de paredes.");
    expect(typeof res.score).toBe("number");
    expect(typeof res.justificativa).toBe("string");
  });

  it("usa contexto composto de servico e contexto no prompt", async () => {
    await julgarDescricao("Bio de teste.", { servico: "Pedreiro", contexto: "Pedreiro especialista" });
    const chamada = mockCreate.mock.calls[0][0];
    expect(chamada.messages[0].content).toContain("Pedreiro especialista");
  });

  it("extrai JSON mesmo quando a resposta tem texto ao redor", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ text: 'Avaliação: {"score": 3, "justificativa": "Ok."} Pronto.' }],
    });
    const res = await julgarDescricao("texto", { servico: "teste" });
    expect(res.score).toBe(3);
  });

  it("lança erro quando o LLM não retorna JSON reconhecível", async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ text: "sem json aqui" }] });
    await expect(julgarDescricao("texto", { servico: "teste" })).rejects.toThrow(
      "Resposta inválida do juiz"
    );
  });
});

// ---------------------------------------------------------------------------
// calcularEscalaTier — trigger de escalonamento de modelo
// ---------------------------------------------------------------------------

// Helpers para gerar lotes de resultados mock
const boas = (n, score = 4) =>
  Array.from({ length: n }, () => ({ qualidade: "boa", score, score_minimo: 3 }));
const ruins = (n) =>
  Array.from({ length: n }, () => ({ qualidade: "ruim", score: 1, score_maximo: 2 }));

describe("calcularEscalaTier", () => {
  it("tier 0 quando 100% das boas passam", () => {
    const r = calcularEscalaTier([...boas(15), ...ruins(5)]);
    expect(r.tier).toBe(0);
    expect(r.acao).toBe("ok");
    expect(r.mensagem).toBeNull();
    expect(r.taxa).toBe(1.0);
  });

  it("tier 0 no limiar exato de 80% (12/15)", () => {
    const r = calcularEscalaTier([...boas(12, 4), ...boas(3, 1), ...ruins(5)]);
    expect(r.tier).toBe(0);
    expect(r.taxa).toBeCloseTo(0.8);
  });

  it("tier 1 quando 60% ≤ taxa < 80% — escalar gerador (MT-Bench)", () => {
    // 11/15 ≈ 73%
    const r = calcularEscalaTier([...boas(11, 4), ...boas(4, 1)]);
    expect(r.tier).toBe(1);
    expect(r.acao).toBe("escalar_gerador");
    expect(r.mensagem).toContain("MT-Bench");
    expect(r.mensagem).toContain("claude-sonnet-4-6");
  });

  it("tier 1 no limiar exato de 60% (9/15)", () => {
    const r = calcularEscalaTier([...boas(9, 4), ...boas(6, 1)]);
    expect(r.tier).toBe(1);
    expect(r.taxa).toBeCloseTo(0.6);
  });

  it("tier 2 quando taxa < 60% — escalar gerador E juiz (HELM)", () => {
    // 8/15 ≈ 53%
    const r = calcularEscalaTier([...boas(8, 4), ...boas(7, 1)]);
    expect(r.tier).toBe(2);
    expect(r.acao).toBe("escalar_ambos");
    expect(r.mensagem).toContain("HELM");
    expect(r.mensagem).toContain("claude-opus-4-8");
  });

  it("tier 2 com taxa 0% (todas falham)", () => {
    const r = calcularEscalaTier(boas(15, 1)); // score 1 < score_minimo 3
    expect(r.tier).toBe(2);
    expect(r.taxa).toBe(0);
  });

  it("ignora resultados 'ruim' ao calcular a taxa", () => {
    const r = calcularEscalaTier([...boas(15, 4), ...ruins(10)]);
    expect(r.tier).toBe(0);
    expect(r.taxa).toBe(1.0);
  });

  it("lança erro quando não há nenhum resultado 'boa'", () => {
    expect(() => calcularEscalaTier([])).toThrow("Nenhum resultado");
    expect(() => calcularEscalaTier(ruins(5))).toThrow("Nenhum resultado");
  });

  it("LIMIARES.OK = 0.80 e LIMIARES.ALERTA = 0.60 (derivados de MT-Bench e HELM)", () => {
    expect(LIMIARES.OK).toBe(0.80);
    expect(LIMIARES.ALERTA).toBe(0.60);
  });

  it("juiz tier 0 é sempre Sonnet (acima do gerador Haiku)", () => {
    expect(MODELOS_ESCALA.gerador[0]).toBe("claude-haiku-4-5-20251001");
    expect(MODELOS_ESCALA.juiz[0]).toBe("claude-sonnet-4-6");
    expect(MODELOS_ESCALA.juiz[0]).not.toBe(MODELOS_ESCALA.gerador[0]);
  });
});
