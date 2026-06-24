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

import { inferirCategoria, julgarDescricao } from "../ai/evals";

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
      content: [{ text: 'Aqui está a avaliação: {"score": 3, "justificativa": "Ok."} Pronto.' }],
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
