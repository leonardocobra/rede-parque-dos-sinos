import { describe, it, expect } from "vitest";
import { dadosGoogleNegocio, categoriaGoogleSugerida, CHECKLIST_GBP } from "../gbp";

const profCompleto = {
  nome: "Ana Diarista",
  telefone: "12999990000",
  bairro: "Parque dos Sinos",
  regioes: "Parque dos Sinos e Jardim California",
  descricao: "Faço limpeza residencial com capricho há 8 anos.",
  profissional_servicos: [{ servico: "Diarista", categoria: "Limpeza e Cuidados" }],
};

describe("categoriaGoogleSugerida", () => {
  it("prefere o serviço principal (mais específico)", () => {
    expect(categoriaGoogleSugerida(profCompleto)).toBe("Diarista");
  });

  it("cai para o rótulo por categoria quando não há serviço", () => {
    const prof = { profissional_servicos: [{ categoria: "Beleza e Moda" }] };
    expect(categoriaGoogleSugerida(prof)).toBe("Salão de beleza");
  });

  it("retorna vazio sem serviço nem categoria", () => {
    expect(categoriaGoogleSugerida({})).toBe("");
  });
});

describe("dadosGoogleNegocio", () => {
  it("monta os campos a partir do cadastro", () => {
    const d = dadosGoogleNegocio(profCompleto, "https://arede.app.br/profissional/1?utm_source=google-business");
    expect(d.nome).toBe("Ana Diarista");
    expect(d.categoria).toBe("Diarista");
    expect(d.areaAtendida).toBe("Parque dos Sinos e Jardim California");
    expect(d.telefone).toBe("12999990000");
    expect(d.descricao).toBe("Faço limpeza residencial com capricho há 8 anos.");
    expect(d.site).toBe("https://arede.app.br/profissional/1?utm_source=google-business");
  });

  it("usa bairro + cidade quando não há regioes", () => {
    const { areaAtendida } = dadosGoogleNegocio({ bairro: "Centro" });
    expect(areaAtendida).toBe("Centro, Jacareí");
  });

  it("cai para a cidade quando não há regioes nem bairro", () => {
    const { areaAtendida } = dadosGoogleNegocio({});
    expect(areaAtendida).toBe("Jacareí");
  });

  it("não quebra com profissional vazio", () => {
    const d = dadosGoogleNegocio({}, "");
    expect(d.nome).toBe("");
    expect(d.categoria).toBe("");
    expect(d.site).toBe("");
  });
});

describe("CHECKLIST_GBP", () => {
  it("cobre categoria, fotos, horário e link de volta para a Rede", () => {
    const ids = CHECKLIST_GBP.map((c) => c.id);
    expect(ids).toEqual(["categoria", "fotos", "horario", "link"]);
  });
});
