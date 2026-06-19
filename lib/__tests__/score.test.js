import { describe, it, expect } from "vitest";
import { computaScore, CRITERIOS, NIVEIS } from "../score";

const perfilVazio = { profissional_servicos: [] };

const perfilCompleto = {
  foto_url: "https://example.com/foto.jpg",
  descricao: "Eletricista com 10 anos de experiência",
  experiencia: "10 anos",
  instagram: "joao.eletricista",
  verificado: true,
  profissional_servicos: [
    { id: "s1", profissional_itens: [{ id: "i1", nome: "Instalação de tomada", preco: 80 }] },
  ],
};

const autoCompleto = {
  temGoogle: true,
  temFotosGoogle: true,
  temOutroDiretorio: true,
  instagramAtivo: true,
  temFotosTrabalho: true,
  linkNaBio: true,
  usaWhatsappBusiness: true,
  fezMetaAds: true,
  fezGoogleAds: true,
};

// — Estrutura dos critérios —

describe("CRITERIOS — estrutura", () => {
  it("soma total é 100 pts", () => {
    const total = CRITERIOS.reduce((s, c) => s + c.pts, 0);
    expect(total).toBe(100);
  });

  it("verificados somam 60 pts", () => {
    const total = CRITERIOS.filter((c) => !c.auto).reduce((s, c) => s + c.pts, 0);
    expect(total).toBe(60);
  });

  it("auto-declarados somam 40 pts", () => {
    const total = CRITERIOS.filter((c) => c.auto).reduce((s, c) => s + c.pts, 0);
    expect(total).toBe(40);
  });

  it("todos os critérios têm id, label, dica e pts", () => {
    for (const c of CRITERIOS) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.dica).toBeTruthy();
      expect(c.pts).toBeGreaterThan(0);
    }
  });

  it("critérios auto-declarados têm autoKey", () => {
    for (const c of CRITERIOS.filter((c) => c.auto)) {
      expect(c.autoKey).toBeTruthy();
    }
  });
});

// — Perfil vazio —

describe("computaScore — perfil vazio", () => {
  it("retorna 0 pontos e nível Bronze", () => {
    const r = computaScore(perfilVazio);
    expect(r.pontos).toBe(0);
    expect(r.nivel).toBe("Bronze");
  });

  it("lista todos os critérios como próximos passos", () => {
    const r = computaScore(perfilVazio);
    expect(r.proximosPassos).toHaveLength(CRITERIOS.length);
  });

  it("próximos passos ordenados por maior impacto (pts desc)", () => {
    const r = computaScore(perfilVazio);
    for (let i = 0; i < r.proximosPassos.length - 1; i++) {
      expect(r.proximosPassos[i].pts).toBeGreaterThanOrEqual(r.proximosPassos[i + 1].pts);
    }
  });

  it("cada próximo passo tem id, label, dica e pts", () => {
    const r = computaScore(perfilVazio);
    for (const p of r.proximosPassos) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.dica).toBeTruthy();
      expect(p.pts).toBeGreaterThan(0);
    }
  });
});

// — Critérios verificados —

describe("computaScore — critérios verificados", () => {
  it("foto_url soma 15 pts", () => {
    expect(computaScore({ ...perfilVazio, foto_url: "x" }).pontos).toBe(15);
  });

  it("descricao vazia não conta", () => {
    expect(computaScore({ ...perfilVazio, descricao: "   " }).pontos).toBe(0);
  });

  it("descricao preenchida soma 10 pts", () => {
    expect(computaScore({ ...perfilVazio, descricao: "Bio" }).pontos).toBe(10);
  });

  it("instagram preenchido soma 10 pts", () => {
    expect(computaScore({ ...perfilVazio, instagram: "joao" }).pontos).toBe(10);
  });

  it("experiencia preenchida soma 5 pts", () => {
    expect(computaScore({ ...perfilVazio, experiencia: "5 anos" }).pontos).toBe(5);
  });

  it("verificado soma 10 pts", () => {
    expect(computaScore({ ...perfilVazio, verificado: true }).pontos).toBe(10);
  });

  it("serviço sem itens não conta", () => {
    const p = { profissional_servicos: [{ id: "s1", profissional_itens: [] }] };
    expect(computaScore(p).pontos).toBe(0);
  });

  it("≥1 item em qualquer serviço soma 10 pts", () => {
    const p = { profissional_servicos: [{ id: "s1", profissional_itens: [{ id: "i1" }] }] };
    expect(computaScore(p).pontos).toBe(10);
  });
});

// — Critérios auto-declarados —

describe("computaScore — auto-declarados", () => {
  it("temGoogle soma 8 pts", () => {
    expect(computaScore(perfilVazio, { temGoogle: true }).pontos).toBe(8);
  });

  it("temFotosGoogle soma 3 pts", () => {
    expect(computaScore(perfilVazio, { temFotosGoogle: true }).pontos).toBe(3);
  });

  it("temOutroDiretorio soma 2 pts", () => {
    expect(computaScore(perfilVazio, { temOutroDiretorio: true }).pontos).toBe(2);
  });

  it("instagramAtivo soma 4 pts", () => {
    expect(computaScore(perfilVazio, { instagramAtivo: true }).pontos).toBe(4);
  });

  it("temFotosTrabalho soma 3 pts", () => {
    expect(computaScore(perfilVazio, { temFotosTrabalho: true }).pontos).toBe(3);
  });

  it("linkNaBio soma 2 pts", () => {
    expect(computaScore(perfilVazio, { linkNaBio: true }).pontos).toBe(2);
  });

  it("usaWhatsappBusiness soma 4 pts", () => {
    expect(computaScore(perfilVazio, { usaWhatsappBusiness: true }).pontos).toBe(4);
  });

  it("fezMetaAds soma 7 pts", () => {
    expect(computaScore(perfilVazio, { fezMetaAds: true }).pontos).toBe(7);
  });

  it("fezGoogleAds soma 7 pts", () => {
    expect(computaScore(perfilVazio, { fezGoogleAds: true }).pontos).toBe(7);
  });

  it("todos auto-declarados ativos somam 40 pts", () => {
    expect(computaScore(perfilVazio, autoCompleto).pontos).toBe(40);
  });
});

// — Níveis —

describe("computaScore — níveis", () => {
  it("0 pts → Bronze", () => {
    expect(computaScore(perfilVazio).nivel).toBe("Bronze");
  });

  it("39 pts → Bronze", () => {
    // foto(15) + descricao(10) + instagram(10) + instagramAtivo(4) = 39
    const r = computaScore(
      { ...perfilVazio, foto_url: "x", descricao: "bio", instagram: "x" },
      { instagramAtivo: true }
    );
    expect(r.pontos).toBe(39);
    expect(r.nivel).toBe("Bronze");
  });

  it("40 pts → Prata", () => {
    // foto(15) + descricao(10) + instagram(10) + experiencia(5) = 40
    const r = computaScore({
      ...perfilVazio, foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5 anos",
    });
    expect(r.pontos).toBe(40);
    expect(r.nivel).toBe("Prata");
  });

  it("55 pts → Prata", () => {
    // foto(15)+descricao(10)+instagram(10)+itens(10)+experiencia(5)+verificado(5)...
    // foto(15)+descricao(10)+instagram(10)+verificado(10)+instagramAtivo(4)+temFotosGoogle(3)+temOutroDiretorio(2)+temFotosTrabalho(3) = 57
    // foto(15)+descricao(10)+instagram(10)+verificado(10)+temGoogle(8) = 53 → Prata
    const r = computaScore(
      { ...perfilVazio, foto_url: "x", descricao: "bio", instagram: "x", verificado: true },
      { temGoogle: true }
    );
    expect(r.pontos).toBe(53);
    expect(r.nivel).toBe("Prata");
  });

  it("70 pts → Ouro", () => {
    // foto(15)+descricao(10)+instagram(10)+itens(10)+experiencia(5)+verificado(10)+temGoogle(8)+fezMetaAds(7) = 75
    const r = computaScore(
      {
        foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5a", verificado: true,
        profissional_servicos: [{ profissional_itens: [{ id: "i1" }] }],
      },
      { temGoogle: true, fezMetaAds: true }
    );
    expect(r.pontos).toBe(75);
    expect(r.nivel).toBe("Ouro");
  });

  it("perfil completo = 100 pts e Ouro", () => {
    const r = computaScore(perfilCompleto, autoCompleto);
    expect(r.pontos).toBe(100);
    expect(r.nivel).toBe("Ouro");
    expect(r.proximosPassos).toHaveLength(0);
  });
});

// — Barra de progresso —

describe("computaScore — barra", () => {
  it("Bronze: barra { min: 0, max: 39 }", () => {
    expect(computaScore(perfilVazio).barra).toEqual({ min: 0, max: 39 });
  });

  it("Prata: barra { min: 40, max: 69 }", () => {
    const r = computaScore({
      ...perfilVazio, foto_url: "x", descricao: "bio", instagram: "x", experiencia: "5 anos",
    });
    expect(r.barra).toEqual({ min: 40, max: 69 });
  });

  it("Ouro: barra { min: 70, max: 100 }", () => {
    expect(computaScore(perfilCompleto, autoCompleto).barra).toEqual({ min: 70, max: 100 });
  });
});

// — NIVEIS —

describe("NIVEIS — estrutura", () => {
  it("tem Bronze, Prata e Ouro em ordem", () => {
    expect(NIVEIS.map((n) => n.nome)).toEqual(["Bronze", "Prata", "Ouro"]);
  });

  it("thresholds são 0/40/70", () => {
    expect(NIVEIS.map((n) => n.min)).toEqual([0, 40, 70]);
  });
});
