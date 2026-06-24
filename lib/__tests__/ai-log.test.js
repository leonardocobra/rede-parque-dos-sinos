import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcularCusto, gravarInvocacao } from "../ai/log";

// ---------------------------------------------------------------------------
// calcularCusto — função pura, sem mocks
// ---------------------------------------------------------------------------

describe("calcularCusto", () => {
  it("haiku: calcula custo de entrada e saída corretamente", () => {
    // 1 000 tokens in × $0.80/MTok = $0.0008
    // 100  tokens out × $4.00/MTok = $0.0004
    const custo = calcularCusto("claude-haiku-4-5-20251001", 1_000, 100);
    expect(custo).toBeCloseTo(0.0008 + 0.0004, 8);
  });

  it("alias curto (claude-haiku-4-5) resulta no mesmo custo", () => {
    const c1 = calcularCusto("claude-haiku-4-5-20251001", 500, 50);
    const c2 = calcularCusto("claude-haiku-4-5", 500, 50);
    expect(c1).toBe(c2);
  });

  it("custo é zero quando tokens são zero", () => {
    expect(calcularCusto("claude-haiku-4-5-20251001", 0, 0)).toBe(0);
  });

  it("modelo desconhecido usa preço de fallback (haiku) sem lançar erro", () => {
    expect(() => calcularCusto("modelo-inexistente", 100, 10)).not.toThrow();
    // Não importa o valor — só que não quebra e retorna número
    expect(calcularCusto("modelo-inexistente", 100, 10)).toBeTypeOf("number");
  });

  it("sonnet custa mais que haiku para os mesmos tokens", () => {
    const haiku = calcularCusto("claude-haiku-4-5-20251001", 1_000, 1_000);
    const sonnet = calcularCusto("claude-sonnet-4-6", 1_000, 1_000);
    expect(sonnet).toBeGreaterThan(haiku);
  });
});

// ---------------------------------------------------------------------------
// gravarInvocacao — verifica payload inserido no Supabase
// ---------------------------------------------------------------------------

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
const mockSupabase = { from: mockFrom };

const PARAMS = {
  modelo: "claude-haiku-4-5-20251001",
  tokensIn: 10,
  tokensOut: 5,
  custo: 0.000002,
  latenciaMs: 350,
  sucesso: true,
  erro: null,
  rota: "/api/ai/ping",
};

describe("gravarInvocacao", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockInsert.mockClear();
  });

  it("grava na tabela 'ai_invocacoes' com todos os campos esperados", async () => {
    await gravarInvocacao(mockSupabase, PARAMS);
    expect(mockFrom).toHaveBeenCalledWith("ai_invocacoes");
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.modelo).toBe(PARAMS.modelo);
    expect(payload.tokens_in).toBe(PARAMS.tokensIn);
    expect(payload.tokens_out).toBe(PARAMS.tokensOut);
    expect(payload.custo).toBe(PARAMS.custo);
    expect(payload.latencia_ms).toBe(PARAMS.latenciaMs);
    expect(payload.sucesso).toBe(true);
    expect(payload.erro).toBeNull();
    expect(payload.rota).toBe(PARAMS.rota);
  });

  it("não lança quando supabase é null (service_role indisponível)", async () => {
    await expect(gravarInvocacao(null, PARAMS)).resolves.toBeUndefined();
  });

  it("converte erro undefined para null no payload", async () => {
    await gravarInvocacao(mockSupabase, { ...PARAMS, erro: undefined });
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.erro).toBeNull();
  });

  it("captura latência passada diretamente (sem calcular internamente)", async () => {
    await gravarInvocacao(mockSupabase, { ...PARAMS, latenciaMs: 999 });
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.latencia_ms).toBe(999);
  });
});
