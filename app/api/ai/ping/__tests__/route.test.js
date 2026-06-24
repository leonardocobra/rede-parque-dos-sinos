// Testes do Route Handler GET /api/ai/ping.
//
// Cobre:
//   1. Caminho feliz — SDK retorna uso, linha gravada, resposta 200.
//   2. Falha da API Anthropic — sucesso=false, erro gravado, rota ainda responde 200.
//   3. Ausência de API key — não lança, não vaza a chave na resposta.
//   4. Resposta nunca contém a ANTHROPIC_API_KEY.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (hoistados pelo Vitest antes dos imports reais)
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
vi.mock("../../../../../lib/supabase/service", () => ({
  getServiceSupabase: () => ({ from: mockFrom }),
}));

import { GET } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq() {
  return new Request("http://localhost/api/ai/ping");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-do-not-leak";
});

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("GET /api/ai/ping", () => {
  it("retorna 200 com ok=true e tokens no caminho feliz", async () => {
    mockCreate.mockResolvedValue({
      usage: { input_tokens: 5, output_tokens: 3 },
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tokens_in).toBe(5);
    expect(json.tokens_out).toBe(3);
    expect(json.latencia_ms).toBeTypeOf("number");
    expect(json.custo).toBeTypeOf("number");
    expect(json.erro).toBeNull();
  });

  it("grava uma linha em ai_invocacoes com tokens e sucesso corretos", async () => {
    mockCreate.mockResolvedValue({
      usage: { input_tokens: 8, output_tokens: 4 },
    });

    await GET(makeReq());

    expect(mockFrom).toHaveBeenCalledWith("ai_invocacoes");
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.tokens_in).toBe(8);
    expect(payload.tokens_out).toBe(4);
    expect(payload.sucesso).toBe(true);
    expect(payload.erro).toBeNull();
    expect(payload.rota).toBe("/api/ai/ping");
  });

  it("retorna ok=false e grava erro quando a API Anthropic falha", async () => {
    mockCreate.mockRejectedValue(new Error("timeout da API"));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.erro).toMatch(/timeout/i);

    const payload = mockInsert.mock.calls[0][0];
    expect(payload.sucesso).toBe(false);
    expect(payload.erro).toMatch(/timeout/i);
  });

  it("NUNCA vaza a ANTHROPIC_API_KEY no corpo da resposta", async () => {
    mockCreate.mockResolvedValue({
      usage: { input_tokens: 2, output_tokens: 1 },
    });

    const res = await GET(makeReq());
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain(process.env.ANTHROPIC_API_KEY);
    expect(body).not.toContain("sk-ant");
  });

  it("responde 200 mesmo sem ANTHROPIC_API_KEY definida (SDK lança, handler captura)", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockCreate.mockRejectedValue(new Error("API key inválida"));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(false);
    // A string da chave não estava definida — só confirma que não está no body
    expect(JSON.stringify(json)).not.toContain("sk-ant");
  });
});
