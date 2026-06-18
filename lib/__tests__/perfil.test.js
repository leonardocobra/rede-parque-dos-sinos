import { describe, it, expect } from "vitest";
import {
  tituloPerfil,
  descricaoPerfil,
  whatsappLink,
  filtrarOutros,
  perfilJsonLd,
  CIDADE,
} from "../perfil";

const prof = {
  id: "p1",
  nome: "João Silva",
  servico: "Eletricista",
  categoria: "Construção e Reforma",
  bairro: "Parque dos Sinos",
  descricao: "Atendo emergências.",
  telefone: "(12) 99999-8888",
};

describe("tituloPerfil", () => {
  it("monta nome + serviço + cidade + marca", () => {
    expect(tituloPerfil(prof)).toBe("João Silva — Eletricista em Jacareí · A Rede");
  });

  it("usa fallback quando não há profissional", () => {
    expect(tituloPerfil(null)).toBe("Profissional · A Rede");
    expect(tituloPerfil({})).toBe("Profissional · A Rede");
  });
});

describe("descricaoPerfil", () => {
  it("inclui serviço, bairro, cidade e a descrição própria", () => {
    const d = descricaoPerfil(prof);
    expect(d).toContain("Eletricista");
    expect(d).toContain("Parque dos Sinos");
    expect(d).toContain(CIDADE);
    expect(d).toContain("Atendo emergências.");
  });

  it("cai numa frase padrão sem descrição", () => {
    const d = descricaoPerfil({ ...prof, descricao: "" });
    expect(d).toContain("indicado por vizinhos");
  });

  it("usa só a cidade quando não há bairro", () => {
    const d = descricaoPerfil({ ...prof, bairro: "" });
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
    { id: "p1", categoria: "A" },
    { id: "p2", categoria: "A" },
    { id: "p3", categoria: "B" },
    { id: "p4", categoria: "A" },
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
});
