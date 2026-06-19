import { describe, it, expect } from "vitest";
import { computaScore } from "../score";

const perfilVazio = { profissional_servicos: [] };

const perfilCompleto = {
  foto_url: "https://example.com/foto.jpg",
  descricao: "Eletricista com 10 anos de experiência",
  experiencia: "10 anos",
  instagram: "joao.eletricista",
  verificado: true,
  profissional_servicos: [
    {
      id: "s1",
      profissional_itens: [{ id: "i1", nome: "Instalação de tomada", preco: 80 }],
    },
  ],
};

const statsCompletas = { count: 6, avg: 4.8, recomendado: true };
const autoCompleto = { temGoogle: true, instagramAtivo: true };

describe("computaScore — perfil vazio", () => {
  it("retorna 0 pontos e nível Bronze", () => {
    const r = computaScore(perfilVazio);
    expect(r.pontos).toBe(0);
    expect(r.nivel).toBe("Bronze");
  });

  it("lista todos os 13 critérios como próximos passos", () => {
    const r = computaScore(perfilVazio);
    expect(r.proximosPassos).toHaveLength(13);
  });

  it("próximos passos ordenados por maior impacto (pts desc)", () => {
    const r = computaScore(perfilVazio);
    for (let i = 0; i < r.proximosPassos.length - 1; i++) {
      expect(r.proximosPassos[i].pts).toBeGreaterThanOrEqual(
        r.proximosPassos[i + 1].pts
      );
    }
  });
});

describe("computaScore — foto e bio", () => {
  it("foto_url somam 15 pts", () => {
    const r = computaScore({ ...perfilVazio, foto_url: "x" });
    expect(r.pontos).toBe(15);
  });

  it("descricao vazia não conta", () => {
    const r = computaScore({ ...perfilVazio, descricao: "   " });
    expect(r.pontos).toBe(0);
  });

  it("descricao preenchida soma 10 pts", () => {
    const r = computaScore({ ...perfilVazio, descricao: "Sou eletricista" });
    expect(r.pontos).toBe(10);
  });

  it("experiencia preenchida soma 5 pts", () => {
    const r = computaScore({ ...perfilVazio, experiencia: "5 anos" });
    expect(r.pontos).toBe(5);
  });

  it("instagram preenchido soma 10 pts", () => {
    const r = computaScore({ ...perfilVazio, instagram: "joao" });
    expect(r.pontos).toBe(10);
  });
});

describe("computaScore — itens", () => {
  it("serviço sem itens não conta", () => {
    const p = { profissional_servicos: [{ id: "s1", profissional_itens: [] }] };
    expect(computaScore(p).pontos).toBe(0);
  });

  it("≥1 item em qualquer serviço soma 10 pts", () => {
    const p = {
      profissional_servicos: [
        { id: "s1", profissional_itens: [{ id: "i1" }] },
      ],
    };
    expect(computaScore(p).pontos).toBe(10);
  });
});

describe("computaScore — avaliações e selos", () => {
  it("1 avaliação soma 5 pts", () => {
    const r = computaScore(perfilVazio, { count: 1, avg: 4.0, recomendado: false });
    expect(r.pontos).toBe(5);
  });

  it("3 avaliações somam 10 pts (aval1 + aval3)", () => {
    const r = computaScore(perfilVazio, { count: 3, avg: 3.0, recomendado: false });
    expect(r.pontos).toBe(10);
  });

  it("5 avaliações somam 15 pts (aval1 + aval3 + aval5)", () => {
    const r = computaScore(perfilVazio, { count: 5, avg: 3.0, recomendado: false });
    expect(r.pontos).toBe(15);
  });

  it("nota ≥ 4.5 soma 5 pts adicionais", () => {
    const r = computaScore(perfilVazio, { count: 5, avg: 4.5, recomendado: false });
    expect(r.pontos).toBe(20);
  });

  it("recomendado soma 10 pts adicionais", () => {
    const r = computaScore(perfilVazio, { count: 5, avg: 4.5, recomendado: true });
    expect(r.pontos).toBe(30);
  });

  it("verificado soma 10 pts", () => {
    const r = computaScore({ ...perfilVazio, verificado: true });
    expect(r.pontos).toBe(10);
  });
});

describe("computaScore — sinais auto-declarados", () => {
  it("temGoogle soma 5 pts", () => {
    const r = computaScore(perfilVazio, null, { temGoogle: true });
    expect(r.pontos).toBe(5);
  });

  it("instagramAtivo soma 5 pts", () => {
    const r = computaScore(perfilVazio, null, { instagramAtivo: true });
    expect(r.pontos).toBe(5);
  });

  it("ambos somam 10 pts", () => {
    const r = computaScore(perfilVazio, null, { temGoogle: true, instagramAtivo: true });
    expect(r.pontos).toBe(10);
  });
});

describe("computaScore — níveis", () => {
  it("0–39 pts → Bronze", () => {
    expect(computaScore(perfilVazio).nivel).toBe("Bronze");
    expect(computaScore({ ...perfilVazio, foto_url: "x" }).nivel).toBe("Bronze"); // 15pts
  });

  it("40–69 pts → Prata", () => {
    // foto(15) + descricao(10) + instagram(10) + itens(10) + verificado(10) = 55
    const p = {
      foto_url: "x",
      descricao: "bio",
      instagram: "joao",
      verificado: true,
      profissional_servicos: [{ profissional_itens: [{ id: "i1" }] }],
    };
    const r = computaScore(p);
    expect(r.pontos).toBe(55);
    expect(r.nivel).toBe("Prata");
  });

  it("70–100 pts → Ouro", () => {
    const r = computaScore(perfilCompleto, statsCompletas, autoCompleto);
    expect(r.pontos).toBe(100);
    expect(r.nivel).toBe("Ouro");
  });

  it("perfil completo tem 0 próximos passos", () => {
    const r = computaScore(perfilCompleto, statsCompletas, autoCompleto);
    expect(r.proximosPassos).toHaveLength(0);
  });
});

describe("computaScore — barra de progresso", () => {
  it("Bronze: barra.min=0, barra.max=39", () => {
    const r = computaScore(perfilVazio);
    expect(r.barra).toEqual({ min: 0, max: 39 });
  });

  it("Prata: barra.min=40, barra.max=69", () => {
    const p = { foto_url: "x", descricao: "bio", instagram: "x", verificado: true,
      profissional_servicos: [{ profissional_itens: [{ id: "i1" }] }] };
    const r = computaScore(p); // 55pts → Prata
    expect(r.barra).toEqual({ min: 40, max: 69 });
  });

  it("Ouro: barra.min=70, barra.max=100", () => {
    const r = computaScore(perfilCompleto, statsCompletas, autoCompleto);
    expect(r.barra).toEqual({ min: 70, max: 100 });
  });
});
