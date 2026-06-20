import { describe, it, expect } from "vitest";
import {
  tituloPerfil,
  descricaoPerfil,
  whatsappLink,
  filtrarOutros,
  perfilJsonLd,
  servicoPrimario,
  categoriaPrimaria,
  nomeComServico,
  CIDADE,
} from "../perfil";

const prof = {
  id: "p1",
  nome: "João Silva",
  profissional_servicos: [
    { id: "s1", servico: "Eletricista", categoria: "Construção e Reforma", ordem: 0 },
  ],
  bairro: "Parque dos Sinos",
  descricao: "Atendo emergências.",
  telefone: "(12) 99999-8888",
};

describe("servicoPrimario / categoriaPrimaria", () => {
  it("retorna o primeiro serviço/categoria", () => {
    expect(servicoPrimario(prof)).toBe("Eletricista");
    expect(categoriaPrimaria(prof)).toBe("Construção e Reforma");
  });

  it("retorna string vazia quando não há serviços", () => {
    expect(servicoPrimario({ ...prof, profissional_servicos: [] })).toBe("");
    expect(servicoPrimario(null)).toBe("");
  });
});

describe("nomeComServico", () => {
  it("junta nome e serviço quando o nome não o contém", () => {
    expect(nomeComServico("João Silva", "Eletricista")).toBe("João Silva — Eletricista");
  });

  it("não repete o serviço quando o nome já o contém (case-insensitive)", () => {
    expect(nomeComServico("Doce Sabão Lavanderia", "Lavanderia")).toBe("Doce Sabão Lavanderia");
    expect(nomeComServico("LAVANDERIA do Zé", "lavanderia")).toBe("LAVANDERIA do Zé");
  });

  it("retorna só o nome quando não há serviço", () => {
    expect(nomeComServico("João Silva", "")).toBe("João Silva");
    expect(nomeComServico("João Silva", null)).toBe("João Silva");
  });
});

describe("tituloPerfil", () => {
  it("monta nome + serviço + cidade + marca", () => {
    expect(tituloPerfil(prof)).toBe("João Silva — Eletricista em Jacareí · A Rede");
  });

  it("não repete o serviço quando o nome já o contém", () => {
    const profRedundante = {
      ...prof,
      nome: "Doce Sabão Lavanderia",
      profissional_servicos: [{ id: "s1", servico: "Lavanderia", categoria: "Limpeza", ordem: 0 }],
    };
    expect(tituloPerfil(profRedundante)).toBe("Doce Sabão Lavanderia em Jacareí · A Rede");
  });

  it("usa fallback quando não há profissional", () => {
    expect(tituloPerfil(null)).toBe("Profissional · A Rede");
    expect(tituloPerfil({})).toBe("Profissional · A Rede");
  });
});

describe("descricaoPerfil", () => {
  it("lidera pela bio, sem repetir nome/serviço (que já estão na imagem e no título)", () => {
    const d = descricaoPerfil(prof);
    expect(d).toContain("Atendo emergências.");
    expect(d).not.toContain("João Silva");
    expect(d).not.toContain("Eletricista");
  });

  it("cai no base (nome + serviço + local + frase padrão) sem descrição", () => {
    const d = descricaoPerfil({ ...prof, descricao: "" });
    expect(d).toContain("João Silva");
    expect(d).toContain("Eletricista");
    expect(d).toContain("Parque dos Sinos");
    expect(d).toContain("indicado por vizinhos");
  });

  it("usa a descrição do serviço principal quando não há bio", () => {
    const d = descricaoPerfil({
      ...prof,
      descricao: "",
      profissional_servicos: [
        {
          id: "s1",
          servico: "Eletricista",
          categoria: "C",
          ordem: 0,
          descricao: "Instalações e reparos.",
        },
      ],
    });
    expect(d).toContain("Instalações e reparos.");
  });

  it("usa só a cidade quando não há bairro (no fallback base, sem bio)", () => {
    const d = descricaoPerfil({ ...prof, bairro: "", descricao: "" });
    expect(d).toContain("em Jacareí.");
    expect(d).not.toContain(", Jacareí");
  });

  it("trunca em até 160 caracteres com reticências", () => {
    const d = descricaoPerfil({ ...prof, descricao: "x".repeat(300) });
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
  });
});

describe("whatsappLink", () => {
  it("normaliza o telefone e prefixa o código do país", () => {
    expect(whatsappLink("(12) 99999-8888")).toBe("https://wa.me/5512999998888");
  });

  it("retorna null sem dígitos", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("sem numero")).toBeNull();
  });
});

describe("perfilJsonLd", () => {
  const url = "https://arede.com.br/profissional/p1";

  it("monta LocalBusiness com nome, endereço e URL", () => {
    const ld = perfilJsonLd(prof, null, url);
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.name).toBe("João Silva");
    expect(ld.url).toBe(url);
    expect(ld.address.addressLocality).toBe(CIDADE);
    expect(ld.address.addressCountry).toBe("BR");
  });

  it("lista todos os serviços em knowsAbout", () => {
    const profMulti = {
      ...prof,
      profissional_servicos: [
        { id: "s1", servico: "Eletricista", categoria: "Construção e Reforma", ordem: 0 },
        { id: "s2", servico: "Pintor", categoria: "Construção e Reforma", ordem: 1 },
      ],
    };
    const ld = perfilJsonLd(profMulti, null, url);
    expect(ld.knowsAbout).toBe("Eletricista, Pintor");
  });

  it("inclui aggregateRating quando há avaliações", () => {
    const ld = perfilJsonLd(prof, { avg: 4.8, count: 5 }, url);
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 5,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("omite aggregateRating sem avaliações", () => {
    expect(perfilJsonLd(prof, null, url).aggregateRating).toBeUndefined();
    expect(perfilJsonLd(prof, { avg: 0, count: 0 }, url).aggregateRating).toBeUndefined();
  });

  it("usa a foto como image quando existe", () => {
    const ld = perfilJsonLd({ ...prof, foto_url: "https://x/f.jpg" }, null, url);
    expect(ld.image).toBe("https://x/f.jpg");
  });

  it("retorna null sem profissional válido", () => {
    expect(perfilJsonLd(null, null, url)).toBeNull();
    expect(perfilJsonLd({}, null, url)).toBeNull();
  });
});

describe("filtrarOutros", () => {
  const lista = [
    { id: "p1", profissional_servicos: [{ categoria: "A" }] },
    { id: "p2", profissional_servicos: [{ categoria: "A" }] },
    { id: "p3", profissional_servicos: [{ categoria: "B" }] },
    { id: "p4", profissional_servicos: [{ categoria: "A" }, { categoria: "B" }] },
  ];

  it("retorna outros da mesma categoria, excluindo o próprio id", () => {
    const r = filtrarOutros(lista, "A", "p1");
    expect(r.map((p) => p.id)).toEqual(["p2", "p4"]);
  });

  it("respeita o limite", () => {
    const r = filtrarOutros(lista, "A", "p9", 1);
    expect(r.map((p) => p.id)).toEqual(["p1"]);
  });

  it("retorna vazio sem categoria ou lista", () => {
    expect(filtrarOutros(lista, null, "p1")).toEqual([]);
    expect(filtrarOutros(null, "A", "p1")).toEqual([]);
  });

  it("inclui profissional com múltiplas categorias que corresponda", () => {
    const r = filtrarOutros(lista, "B", "p3");
    expect(r.map((p) => p.id)).toContain("p4");
  });
});
