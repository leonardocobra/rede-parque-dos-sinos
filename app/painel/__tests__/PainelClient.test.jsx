import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PainelClient from "../PainelClient";

// Supabase encadeável o suficiente para a navegação não quebrar (o teste não
// dispara saves/deletes reais — foca na experiência de navegação e edição).
const chain = {
  select: () => chain,
  insert: () => chain,
  update: () => chain,
  delete: () => chain,
  eq: () => chain,
  single: () => Promise.resolve({ data: { id: "novo" }, error: null }),
};
vi.mock("../../../lib/supabase/client", () => ({
  getBrowserSupabase: () => ({ from: () => chain, storage: { from: () => ({}) } }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));

// Módulos que tocam rede/canvas e não interessam a estes testes.
vi.mock("../../components/DivulgarPorCanal", () => ({ default: () => null }));
vi.mock("../../components/CropFotoModal", () => ({ default: () => null }));

const cadastro = {
  id: "p1",
  nome: "Eliverson Silva",
  telefone: "99999-0000",
  verificado: false,
  visualizacoes: 42,
  profissional_servicos: [
    {
      id: "s1",
      servico: "Azulejista e Pintor",
      categoria: "Construção e Reforma",
      ordem: 0,
      descricao: "",
      instagram: null,
      profissional_itens: [
        {
          id: "i1",
          titulo: "Assentamento de porcelanato",
          preco: 45,
          preco_tipo: "a_partir",
          disponibilidade: "agenda aberta",
          foto_url: null,
          ordem: 0,
        },
      ],
    },
  ],
};

const stats = { p1: { count: 0, avg: 0, recomendado: false } };

function renderPainel() {
  render(<PainelClient cadastros={[cadastro]} stats={stats} />);
}

describe("PainelClient — navegação por módulos", () => {
  it("abre na Visão geral mostrando as métricas", () => {
    renderPainel();
    expect(screen.getByText("Visualizações")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    // Serviços não aparecem até trocar de seção.
    expect(screen.queryByText("Azulejista e Pintor")).not.toBeInTheDocument();
  });

  it("troca para Serviços e itens e some as métricas", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    expect(screen.getByText("Azulejista e Pintor")).toBeInTheDocument();
    expect(screen.queryByText("Visualizações")).not.toBeInTheDocument();
  });

  it("mostra a aba Perfil com os campos do cadastro", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Perfil" }));
    expect(screen.getByText("Editar cadastro")).toBeInTheDocument();
  });
});

describe("PainelClient — itens dentro do serviço", () => {
  it("expande o serviço e lista o item com seu resumo de preço", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    // Contador no toggle reflete 1 item.
    fireEvent.click(screen.getByRole("button", { name: /Itens \(1\)/ }));
    expect(screen.getByText("Assentamento de porcelanato")).toBeInTheDocument();
    expect(screen.getByText("a partir de R$ 45,00 · agenda aberta")).toBeInTheDocument();
  });

  it("abre a tela dedicada de novo item ao clicar em Adicionar", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    fireEvent.click(screen.getByRole("button", { name: /Itens \(1\)/ }));
    fireEvent.click(screen.getByRole("button", { name: /Adicionar item/ }));
    expect(screen.getByText("Novo item")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Título do item/)).toBeInTheDocument();
    // A lista deu lugar ao editor.
    expect(screen.queryByText("Assentamento de porcelanato")).not.toBeInTheDocument();
  });

  it("abre o editor de edição do serviço ao clicar em Editar antes de expandir itens", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    // Itens ainda colapsados — único "Editar" visível é o do serviço
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    // Campo de serviço pré-populado
    expect(screen.getByDisplayValue("Azulejista e Pintor")).toBeInTheDocument();
  });

  it("abre o editor de edição do item ao clicar em Editar no item", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    fireEvent.click(screen.getByRole("button", { name: /Itens \(1\)/ }));
    // Com itens expandidos há dois "Editar" — o do serviço e o do item.
    // O do item é o segundo na ordem de renderização.
    const editarBtns = screen.getAllByRole("button", { name: "Editar" });
    fireEvent.click(editarBtns[editarBtns.length - 1]);
    expect(screen.getByText("Editar item")).toBeInTheDocument();
    const titulo = screen.getByPlaceholderText(/Título do item/);
    expect(titulo.value).toBe("Assentamento de porcelanato");
  });

  it("fecha o editor e volta à lista ao clicar em Voltar (←)", () => {
    renderPainel();
    fireEvent.click(screen.getByRole("button", { name: "Serviços e itens" }));
    fireEvent.click(screen.getByRole("button", { name: /Itens \(1\)/ }));
    fireEvent.click(screen.getByRole("button", { name: /Adicionar item/ }));
    expect(screen.getByText("Novo item")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    // Voltou para a lista
    expect(screen.queryByText("Novo item")).not.toBeInTheDocument();
    expect(screen.getByText("Assentamento de porcelanato")).toBeInTheDocument();
  });
});

describe("PainelClient — estado sem cadastros", () => {
  it("exibe tela de reivindicação quando não há cadastros", () => {
    render(<PainelClient cadastros={[]} stats={{}} />);
    expect(screen.getByText(/Encontrar seu cadastro/i)).toBeInTheDocument();
  });
});

describe("PainelClient — métricas na Visão geral", () => {
  it("mostra '—' como nota média quando stats é undefined", () => {
    render(<PainelClient cadastros={[cadastro]} stats={{}} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("mostra 'Recomendado ✓' quando stats.recomendado é true", () => {
    const statsRec = { p1: { count: 5, avg: 4.8, recomendado: true } };
    render(<PainelClient cadastros={[cadastro]} stats={statsRec} />);
    expect(screen.getByText(/Recomendado ✓/)).toBeInTheDocument();
  });

  it("mostra 'Identidade verificada ✓' quando verificado é true", () => {
    const verificado = { ...cadastro, verificado: true };
    render(<PainelClient cadastros={[verificado]} stats={stats} />);
    expect(screen.getByText(/Identidade verificada ✓/)).toBeInTheDocument();
  });
});
