import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ServicoSchema,
  PerfilExtraidoSchema,
  SugestaoDescricaoSchema,
  CATS_ENUM,
  persistirPerfil,
} from "../ai/onboarding";

// ---------------------------------------------------------------------------
// ServicoSchema
// ---------------------------------------------------------------------------

describe("ServicoSchema", () => {
  it("aceita serviço válido com categoria conhecida", () => {
    const r = ServicoSchema.safeParse({ servico: "Eletricista", categoria: "Construção e Reforma" });
    expect(r.success).toBe(true);
  });

  it("rejeita categoria fora do enum", () => {
    const r = ServicoSchema.safeParse({ servico: "Eletricista", categoria: "Categoria Inventada" });
    expect(r.success).toBe(false);
  });

  it("rejeita serviço com menos de 2 caracteres", () => {
    const r = ServicoSchema.safeParse({ servico: "E", categoria: "Veículos" });
    expect(r.success).toBe(false);
  });

  it("transforma descricao null/undefined em null", () => {
    const r = ServicoSchema.safeParse({ servico: "Pintor", categoria: "Construção e Reforma", descricao: undefined });
    expect(r.success).toBe(true);
    expect(r.data.descricao).toBeNull();
  });

  it("transforma instagram vazio em null", () => {
    const r = ServicoSchema.safeParse({ servico: "Pintor", categoria: "Construção e Reforma", instagram: "   " });
    expect(r.success).toBe(true);
    expect(r.data.instagram).toBeNull();
  });

  it("aceita todos os valores do CATS_ENUM", () => {
    for (const cat of CATS_ENUM) {
      const r = ServicoSchema.safeParse({ servico: "Serviço teste", categoria: cat });
      expect(r.success, `Falhou para categoria: ${cat}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// PerfilExtraidoSchema
// ---------------------------------------------------------------------------

const PERFIL_VALIDO = {
  nome: "João Silva",
  telefone: "(12) 99999-0000",
  servicos: [{ servico: "Eletricista", categoria: "Construção e Reforma" }],
};

describe("PerfilExtraidoSchema", () => {
  it("aceita perfil mínimo (nome + telefone + 1 serviço)", () => {
    const r = PerfilExtraidoSchema.safeParse(PERFIL_VALIDO);
    expect(r.success).toBe(true);
  });

  it("aceita perfil completo com campos opcionais", () => {
    const r = PerfilExtraidoSchema.safeParse({
      ...PERFIL_VALIDO,
      bairro: "Parque dos Sinos",
      regioes: "Toda Jacareí",
      instagram: "joaoeletricista",
      experiencia: "10 anos",
      descricao: "Eletricista residencial e predial.",
      servicos: [
        { servico: "Eletricista", categoria: "Construção e Reforma", descricao: "Instalações elétricas." },
        { servico: "Pedreiro", categoria: "Construção e Reforma" },
      ],
    });
    expect(r.success).toBe(true);
    expect(r.data.servicos).toHaveLength(2);
  });

  it("rejeita quando nome está ausente", () => {
    // eslint-disable-next-line no-unused-vars
    const { nome: _n, ...semNome } = PERFIL_VALIDO;
    expect(PerfilExtraidoSchema.safeParse(semNome).success).toBe(false);
  });

  it("rejeita quando telefone está ausente", () => {
    // eslint-disable-next-line no-unused-vars
    const { telefone: _t, ...semTel } = PERFIL_VALIDO;
    expect(PerfilExtraidoSchema.safeParse(semTel).success).toBe(false);
  });

  it("rejeita lista de serviços vazia", () => {
    const r = PerfilExtraidoSchema.safeParse({ ...PERFIL_VALIDO, servicos: [] });
    expect(r.success).toBe(false);
  });

  it("rejeita mais de 3 serviços", () => {
    const s = { servico: "Pintor", categoria: "Construção e Reforma" };
    const r = PerfilExtraidoSchema.safeParse({ ...PERFIL_VALIDO, servicos: [s, s, s, s] });
    expect(r.success).toBe(false);
  });

  it("rejeita serviço com categoria inválida dentro do array", () => {
    const r = PerfilExtraidoSchema.safeParse({
      ...PERFIL_VALIDO,
      servicos: [{ servico: "Teste", categoria: "Inexistente" }],
    });
    expect(r.success).toBe(false);
  });

  it("campos opcionais ausentes viram null após parse", () => {
    const r = PerfilExtraidoSchema.safeParse(PERFIL_VALIDO);
    expect(r.success).toBe(true);
    expect(r.data.bairro).toBeNull();
    expect(r.data.instagram).toBeNull();
    expect(r.data.experiencia).toBeNull();
  });

  it("faz trim em nome e telefone", () => {
    const r = PerfilExtraidoSchema.safeParse({
      ...PERFIL_VALIDO,
      nome: "  Maria Costa  ",
      telefone: " (12) 99000-0001 ",
    });
    expect(r.success).toBe(true);
    expect(r.data.nome).toBe("Maria Costa");
    expect(r.data.telefone).toBe("(12) 99000-0001");
  });
});

// ---------------------------------------------------------------------------
// SugestaoDescricaoSchema
// ---------------------------------------------------------------------------

describe("SugestaoDescricaoSchema", () => {
  it("aceita sugestão válida", () => {
    const r = SugestaoDescricaoSchema.safeParse({
      bio: "Eletricista com 10 anos de experiência.",
      servicos: [{ servico: "Eletricista", descricao_sugerida: "Instalações residenciais e prediais." }],
    });
    expect(r.success).toBe(true);
  });

  it("rejeita bio vazia", () => {
    const r = SugestaoDescricaoSchema.safeParse({
      bio: "",
      servicos: [{ servico: "Pintor", descricao_sugerida: "Pintura interna e externa." }],
    });
    expect(r.success).toBe(false);
  });

  it("rejeita array de serviços vazio", () => {
    const r = SugestaoDescricaoSchema.safeParse({ bio: "Bio válida.", servicos: [] });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// persistirPerfil — verifica payloads enviados ao Supabase
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsertProf = vi.fn(() => ({ select: mockSelect }));
const mockInsertServicos = vi.fn(() => Promise.resolve({ error: null }));
const mockFrom = vi.fn((tabela) => {
  if (tabela === "profissionais") return { insert: mockInsertProf };
  if (tabela === "profissional_servicos") return { insert: mockInsertServicos };
});
const mockSb = { from: mockFrom };

const PERFIL_COMPLETO = {
  nome: "Ana Souza",
  telefone: "(12) 99123-4567",
  bairro: "Parque dos Sinos",
  regioes: null,
  instagram: "anasouza",
  experiencia: "5 anos",
  descricao: "Especialista em limpeza residencial.",
  servicos: [
    { servico: "Diarista", categoria: "Limpeza e Cuidados", descricao: "Limpeza completa.", instagram: null },
  ],
};

describe("persistirPerfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "prof-uuid-123" }, error: null });
    mockInsertServicos.mockResolvedValue({ error: null });
  });

  it("insere profissional com os campos corretos", async () => {
    await persistirPerfil(mockSb, PERFIL_COMPLETO);
    expect(mockFrom).toHaveBeenCalledWith("profissionais");
    const payload = mockInsertProf.mock.calls[0][0];
    expect(payload.nome).toBe("Ana Souza");
    expect(payload.telefone).toBe("(12) 99123-4567");
    expect(payload.bairro).toBe("Parque dos Sinos");
    expect(payload.instagram).toBe("anasouza");
  });

  it("insere serviços com profissional_id, ordem, descricao e instagram", async () => {
    await persistirPerfil(mockSb, PERFIL_COMPLETO);
    expect(mockFrom).toHaveBeenCalledWith("profissional_servicos");
    const payload = mockInsertServicos.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].profissional_id).toBe("prof-uuid-123");
    expect(payload[0].servico).toBe("Diarista");
    expect(payload[0].categoria).toBe("Limpeza e Cuidados");
    expect(payload[0].ordem).toBe(0);
    expect(payload[0].descricao).toBe("Limpeza completa.");
  });

  it("lança erro quando o insert de profissional falha", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "violação de constraint" } });
    await expect(persistirPerfil(mockSb, PERFIL_COMPLETO)).rejects.toThrow("violação de constraint");
  });

  it("lança erro quando o insert de serviços falha", async () => {
    mockInsertServicos.mockResolvedValue({ error: { message: "máximo de serviços atingido" } });
    await expect(persistirPerfil(mockSb, PERFIL_COMPLETO)).rejects.toThrow("máximo de serviços");
  });

  it("retorna o profissional_id criado", async () => {
    const id = await persistirPerfil(mockSb, PERFIL_COMPLETO);
    expect(id).toBe("prof-uuid-123");
  });
});
