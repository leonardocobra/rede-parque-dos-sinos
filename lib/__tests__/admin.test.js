import { describe, it, expect } from "vitest";
import {
  parseAdminEmails,
  isAdmin,
  computeVisaoOferta,
  computeAnalyticsEventos,
  computeScoreDistribuicao,
} from "../admin";
import { computaScore } from "../score";

// Helper: profissional mínimo compatível com computaScore
const prof = (overrides = {}) => ({
  id: crypto.randomUUID(),
  foto_url: null,
  descricao: "",
  instagram: "",
  experiencia: "",
  verificado: false,
  tem_google: false,
  tem_fotos_google: false,
  tem_outro_diretorio: false,
  instagram_ativo: false,
  tem_fotos_trabalho: false,
  link_na_bio: false,
  usa_whatsapp_business: false,
  fez_meta_ads: false,
  fez_google_ads: false,
  profissional_servicos: [],
  ...overrides,
});

const cs = computaScore; // injeção nos testes

describe("parseAdminEmails", () => {
  it("normaliza, separa por vírgula e remove vazios", () => {
    expect(parseAdminEmails(" A@X.com , b@x.com ,, ")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("string vazia vira lista vazia", () => {
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("isAdmin", () => {
  const allow = "leo@arede.app.br, admin@x.com";

  it("aceita e-mail na allowlist (case-insensitive)", () => {
    expect(isAdmin("LEO@arede.app.br", allow)).toBe(true);
  });

  it("recusa e-mail fora da allowlist", () => {
    expect(isAdmin("intruso@x.com", allow)).toBe(false);
  });

  it("fail-closed: sem allowlist, ninguém é admin", () => {
    expect(isAdmin("leo@arede.app.br", "")).toBe(false);
  });

  it("recusa e-mail vazio/nulo", () => {
    expect(isAdmin("", allow)).toBe(false);
    expect(isAdmin(undefined, allow)).toBe(false);
  });
});

describe("computeVisaoOferta", () => {
  const agora = new Date("2026-06-18T12:00:00Z");
  const dias = (n) => new Date(agora.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const profs = [
    { id: "1", foto_url: "x.jpg", user_id: "u1", verificado: true, criado_em: dias(5) },
    { id: "2", foto_url: null, user_id: null, verificado: false, criado_em: dias(40) },
    { id: "3", foto_url: "y.jpg", user_id: "u3", verificado: false, criado_em: dias(100) },
    { id: "4", foto_url: null, user_id: null, verificado: false, criado_em: dias(10) },
  ];
  const servs = [
    { profissional_id: "1", categoria: "Limpeza e Cuidados" },
    { profissional_id: "1", categoria: "Limpeza e Cuidados" }, // mesma cat, não duplica
    { profissional_id: "2", categoria: "Limpeza e Cuidados" },
    { profissional_id: "3", categoria: "Construção e Reforma" },
    { profissional_id: "4", categoria: null }, // ignorado
  ];

  it("agrega totais, contas e selos", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.total).toBe(4);
    expect(v.comConta).toBe(2);
    expect(v.anonimos).toBe(2);
    expect(v.comFoto).toBe(2);
    expect(v.pctComFoto).toBe(50);
    expect(v.verificados).toBe(1);
  });

  it("conta novos por janela de tempo", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.novos30).toBe(2); // dias 5 e 10
    expect(v.novos90).toBe(3); // dias 5, 10 e 40
  });

  it("conta profissionais distintos por categoria, ordenado", () => {
    const v = computeVisaoOferta(profs, servs, agora);
    expect(v.porCategoria).toEqual([
      { categoria: "Limpeza e Cuidados", total: 2 },
      { categoria: "Construção e Reforma", total: 1 },
    ]);
  });

  it("lida com listas vazias sem dividir por zero", () => {
    const v = computeVisaoOferta([], []);
    expect(v.total).toBe(0);
    expect(v.pctComFoto).toBe(0);
    expect(v.porCategoria).toEqual([]);
    expect(v.comItem).toBe(0);
    expect(v.pctComItem).toBe(0);
    expect(v.comItemFoto).toBe(0);
  });

  it("conta adoção de itens: profissional distinto, só ativos, com/sem foto", () => {
    const itens = [
      { profissional_id: "1", foto_url: "a.jpg", ativo: true }, // conta + foto
      { profissional_id: "1", foto_url: null, ativo: true }, // mesmo prof, não duplica
      { profissional_id: "2", foto_url: null, ativo: true }, // conta, sem foto
      { profissional_id: "3", foto_url: "c.jpg", ativo: false }, // inativo: ignora
    ];
    const v = computeVisaoOferta(profs, servs, agora, itens);
    expect(v.comItem).toBe(2); // profs 1 e 2
    expect(v.pctComItem).toBe(50); // 2 de 4
    expect(v.comItemFoto).toBe(1); // só o prof 1 tem item ativo com foto
    expect(v.pctComItemFoto).toBe(25); // 1 de 4
  });
});

describe("computeAnalyticsEventos", () => {
  // Duas sessões. s1: instagram → home → catálogo → perfil → contato.
  // s2: busca → home → catálogo (não chega a perfil/contato).
  const eventos = [
    { tipo: "page_view", rota: "/", origem: "instagram", sessao_id: "s1" },
    { tipo: "page_view", rota: "/catalogo", origem: "instagram", sessao_id: "s1" },
    { tipo: "page_view", rota: "/profissional/1", origem: "instagram", sessao_id: "s1" },
    { tipo: "profile_view", rota: "/profissional/1", origem: "instagram", sessao_id: "s1" },
    { tipo: "contact_click", canal: "whatsapp", origem: "instagram", sessao_id: "s1" },
    { tipo: "page_view", rota: "/", origem: "busca", sessao_id: "s2" },
    { tipo: "page_view", rota: "/catalogo", origem: "busca", sessao_id: "s2" },
  ];

  it("conta visitas, visitantes e eventos por tipo", () => {
    const a = computeAnalyticsEventos(eventos);
    expect(a.visitas).toBe(5); // page_views
    expect(a.visitantes).toBe(2); // sessões distintas
    expect(a.perfilViews).toBe(1);
    expect(a.contatos).toBe(1);
    expect(a.taxaContato).toBe(50); // 1 contato / 2 visitantes
  });

  it("quebra por canal de origem ordenado por visitantes", () => {
    const a = computeAnalyticsEventos(eventos);
    const insta = a.porCanal.find((c) => c.origem === "instagram");
    expect(insta).toMatchObject({ visitantes: 1, visitas: 3, contatos: 1, pctContato: 100 });
    expect(a.porCanal.map((c) => c.origem)).toContain("busca");
  });

  it("monta o funil com sessões distintas por etapa", () => {
    const a = computeAnalyticsEventos(eventos);
    expect(a.funil).toEqual([
      { etapa: "Visitantes", sessoes: 2, pct: 100 },
      { etapa: "Catálogo", sessoes: 2, pct: 100 },
      { etapa: "Perfil", sessoes: 1, pct: 50 },
      { etapa: "Contato", sessoes: 1, pct: 50 },
    ]);
  });

  it("agrupa origem ausente como (desconhecido)", () => {
    const a = computeAnalyticsEventos([
      { tipo: "page_view", rota: "/", sessao_id: "x" },
    ]);
    expect(a.porCanal[0].origem).toBe("(desconhecido)");
  });

  it("lista vazia não quebra", () => {
    const a = computeAnalyticsEventos([]);
    expect(a.visitas).toBe(0);
    expect(a.visitantes).toBe(0);
    expect(a.taxaContato).toBe(0);
    expect(a.porCanal).toEqual([]);
    expect(a.funil[0]).toEqual({ etapa: "Visitantes", sessoes: 0, pct: 100 });
  });

  describe("série diária", () => {
    const agora = new Date("2026-06-19T12:00:00Z");

    it("gera janela contínua de N dias, do mais antigo ao mais recente", () => {
      const a = computeAnalyticsEventos([], { dias: 3, agora });
      expect(a.serie.map((p) => p.dia)).toEqual(["2026-06-17", "2026-06-18", "2026-06-19"]);
      expect(a.serie.every((p) => p.visitas === 0 && p.perfilViews === 0 && p.contatos === 0)).toBe(
        true
      );
    });

    it("bucketiza eventos por dia e por tipo", () => {
      const eventos = [
        { tipo: "page_view", criado_em: "2026-06-18T08:00:00Z", sessao_id: "s1" },
        { tipo: "page_view", criado_em: "2026-06-18T20:00:00Z", sessao_id: "s2" },
        { tipo: "profile_view", criado_em: "2026-06-18T21:00:00Z", sessao_id: "s2" },
        { tipo: "contact_click", criado_em: "2026-06-19T09:00:00Z", sessao_id: "s2" },
      ];
      const a = computeAnalyticsEventos(eventos, { dias: 3, agora });
      const d18 = a.serie.find((p) => p.dia === "2026-06-18");
      const d19 = a.serie.find((p) => p.dia === "2026-06-19");
      expect(d18).toMatchObject({ visitas: 2, perfilViews: 1, contatos: 0 });
      expect(d19).toMatchObject({ visitas: 0, perfilViews: 0, contatos: 1 });
    });

    it("ignora eventos fora da janela ou sem data", () => {
      const eventos = [
        { tipo: "page_view", criado_em: "2026-06-01T08:00:00Z", sessao_id: "s1" }, // fora
        { tipo: "page_view", criado_em: null, sessao_id: "s2" }, // sem data
      ];
      const a = computeAnalyticsEventos(eventos, { dias: 3, agora });
      expect(a.serie.reduce((t, p) => t + p.visitas, 0)).toBe(0);
    });
  });
});

describe("computeScoreDistribuicao", () => {
  it("lista vazia retorna zeros e média 0", () => {
    const r = computeScoreDistribuicao([], { computaScore: cs });
    expect(r.niveis).toEqual({ Bronze: 0, Prata: 0, Ouro: 0 });
    expect(r.media).toBe(0);
    expect(r.distribuicao).toHaveLength(3);
    expect(r.distribuicao.every((d) => d.total === 0 && d.pct === 0)).toBe(true);
  });

  it("lança erro se computaScore não for injetado", () => {
    expect(() => computeScoreDistribuicao([])).toThrow();
  });

  it("classifica profissional vazio como Bronze", () => {
    const r = computeScoreDistribuicao([prof()], { computaScore: cs });
    expect(r.niveis.Bronze).toBe(1);
    expect(r.niveis.Prata).toBe(0);
    expect(r.niveis.Ouro).toBe(0);
    expect(r.media).toBe(0);
  });

  it("classifica profissional com 40+ pts como Prata", () => {
    // foto(15)+descricao(10)+instagram(10)+experiencia(5) = 40 → Prata
    const p = prof({ foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5a" });
    const r = computeScoreDistribuicao([p], { computaScore: cs });
    expect(r.niveis.Prata).toBe(1);
    expect(r.media).toBe(40);
  });

  it("classifica profissional com 70+ pts como Ouro", () => {
    // foto(15)+descricao(10)+instagram(10)+itens(10)+experiencia(5)+verificado(10)+temGoogle(8)+fezMetaAds(7) = 75
    const p = prof({
      foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5a", verificado: true,
      tem_google: true, fez_meta_ads: true,
      profissional_servicos: [{ profissional_itens: [{ id: "i1" }] }],
    });
    const r = computeScoreDistribuicao([p], { computaScore: cs });
    expect(r.niveis.Ouro).toBe(1);
    expect(r.media).toBe(75);
  });

  it("distribui corretamente múltiplos profissionais", () => {
    const bronze = prof();
    const prata = prof({ foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5a" });
    const ouro = prof({
      foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5a", verificado: true,
      tem_google: true, fez_meta_ads: true,
      profissional_servicos: [{ profissional_itens: [{ id: "i1" }] }],
    });
    const r = computeScoreDistribuicao([bronze, prata, ouro], { computaScore: cs });
    expect(r.niveis).toEqual({ Bronze: 1, Prata: 1, Ouro: 1 });
    expect(r.media).toBe(Math.round((0 + 40 + 75) / 3));
  });

  it("percentuais somam 100% quando total > 0", () => {
    const profs = [prof(), prof(), prof({ foto_url: "x" })];
    const r = computeScoreDistribuicao(profs, { computaScore: cs });
    const soma = r.distribuicao.reduce((s, d) => s + d.pct, 0);
    expect(soma).toBeLessThanOrEqual(100); // pode ser 99 por arredondamento
    expect(soma).toBeGreaterThanOrEqual(98);
  });

  it("distribuicao tem nome, total, pct e corBadge", () => {
    const r = computeScoreDistribuicao([prof()], { computaScore: cs });
    for (const d of r.distribuicao) {
      expect(d.nome).toBeTruthy();
      expect(typeof d.total).toBe("number");
      expect(typeof d.pct).toBe("number");
      expect(d.corBadge).toBeTruthy();
    }
  });

  it("lê campos auto-declarados do profissional corretamente", () => {
    const p = prof({ tem_google: true, fez_meta_ads: true, fez_google_ads: true });
    // 8 + 7 + 7 = 22 pts
    const r = computeScoreDistribuicao([p], { computaScore: cs });
    expect(r.media).toBe(22);
  });
});
