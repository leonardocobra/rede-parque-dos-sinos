import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock do SDK Anthropic — declarado antes do import do módulo testado
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import {
  TOOLS,
  MODELO_AGENTE,
  calcularCusto,
  executarTool,
  agente,
} from "../ai/agente";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function respostaFinal(texto) {
  return {
    stop_reason: "end_turn",
    content: [{ type: "text", text: texto }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

function respostaToolUse(tools) {
  return {
    stop_reason: "tool_use",
    content: tools.map((t) => ({
      type: "tool_use",
      id: `tu_${t.name}`,
      name: t.name,
      input: t.input ?? {},
    })),
    usage: { input_tokens: 80, output_tokens: 30 },
  };
}

function mockSupabase(rpcData = []) {
  return { rpc: vi.fn().mockResolvedValue({ data: rpcData, error: null }) };
}

function mockSupabaseErro(msg) {
  return { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: msg } }) };
}

// ---------------------------------------------------------------------------
// calcularCusto
// ---------------------------------------------------------------------------

describe("calcularCusto", () => {
  it("retorna 0 para 0 tokens", () => {
    expect(calcularCusto(0, 0)).toBe(0);
  });

  it("calcula corretamente com preços Haiku 4.5 (0.80/4.00 por 1M)", () => {
    const custo = calcularCusto(1_000_000, 1_000_000);
    expect(custo).toBeCloseTo(4.80, 5);
  });

  it("custo de output é 5× maior que input (proporção Haiku)", () => {
    const soInput  = calcularCusto(1_000_000, 0);
    const soOutput = calcularCusto(0, 1_000_000);
    expect(soOutput / soInput).toBeCloseTo(5, 1);
  });
});

// ---------------------------------------------------------------------------
// TOOLS e MODELO_AGENTE
// ---------------------------------------------------------------------------

describe("TOOLS", () => {
  it("define exatamente 3 tools", () => {
    expect(TOOLS).toHaveLength(3);
  });

  it("tools têm os nomes esperados", () => {
    const nomes = TOOLS.map((t) => t.name);
    expect(nomes).toContain("contar_por_categoria");
    expect(nomes).toContain("bairros_com_menos_oferta");
    expect(nomes).toContain("perfis_completos");
  });

  it("nenhuma tool tem campos required obrigatórios (todos os params são opcionais)", () => {
    TOOLS.forEach((t) => {
      expect(t.input_schema.required ?? []).toHaveLength(0);
    });
  });

  it("MODELO_AGENTE é Haiku (custo operacional baixo)", () => {
    expect(MODELO_AGENTE).toBe("claude-haiku-4-5-20251001");
  });
});

// ---------------------------------------------------------------------------
// executarTool
// ---------------------------------------------------------------------------

describe("executarTool", () => {
  it("contar_por_categoria — passa p_categoria null quando omitido", async () => {
    const sb = mockSupabase([{ categoria: "Construção e Reforma", total: 5 }]);
    const res = await executarTool("contar_por_categoria", {}, sb);
    expect(sb.rpc).toHaveBeenCalledWith("ai_contar_por_categoria", { p_categoria: null });
    expect(res).toHaveLength(1);
  });

  it("contar_por_categoria — passa categoria quando fornecida", async () => {
    const sb = mockSupabase([{ categoria: "Veículos", total: 2 }]);
    await executarTool("contar_por_categoria", { categoria: "Veículos" }, sb);
    expect(sb.rpc).toHaveBeenCalledWith("ai_contar_por_categoria", { p_categoria: "Veículos" });
  });

  it("bairros_com_menos_oferta — usa limite padrão 10 quando omitido", async () => {
    const sb = mockSupabase([]);
    await executarTool("bairros_com_menos_oferta", {}, sb);
    expect(sb.rpc).toHaveBeenCalledWith("ai_bairros_com_menos_oferta", { p_limite: 10 });
  });

  it("bairros_com_menos_oferta — passa limite quando fornecido", async () => {
    const sb = mockSupabase([]);
    await executarTool("bairros_com_menos_oferta", { limite: 5 }, sb);
    expect(sb.rpc).toHaveBeenCalledWith("ai_bairros_com_menos_oferta", { p_limite: 5 });
  });

  it("perfis_completos — usa limite padrão 20 quando omitido", async () => {
    const sb = mockSupabase([]);
    await executarTool("perfis_completos", {}, sb);
    expect(sb.rpc).toHaveBeenCalledWith("ai_perfis_completos", { p_limite: 20 });
  });

  it("lança erro quando supabase retorna error", async () => {
    const sb = mockSupabaseErro("função não encontrada");
    await expect(
      executarTool("contar_por_categoria", {}, sb)
    ).rejects.toThrow("função não encontrada");
  });

  it("lança erro para tool desconhecida", async () => {
    const sb = mockSupabase([]);
    await expect(
      executarTool("sql_livre", {}, sb)
    ).rejects.toThrow("Tool desconhecida: sql_livre");
  });
});

// ---------------------------------------------------------------------------
// agente — loop de tool-use
// ---------------------------------------------------------------------------

describe("agente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna texto diretamente quando não há tool-use", async () => {
    mockCreate.mockResolvedValue(respostaFinal("Há 12 eletricistas cadastrados."));
    const sb = mockSupabase([]);
    const { texto, tokensIn, tokensOut } = await agente("Quantos eletricistas?", sb);
    expect(texto).toBe("Há 12 eletricistas cadastrados.");
    expect(tokensIn).toBe(100);
    expect(tokensOut).toBe(50);
  });

  it("executa tool e retorna resposta final na segunda iteração", async () => {
    mockCreate
      .mockResolvedValueOnce(
        respostaToolUse([{ name: "contar_por_categoria", input: {} }])
      )
      .mockResolvedValueOnce(respostaFinal("Construção lidera com 8 cadastros."));

    const sb = mockSupabase([{ categoria: "Construção e Reforma", total: 8 }]);
    const { texto } = await agente("Qual categoria domina?", sb);
    expect(texto).toBe("Construção lidera com 8 cadastros.");
    expect(sb.rpc).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("acumula tokens de todas as iterações", async () => {
    mockCreate
      .mockResolvedValueOnce(respostaToolUse([{ name: "bairros_com_menos_oferta" }]))
      .mockResolvedValueOnce(respostaFinal("Novo Hamburgo tem menos cobertura."));

    const sb = mockSupabase([]);
    const { tokensIn, tokensOut } = await agente("Bairros descobertos?", sb);
    // Iteração 1: 80 in + 30 out; Iteração 2: 100 in + 50 out
    expect(tokensIn).toBe(180);
    expect(tokensOut).toBe(80);
  });

  it("repassa erro de tool ao LLM como tool_result com is_error", async () => {
    mockCreate
      .mockResolvedValueOnce(
        respostaToolUse([{ name: "contar_por_categoria", input: {} }])
      )
      .mockResolvedValueOnce(respostaFinal("Não consegui obter os dados."));

    const sb = mockSupabaseErro("permissão negada");
    const { texto } = await agente("Distribuição?", sb);
    // Agente respondeu mesmo com erro de tool
    expect(texto).toBe("Não consegui obter os dados.");
    // Segundo call ao LLM recebeu tool_result com is_error
    const segundoCall = mockCreate.mock.calls[1][0];
    const toolResult = segundoCall.messages
      .at(-1).content.find((b) => b.type === "tool_result");
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain("permissão negada");
  });

  it("usa as tools definidas na chamada ao LLM", async () => {
    mockCreate.mockResolvedValue(respostaFinal("ok"));
    await agente("teste", mockSupabase([]));
    const chamada = mockCreate.mock.calls[0][0];
    expect(chamada.tools).toEqual(TOOLS);
    expect(chamada.model).toBe(MODELO_AGENTE);
  });

  it("lança erro após exceder MAX_ITER sem end_turn", async () => {
    mockCreate.mockResolvedValue(
      respostaToolUse([{ name: "contar_por_categoria" }])
    );
    const sb = mockSupabase([]);
    await expect(agente("loop infinito?", sb)).rejects.toThrow(
      "excedeu limite de iterações"
    );
  });
});
