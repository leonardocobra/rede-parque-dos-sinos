import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseUtm, derivarOrigem, capturarAtribuicao, registrarEvento } from "../eventos";

// Mock do cliente Supabase do browser (usado em registrarEvento)
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

vi.mock("../supabase/client", () => ({
  getBrowserSupabase: () => ({ from: mockFrom }),
}));

describe("parseUtm", () => {
  it("extrai os três campos utm de uma query string", () => {
    expect(parseUtm("?utm_source=instagram&utm_medium=bio&utm_campaign=lancamento")).toEqual({
      utm_source: "instagram",
      utm_medium: "bio",
      utm_campaign: "lancamento",
    });
  });

  it("aceita query sem '?' inicial", () => {
    expect(parseUtm("utm_source=google")).toMatchObject({ utm_source: "google" });
  });

  it("retorna null para campos ausentes", () => {
    expect(parseUtm("")).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    });
  });

  it("trata valor vazio como null", () => {
    expect(parseUtm("?utm_source=").utm_source).toBeNull();
  });
});

describe("derivarOrigem", () => {
  it("sem referrer é direto", () => {
    expect(derivarOrigem("", "arede.app.br")).toBe("direto");
  });

  it("referrer inválido cai para direto", () => {
    expect(derivarOrigem("não-é-url", "arede.app.br")).toBe("direto");
  });

  it("navegação interna não troca a origem (null)", () => {
    expect(derivarOrigem("https://arede.app.br/catalogo", "arede.app.br")).toBeNull();
  });

  it("reconhece Instagram", () => {
    expect(derivarOrigem("https://www.instagram.com/", "arede.app.br")).toBe("instagram");
    expect(derivarOrigem("https://l.instagram.com/?u=x", "arede.app.br")).toBe("instagram");
  });

  it("agrupa buscadores como busca", () => {
    expect(derivarOrigem("https://www.google.com/search?q=x", "arede.app.br")).toBe("busca");
    expect(derivarOrigem("https://www.bing.com/", "arede.app.br")).toBe("busca");
  });

  it("trata links de mensageiros/sociais como compartilhado", () => {
    expect(derivarOrigem("https://wa.me/", "arede.app.br")).toBe("compartilhado");
    expect(derivarOrigem("https://t.co/abc", "arede.app.br")).toBe("compartilhado");
    expect(derivarOrigem("https://m.facebook.com/", "arede.app.br")).toBe("compartilhado");
  });

  it("guarda o host de outras origens externas", () => {
    expect(derivarOrigem("https://algumblog.com.br/post", "arede.app.br")).toBe("algumblog.com.br");
  });
});

// ---------------------------------------------------------------------------
// capturarAtribuicao — requer ambiente de browser (jsdom)
// ---------------------------------------------------------------------------

const CHAVE = "arede_atrib";

describe("capturarAtribuicao", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockFrom.mockClear();
    mockInsert.mockClear();
    // Reseta location para URL limpa sem UTM
    vi.stubGlobal("location", {
      search: "",
      hostname: "arede.app.br",
      pathname: "/",
    });
    Object.defineProperty(document, "referrer", { value: "", configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("cria atribuição com origem 'direto' quando não há UTM nem referrer", () => {
    const atrib = capturarAtribuicao();
    expect(atrib.origem).toBe("direto");
    expect(atrib.utm_source).toBeNull();
    expect(typeof atrib.sessao_id).toBe("string");
  });

  it("usa UTM como origem quando utm_source está presente", () => {
    vi.stubGlobal("location", {
      search: "?utm_source=instagram&utm_medium=bio",
      hostname: "arede.app.br",
      pathname: "/",
    });
    const atrib = capturarAtribuicao();
    expect(atrib.origem).toBe("instagram");
    expect(atrib.utm_medium).toBe("bio");
  });

  it("usa referrer para derivar origem quando não há UTM", () => {
    Object.defineProperty(document, "referrer", {
      value: "https://www.google.com/search?q=eletricista",
      configurable: true,
    });
    const atrib = capturarAtribuicao();
    expect(atrib.origem).toBe("busca");
  });

  it("reutiliza a atribuição já salva no sessionStorage", () => {
    const salvo = { sessao_id: "s-abc", origem: "whatsapp", utm_source: null, utm_medium: null, utm_campaign: null };
    sessionStorage.setItem(CHAVE, JSON.stringify(salvo));
    const atrib = capturarAtribuicao();
    expect(atrib.sessao_id).toBe("s-abc");
    expect(atrib.origem).toBe("whatsapp");
  });

  it("ignora sessionStorage corrompido e gera nova atribuição", () => {
    sessionStorage.setItem(CHAVE, "json-invalido{{{");
    const atrib = capturarAtribuicao();
    expect(atrib).not.toBeNull();
    expect(typeof atrib.sessao_id).toBe("string");
  });

  it("persiste a atribuição no sessionStorage para reutilização", () => {
    capturarAtribuicao();
    const raw = sessionStorage.getItem(CHAVE);
    expect(raw).not.toBeNull();
    const salvo = JSON.parse(raw);
    expect(salvo.sessao_id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// registrarEvento — verifica payload enviado ao Supabase
// ---------------------------------------------------------------------------

describe("registrarEvento", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockFrom.mockClear();
    mockInsert.mockClear();
    vi.stubGlobal("location", {
      search: "?utm_source=whatsapp",
      hostname: "arede.app.br",
      pathname: "/profissional/p1",
    });
    Object.defineProperty(document, "referrer", { value: "", configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("insere o evento correto na tabela 'eventos'", async () => {
    registrarEvento("profile_view", { profissional_id: "p1" });
    // aguarda a Promise interna (best-effort)
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFrom).toHaveBeenCalledWith("eventos");
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.tipo).toBe("profile_view");
    expect(payload.profissional_id).toBe("p1");
    expect(payload.origem).toBe("whatsapp");
    expect(typeof payload.sessao_id).toBe("string");
  });

  it("usa window.location.pathname quando rota não é passada", async () => {
    registrarEvento("page_view", {});
    await new Promise((r) => setTimeout(r, 0));
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.rota).toBe("/profissional/p1");
  });
});
