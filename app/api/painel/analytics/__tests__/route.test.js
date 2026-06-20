// Testes do guard de autenticação e ownership (RLS em nível de aplicação)
// da rota GET /api/painel/analytics.
//
// Por que este arquivo: a route valida (1) sessão ativa, (2) profissional_id
// presente e (3) que o profissional pertence ao usuário autenticado antes de
// tocar no service_role. Estes são os mesmos controles que o RLS do banco
// faria — testá-los aqui garante que nenhum refactor quebre o guard.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockProfQuery = vi.fn();
const mockEventosQuery = vi.fn();

vi.mock("../../../../../lib/supabase/server", () => ({
  getServerSupabase: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockProfQuery }) }) }),
    }),
  }),
}));

vi.mock("../../../../../lib/supabase/service", () => ({
  getServiceSupabase: vi.fn(),
}));

vi.mock("../../../../../lib/painelAnalytics", () => ({
  computaAnaliticasPerfil: vi.fn(() => ({ kpis: {}, serie: [] })),
}));

import { getServiceSupabase } from "../../../../../lib/supabase/service";
import { computaAnaliticasPerfil } from "../../../../../lib/painelAnalytics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(params = {}) {
  const url = new URL("http://localhost/api/painel/analytics");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function serviceChain(eventos, error = null) {
  const c = {
    select: () => c,
    eq: () => c,
    gte: () => c,
    in: () => c,
    order: () => Promise.resolve({ data: eventos, error }),
  };
  return c;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("GET /api/painel/analytics — guards de autenticação e ownership", () => {
  it("retorna 401 quando não há usuário autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeReq({ profissional_id: "p1" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.erro).toMatch(/autenticad/i);
  });

  it("retorna 400 quando profissional_id está ausente", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.erro).toMatch(/profissional_id/i);
  });

  it("retorna 403 quando o profissional não pertence ao usuário (ownership guard)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    // RLS: query retorna null — profissional não é do usuário
    mockProfQuery.mockResolvedValue({ data: null, error: null });
    const res = await GET(makeReq({ profissional_id: "p-alheio" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.erro).toMatch(/autorizado/i);
  });

  it("retorna 503 quando service_role não está disponível", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockProfQuery.mockResolvedValue({ data: { id: "p1" }, error: null });
    getServiceSupabase.mockReturnValue(null);
    const res = await GET(makeReq({ profissional_id: "p1" }));
    expect(res.status).toBe(503);
  });

  it("retorna 500 quando a query de eventos falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockProfQuery.mockResolvedValue({ data: { id: "p1" }, error: null });
    getServiceSupabase.mockReturnValue({ from: () => serviceChain(null, { message: "db error" }) });
    const res = await GET(makeReq({ profissional_id: "p1" }));
    expect(res.status).toBe(500);
  });

  it("retorna 200 com os dados de analytics no caminho feliz", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockProfQuery.mockResolvedValue({ data: { id: "p1" }, error: null });
    getServiceSupabase.mockReturnValue({ from: () => serviceChain([{ tipo: "profile_view", criado_em: new Date().toISOString() }]) });
    computaAnaliticasPerfil.mockReturnValue({ kpis: { views: 1 }, serie: [] });
    const res = await GET(makeReq({ profissional_id: "p1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kpis).toBeDefined();
  });
});
