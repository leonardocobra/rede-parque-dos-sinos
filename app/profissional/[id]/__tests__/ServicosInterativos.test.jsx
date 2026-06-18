import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ServicosInterativos from "../ServicosInterativos";

const servico = (over = {}) => ({
  id: "s1",
  servico: "Pintor",
  categoria: "Construção e Reforma",
  ordem: 0,
  descricao: "Pinturas residenciais.",
  instagram: null,
  ...over,
});

describe("ServicosInterativos", () => {
  it("não renderiza nada sem serviços", () => {
    const { container } = render(<ServicosInterativos servicos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra nome e descrição de um único serviço", () => {
    render(<ServicosInterativos servicos={[servico()]} />);
    expect(screen.getByText(/Pintor/)).toBeInTheDocument();
    expect(screen.getByText("Pinturas residenciais.")).toBeInTheDocument();
  });

  it("troca a descrição ao clicar no chip de outro serviço", () => {
    const servicos = [
      servico(),
      servico({
        id: "s2",
        servico: "Barbeiro",
        categoria: "Beleza e Moda",
        ordem: 1,
        descricao: "Cortes masculinos.",
      }),
    ];
    render(<ServicosInterativos servicos={servicos} />);

    // Começa no primeiro serviço.
    expect(screen.getByText("Pinturas residenciais.")).toBeInTheDocument();
    expect(screen.queryByText("Cortes masculinos.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Barbeiro/ }));

    expect(screen.getByText("Cortes masculinos.")).toBeInTheDocument();
    expect(screen.queryByText("Pinturas residenciais.")).not.toBeInTheDocument();
  });

  it("renderiza itens/produtos do serviço quando existem", () => {
    const servicos = [
      servico({
        itens: [
          { id: "i1", nome: "Pintura de parede", preco: "R$ 30/m²" },
          { id: "i2", nome: "Textura" },
        ],
      }),
    ];
    render(<ServicosInterativos servicos={servicos} />);
    expect(screen.getByText("Pintura de parede")).toBeInTheDocument();
    expect(screen.getByText("R$ 30/m²")).toBeInTheDocument();
    expect(screen.getByText("Textura")).toBeInTheDocument();
  });
});
