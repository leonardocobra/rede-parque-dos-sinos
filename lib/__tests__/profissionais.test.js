import { describe, it, expect, vi, beforeEach } from "vitest";
import { sortServicos, getProfissional, getAvaliacoesDe, getProfissionaisDaCategoria, getOutrosDaCategoria, getOutrosPorCategoria } from "../profissionais";

// ---------------------------------------------------------------------------
// Mock do cliente Supabase
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("../supabase", () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}));
vi.mock("../perfil", () => ({
  filtrarOutros: vi.fn((profs) => profs),
}));

// Cria uma cadeia de métodos Supabase que resolve com `resolve`.
function chain(resolve) {
  const c = {
    select: () => c,
    eq: () => c,
    in: () => c,
    order: () => c,
    limit: () => c,
    maybeSingle: () => Promise.resolve(resolve),
    then: (f, r) => Promise.resolve(resolve).then(f, r),
    catch: (f) => Promise.resolve(resolve).catch(f),
    finally: (f) => Promise.resolve(resolve).finally(f),
  };
  return c;
}

beforeEach(() => {
  mockFrom.mockReset();
});

// ---------------------------------------------------------------------------
// sortServicos — função pura
// ---------------------------------------------------------------------------

describe("sortServicos", () => {
  it("retorna null/undefined sem modificar", () => {
    expect(sortServicos(null)).toBeNull();
    expect(sortServicos(undefined)).toBeUndefined();
  });

  it("ordena serviços pelo campo ordem", () => {
    const prof = {
      id: "p1",
      profissional_servicos: [
        { id: "s2", ordem: 1, servico: "B" },
        { id: "s1", ordem: 0, servico: "A" },
      ],
    };
    const result = sortServicos(prof);
    expect(result.profissional_servicos[0].id).toBe("s1");
    expect(result.profissional_servicos[1].id).toBe("s2");
  });

  it("quando não há profissional_servicos retorna array vazio", () => {
    const prof = { id: "p1" };
    expect(sortServicos(prof).profissional_servicos).toEqual([]);
  });

  it("filtra itens inativos e ordena os ativos por ordem", () => {
    const prof = {
      id: "p1",
      profissional_servicos: [
        {
          id: "s1",
          ordem: 0,
          profissional_itens: [
            { id: "i3", ordem: 2, ativo: true },
            { id: "i1", ordem: 0, ativo: false },
            { id: "i2", ordem: 1, ativo: true },
          ],
        },
      ],
    };
    const servico = sortServicos(prof).profissional_servicos[0];
    expect(servico.profissional_itens.map((i) => i.id)).toEqual(["i2", "i3"]);
  });

  it("serviço sem profissional_itens é passado sem alteração", () => {
    const prof = {
      id: "p1",
      profissional_servicos: [{ id: "s1", ordem: 0, servico: "X" }],
    };
    const servico = sortServicos(prof).profissional_servicos[0];
    expect(servico.profissional_itens).toBeUndefined();
  });

  it("retorna um novo objeto (não a mesma referência)", () => {
    const prof = { id: "p1", profissional_servicos: [] };
    const result = sortServicos(prof);
    expect(result).not.toBe(prof);
  });
});

// ---------------------------------------------------------------------------
// getProfissional — guarda de null + caso de sucesso
// ---------------------------------------------------------------------------

describe("getProfissional", () => {
  it("retorna null para id nulo sem chamar o banco", async () => {
    const result = await getProfissional(null);
    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("retorna null para id vazio", async () => {
    const result = await getProfissional("");
    expect(result).toBeNull();
  });

  it("retorna null quando o banco retorna erro", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: "not found" } }));
    const result = await getProfissional("uuid-inexistente");
    expect(result).toBeNull();
  });

  it("retorna dados ordenados quando o banco tem o registro", async () => {
    const dados = {
      id: "p1",
      nome: "Eliverson",
      profissional_servicos: [
        { id: "s2", ordem: 1, profissional_itens: [] },
        { id: "s1", ordem: 0, profissional_itens: [] },
      ],
    };
    mockFrom.mockReturnValueOnce(chain({ data: dados, error: null }));
    const result = await getProfissional("p1");
    expect(result.profissional_servicos[0].id).toBe("s1");
  });

  it("retorna null quando o banco retorna data: null sem erro", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: null }));
    const result = await getProfissional("p-inexistente");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAvaliacoesDe — guarda de null + retorno
// ---------------------------------------------------------------------------

describe("getAvaliacoesDe", () => {
  it("retorna [] para id nulo sem chamar o banco", async () => {
    const result = await getAvaliacoesDe(null);
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("retorna lista vazia quando não há avaliações", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));
    const result = await getAvaliacoesDe("p1");
    expect(result).toEqual([]);
  });

  it("retorna as avaliações recebidas do banco", async () => {
    const avals = [{ id: "a1", nota: 5 }];
    mockFrom.mockReturnValueOnce(chain({ data: avals }));
    const result = await getAvaliacoesDe("p1");
    expect(result).toEqual(avals);
  });
});

// ---------------------------------------------------------------------------
// getProfissionaisDaCategoria — guardas de entrada
// ---------------------------------------------------------------------------

describe("getProfissionaisDaCategoria", () => {
  it("retorna [] para categoria vazia sem chamar o banco", async () => {
    const result = await getProfissionaisDaCategoria("");
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("retorna [] quando nenhum serviço encontrado para a categoria", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));
    const result = await getProfissionaisDaCategoria("Limpeza");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getOutrosDaCategoria — guardas de entrada
// ---------------------------------------------------------------------------

describe("getOutrosDaCategoria", () => {
  it("retorna [] para categoria vazia", async () => {
    const result = await getOutrosDaCategoria("");
    expect(result).toEqual([]);
  });

  it("retorna [] quando só o próprio profissional está na categoria", async () => {
    // Banco retorna somente o exceptId
    mockFrom.mockReturnValueOnce(chain({ data: [{ profissional_id: "p1" }] }));
    const result = await getOutrosDaCategoria("Limpeza", "p1");
    expect(result).toEqual([]);
    // Segunda chamada ao banco não deve ocorrer (ids filtrados ficam vazios)
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getOutrosPorCategoria — guardas de entrada
// ---------------------------------------------------------------------------

describe("getOutrosPorCategoria", () => {
  it("retorna {} para lista vazia de categorias", async () => {
    const result = await getOutrosPorCategoria([]);
    expect(result).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("retorna {} para lista com apenas valores falsy", async () => {
    const result = await getOutrosPorCategoria([null, "", undefined]);
    expect(result).toEqual({});
  });

  it("retorna map com listas vazias quando nenhum serviço está nas categorias", async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));
    const result = await getOutrosPorCategoria(["Limpeza", "Pintura"], "p1");
    expect(result).toEqual({ Limpeza: [], Pintura: [] });
  });
});
