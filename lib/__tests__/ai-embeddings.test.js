import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MODELO_EMBEDDING,
  DIMS,
  textoParaEmbedding,
  gerarEmbedding,
  gerarEmbeddingsBatch,
  buscarPorSimilaridade,
  gerarEmbeddingsProfissional,
  backfillEmbeddings,
} from "../ai/embeddings";
import { descricaoGerada } from "../ai/descricoes-geradas";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function respostaVoyage(n = 1) {
  return {
    ok: true,
    json: async () => ({
      data: Array.from({ length: n }, () => ({
        embedding: new Array(DIMS).fill(0.1),
      })),
    }),
    text: async () => "",
  };
}

function erroVoyage(status = 401) {
  return {
    ok: false,
    status,
    text: async () => "Unauthorized",
  };
}

function mockSupabase({ servicos = [], rpcData = [], updateOk = true } = {}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateOk ? null : { message: "update error" } }),
  });
  const select = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: servicos, error: null }),
        // para gerarEmbeddingsProfissional (sem .order)
        [Symbol.asyncIterator]: undefined,
      }),
      // para gerarEmbeddingsProfissional sem .is ou .order intermediário
    }),
    is: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: servicos, error: null }),
    }),
  });
  return {
    from: vi.fn().mockReturnValue({ select, update }),
    rpc: vi.fn().mockResolvedValue({ data: rpcData, error: null }),
  };
}

// ---------------------------------------------------------------------------
// constantes
// ---------------------------------------------------------------------------

describe("constantes", () => {
  it("MODELO_EMBEDDING é voyage-3-lite", () => {
    expect(MODELO_EMBEDDING).toBe("voyage-3-lite");
  });

  it("DIMS é 512", () => {
    expect(DIMS).toBe(512);
  });
});

// ---------------------------------------------------------------------------
// textoParaEmbedding
// ---------------------------------------------------------------------------

describe("textoParaEmbedding", () => {
  it("combina servico e descricao quando descricao existe", () => {
    expect(textoParaEmbedding("Eletricista", "Residencial com 10 anos.")).toBe(
      "Eletricista: Residencial com 10 anos."
    );
  });

  it("retorna só o servico quando descricao é null", () => {
    expect(textoParaEmbedding("Pedreiro", null)).toBe("Pedreiro");
  });

  it("retorna só o servico quando descricao é string vazia", () => {
    expect(textoParaEmbedding("Diarista", "")).toBe("Diarista");
  });

  it("ignora espaços em branco na descricao", () => {
    expect(textoParaEmbedding("Pintor", "   ")).toBe("Pintor");
  });

  it("usa a bio quando não há descrição do serviço", () => {
    expect(textoParaEmbedding("Unhas em gel", null, "Faço unhas há 5 anos")).toBe(
      "Unhas em gel: Faço unhas há 5 anos"
    );
  });

  it("prioriza a descrição do serviço sobre a bio", () => {
    expect(
      textoParaEmbedding("Pintor", "Pintura residencial", "Bio genérica do profissional")
    ).toBe("Pintor: Pintura residencial");
  });

  it("remove emoji do nome do serviço", () => {
    expect(textoParaEmbedding("🧶 Artesã de Crochê", null)).toBe("Artesã de Crochê");
  });

  it("colapsa espaços extras", () => {
    expect(textoParaEmbedding("Penteado ,  maquiagem", null)).toBe("Penteado , maquiagem");
  });
});

// ---------------------------------------------------------------------------
// descricaoGerada
// ---------------------------------------------------------------------------

describe("descricaoGerada", () => {
  it("retorna a descrição aprovada para serviço conhecido sem bio", () => {
    expect(descricaoGerada("Unhas em gel/manicure")).toMatch(/manicure/i);
  });

  it("retorna null para serviço sem descrição gerada", () => {
    expect(descricaoGerada("Eletricista")).toBeNull();
  });

  it("retorna null para entrada vazia", () => {
    expect(descricaoGerada(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// gerarEmbedding
// ---------------------------------------------------------------------------

describe("gerarEmbedding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chama Voyage API com modelo e texto corretos", async () => {
    mockFetch.mockResolvedValue(respostaVoyage(1));
    process.env.VOYAGE_API_KEY = "test-key";

    await gerarEmbedding("eletricista residencial");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.voyageai.com/v1/embeddings");
    const body = JSON.parse(opts.body);
    expect(body.model).toBe("voyage-3-lite");
    expect(body.input).toBe("eletricista residencial");
  });

  it("retorna array de 512 floats", async () => {
    mockFetch.mockResolvedValue(respostaVoyage(1));
    const emb = await gerarEmbedding("teste");
    expect(emb).toHaveLength(512);
  });

  it("lança erro quando API retorna status não-ok", async () => {
    mockFetch.mockResolvedValue(erroVoyage(401));
    await expect(gerarEmbedding("teste")).rejects.toThrow("Voyage API 401");
  });

  it("lança erro quando VOYAGE_API_KEY não está configurada", async () => {
    delete process.env.VOYAGE_API_KEY;
    await expect(gerarEmbedding("teste")).rejects.toThrow("VOYAGE_API_KEY não configurada");
    process.env.VOYAGE_API_KEY = "test-key";
  });
});

// ---------------------------------------------------------------------------
// gerarEmbeddingsBatch
// ---------------------------------------------------------------------------

describe("gerarEmbeddingsBatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna array vazio para input vazio", async () => {
    const result = await gerarEmbeddingsBatch([]);
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("retorna N embeddings para N textos", async () => {
    mockFetch.mockResolvedValue(respostaVoyage(3));
    const result = await gerarEmbeddingsBatch(["a", "b", "c"]);
    expect(result).toHaveLength(3);
    result.forEach((e) => expect(e).toHaveLength(512));
  });

  it("faz múltiplas chamadas para lotes > 128", async () => {
    mockFetch.mockResolvedValue(respostaVoyage(128));
    const textos = Array.from({ length: 130 }, (_, i) => `texto ${i}`);
    await gerarEmbeddingsBatch(textos);
    // 130 textos → lote de 128 + lote de 2 = 2 chamadas
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// buscarPorSimilaridade
// ---------------------------------------------------------------------------

describe("buscarPorSimilaridade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(respostaVoyage(1));
    process.env.VOYAGE_API_KEY = "test-key";
  });

  it("chama supabase.rpc com query_embedding e limites", async () => {
    const sb = mockSupabase({ rpcData: [{ servico_id: "123", similaridade: 0.95 }] });
    const resultado = await buscarPorSimilaridade("eletricista", sb, { limite: 5 });
    expect(sb.rpc).toHaveBeenCalledWith("ai_buscar_servicos", {
      query_embedding: expect.any(Array),
      p_limite: 5,
      p_categoria: null,
      p_min_similaridade: 0.4,
    });
    expect(resultado).toHaveLength(1);
  });

  it("passa categoria quando fornecida", async () => {
    const sb = mockSupabase({ rpcData: [] });
    await buscarPorSimilaridade("pintor", sb, { categoria: "Construção e Reforma" });
    const call = sb.rpc.mock.calls[0][1];
    expect(call.p_categoria).toBe("Construção e Reforma");
  });

  it("repassa minSimilaridade customizado", async () => {
    const sb = mockSupabase({ rpcData: [] });
    await buscarPorSimilaridade("pintor", sb, { minSimilaridade: 0.6 });
    const call = sb.rpc.mock.calls[0][1];
    expect(call.p_min_similaridade).toBe(0.6);
  });

  it("lança erro quando rpc retorna error", async () => {
    const sb = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "rpc error" } }) };
    await expect(buscarPorSimilaridade("test", sb)).rejects.toThrow("rpc error");
  });
});

// ---------------------------------------------------------------------------
// gerarEmbeddingsProfissional
// ---------------------------------------------------------------------------

describe("gerarEmbeddingsProfissional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(respostaVoyage(2));
    process.env.VOYAGE_API_KEY = "test-key";
  });

  it("retorna 0 quando não há serviços sem embedding", async () => {
    const sb = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        update: vi.fn(),
      }),
    };
    const resultado = await gerarEmbeddingsProfissional(sb, "prof-1");
    expect(resultado).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("gera e persiste embeddings para os serviços pendentes", async () => {
    const servicos = [
      { id: "s1", servico: "Eletricista", descricao: "Residencial" },
      { id: "s2", servico: "Pintor", descricao: null },
    ];
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const sb = {
      from: vi.fn().mockImplementation((tabela) => {
        if (tabela === "profissional_servicos") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: servicos, error: null }),
              }),
            }),
            update,
          };
        }
      }),
    };

    const resultado = await gerarEmbeddingsProfissional(sb, "prof-1");
    expect(resultado).toBe(2);
    expect(update).toHaveBeenCalledTimes(2);
  });
});
