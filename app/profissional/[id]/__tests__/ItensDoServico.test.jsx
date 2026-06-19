import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ItensDoServico from "../ItensDoServico";

describe("ItensDoServico", () => {
  it("não renderiza nada sem itens", () => {
    const { container } = render(<ItensDoServico itens={[]} />);
    expect(container).toBeEmptyDOMElement();
    const vazio = render(<ItensDoServico itens={undefined} />);
    expect(vazio.container).toBeEmptyDOMElement();
  });

  it("sem fotos: lista de texto com título e preço", () => {
    const itens = [
      { id: "i1", titulo: "Faxina pesada", preco: 150, preco_tipo: "a_partir" },
      { id: "i2", titulo: "Pós-obra", preco_tipo: "sob_orcamento" },
    ];
    const { container } = render(<ItensDoServico itens={itens} />);
    expect(screen.getByText("Faxina pesada")).toBeInTheDocument();
    expect(screen.getByText("a partir de R$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("Pós-obra")).toBeInTheDocument();
    expect(screen.getByText("sob orçamento")).toBeInTheDocument();
    // Sem foto → não há <img> (modo lista).
    expect(container.querySelector("img")).toBeNull();
  });

  it("usa a disponibilidade quando não há preço (degradação)", () => {
    const itens = [{ id: "i1", titulo: "Item simples", disponibilidade: "pronta entrega" }];
    render(<ItensDoServico itens={itens} />);
    expect(screen.getByText("pronta entrega")).toBeInTheDocument();
  });

  it("com fotos: vira carrossel de cards com imagem", () => {
    const itens = [
      {
        id: "i1",
        titulo: "Bolo vulcão",
        preco: 75,
        preco_tipo: "a_partir",
        disponibilidade: "sob encomenda",
        foto_url: "https://exemplo/bolo.jpg",
      },
      { id: "i2", titulo: "Torta", preco_tipo: "sob_orcamento" },
    ];
    const { container } = render(<ItensDoServico itens={itens} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://exemplo/bolo.jpg");
    expect(screen.getByText("Bolo vulcão")).toBeInTheDocument();
    expect(screen.getByText("a partir de R$ 75,00")).toBeInTheDocument();
    expect(screen.getByText("sob encomenda")).toBeInTheDocument();
    // Item sem foto no mesmo serviço ainda aparece (placeholder).
    expect(screen.getByText("Torta")).toBeInTheDocument();
  });
});
