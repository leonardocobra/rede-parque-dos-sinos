// Testes do Route Handler POST /api/ai/onboarding
//
// Cobre:
//   1. Validação de entrada (messages ausente → 400)
//   2. Streaming de texto: eventos SSE chegam ao cliente
//   3. sugerir_descricao: emite evento descricao_sugerida
//   4. extrair_perfil válido: valida com Zod, persiste, emite salvo
//   5. extrair_perfil inválido: emite tool_result com erro, não persiste
//   6. Falha da API Anthropic: emite evento erro, não vaza API key
//   7. ANTHROPIC_API_KEY nunca aparece na resposta

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declarados antes de qualquer import da rota
// ---------------------------------------------------------------------------

const mockFinalMessage = vi.fn();
const mockStreamEvents = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockImplementation(() => ({
        [Symbol.asyncIterator]: async function* () {
          for (const ev of mockStreamEvents()) yield ev;
        },
        finalMessage: mockFinalMessage,
      })),
    },
  })),
}));

const mockInsertServicos = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn().mockResolvedValue({ data: { id: "novo-prof-id" }, error: null });
vi.mock("../../../../../lib/supabase/service", () => ({
  getServiceSupabase: () => ({
    from: (tabela) => {
      if (tabela === "profissionais") return { insert: () => ({ select: () => ({ single: mockSingle }) }) };
      if (tabela === "profissional_servicos") return { insert: mockInsertServicos };
      if (tabela === "ai_invocacoes") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    },
  }),
}));

import { POST } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(body) {
  return new Request("http://localhost/api/ai/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function coletarEventos(response) {
  const events = [];
  const reader = response.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const partes = buf.split("\n\n");
    buf = partes.pop() ?? "";
    for (const parte of partes) {
      for (const linha of parte.split("\n")) {
        if (!linha.startsWith("data: ")) continue;
        const payload = linha.slice(6);
        if (payload === "[DONE]") return events;
        try { events.push(JSON.parse(payload)); } catch { /* ignora */ }
      }
    }
  }
  return events;
}

function mensagemFinal(stopReason = "end_turn", conteudo = []) {
  return {
    stop_reason: stopReason,
    content: conteudo,
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

const MSG_USER = [{ role: "user", content: "Quero me cadastrar" }];

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-segredo-nao-vazar";
});

describe("POST /api/ai/onboarding — validação de entrada", () => {
  it("retorna 400 quando body é JSON inválido", async () => {
    const req = new Request("http://localhost/api/ai/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ não é json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando messages está ausente", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando messages é array vazio", async () => {
    const res = await POST(makeReq({ messages: [] }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/ai/onboarding — streaming de texto", () => {
  it("emite eventos text com o delta do assistente", async () => {
    mockStreamEvents.mockReturnValue([
      { type: "content_block_delta", delta: { type: "text_delta", text: "Olá! " } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Qual seu nome?" } },
    ]);
    mockFinalMessage.mockResolvedValue(mensagemFinal("end_turn"));

    const res = await POST(makeReq({ messages: MSG_USER }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const eventos = await coletarEventos(res);
    const textos = eventos.filter((e) => e.type === "text");
    expect(textos).toHaveLength(2);
    expect(textos[0].delta).toBe("Olá! ");
    expect(textos[1].delta).toBe("Qual seu nome?");
  });
});

describe("POST /api/ai/onboarding — tool-use: sugerir_descricao", () => {
  it("emite evento descricao_sugerida quando a ferramenta é chamada", async () => {
    const toolBlock = {
      type: "tool_use",
      id: "tool-1",
      name: "sugerir_descricao",
      input: {
        bio: "Eletricista com 10 anos de experiência.",
        servicos: [{ servico: "Eletricista", descricao_sugerida: "Instalações residenciais e prediais." }],
      },
    };

    // 1ª chamada: Claude chama sugerir_descricao
    mockStreamEvents
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]); // 2ª chamada após tool_result

    mockFinalMessage
      .mockResolvedValueOnce(mensagemFinal("tool_use", [toolBlock]))
      .mockResolvedValueOnce(mensagemFinal("end_turn"));

    const eventos = await coletarEventos(await POST(makeReq({ messages: MSG_USER })));
    const ev = eventos.find((e) => e.type === "descricao_sugerida");
    expect(ev).toBeDefined();
    expect(ev.bio).toBe("Eletricista com 10 anos de experiência.");
    expect(ev.servicos[0].servico).toBe("Eletricista");
  });
});

describe("POST /api/ai/onboarding — tool-use: extrair_perfil", () => {
  const toolBlockValido = {
    type: "tool_use",
    id: "tool-2",
    name: "extrair_perfil",
    input: {
      nome: "João Elétrico",
      telefone: "(12) 99000-1111",
      servicos: [{ servico: "Eletricista", categoria: "Construção e Reforma" }],
    },
  };

  it("valida com Zod, persiste no banco e emite evento salvo", async () => {
    mockStreamEvents.mockReturnValue([]);
    mockFinalMessage
      .mockResolvedValueOnce(mensagemFinal("tool_use", [toolBlockValido]))
      .mockResolvedValueOnce(mensagemFinal("end_turn"));

    const eventos = await coletarEventos(await POST(makeReq({ messages: MSG_USER })));

    const evPerfil = eventos.find((e) => e.type === "perfil_extraido");
    expect(evPerfil).toBeDefined();
    expect(evPerfil.perfil.nome).toBe("João Elétrico");

    const evSalvo = eventos.find((e) => e.type === "salvo");
    expect(evSalvo).toBeDefined();
    expect(evSalvo.profissional_id).toBe("novo-prof-id");
  });

  it("não persiste e emite tool_result com erro quando Zod falha", async () => {
    const toolInvalido = {
      ...toolBlockValido,
      input: {
        nome: "X", // muito curto
        telefone: "123",
        servicos: [{ servico: "Ok", categoria: "Categoria Inválida" }],
      },
    };
    mockStreamEvents.mockReturnValue([]);
    mockFinalMessage
      .mockResolvedValueOnce(mensagemFinal("tool_use", [toolInvalido]))
      .mockResolvedValueOnce(mensagemFinal("end_turn"));

    const eventos = await coletarEventos(await POST(makeReq({ messages: MSG_USER })));

    // Não deve ter evento salvo
    expect(eventos.find((e) => e.type === "salvo")).toBeUndefined();
    // Insert não deve ter sido chamado
    expect(mockSingle).not.toHaveBeenCalled();
  });
});

describe("POST /api/ai/onboarding — falha da API e segurança", () => {
  it("emite evento erro quando o SDK lança exceção", async () => {
    mockStreamEvents.mockImplementation(function* () {
      throw new Error("timeout da API Anthropic");
    });
    mockFinalMessage.mockRejectedValue(new Error("timeout da API Anthropic"));

    const eventos = await coletarEventos(await POST(makeReq({ messages: MSG_USER })));
    const ev = eventos.find((e) => e.type === "erro");
    expect(ev).toBeDefined();
    expect(ev.mensagem).toMatch(/timeout/i);
  });

  it("NUNCA vaza a ANTHROPIC_API_KEY no corpo da resposta", async () => {
    mockStreamEvents.mockReturnValue([
      { type: "content_block_delta", delta: { type: "text_delta", text: "Olá!" } },
    ]);
    mockFinalMessage.mockResolvedValue(mensagemFinal("end_turn"));

    const res = await POST(makeReq({ messages: MSG_USER }));
    const eventos = await coletarEventos(res);
    const body = JSON.stringify(eventos);

    expect(body).not.toContain(process.env.ANTHROPIC_API_KEY ?? "sk-ant");
    expect(body).not.toContain("sk-ant");
  });
});
