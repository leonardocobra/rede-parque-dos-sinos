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
        profissional_itens: [
          { id: "i1", titulo: "Pintura de parede", preco: 30, preco_tipo: "fixo" },
          { id: "i2", titulo: "Textura" },
        ],
      }),
    ];
    render(<ServicosInterativos servicos={servicos} />);
    expect(screen.getByText("Pintura de parede")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
    expect(screen.getByText("Textura")).toBeInTheDocument();
  });

  it("usa bioFallback como descrição quando o serviço não tem a própria", () => {
    const semDescricao = servico({ descricao: "" });
    render(<ServicosInterativos servicos={[semDescricao]} bioFallback="Bio geral do profissional." />);
    expect(screen.getByText("Bio geral do profissional.")).toBeInTheDocument();
  });

  it("prioriza a descrição do serviço sobre o bioFallback", () => {
    render(<ServicosInterativos servicos={[servico()]} bioFallback="Bio geral do profissional." />);
    expect(screen.getByText("Pinturas residenciais.")).toBeInTheDocument();
    expect(screen.queryByText("Bio geral do profissional.")).not.toBeInTheDocument();
  });
});
