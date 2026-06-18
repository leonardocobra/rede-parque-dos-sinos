import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PerfilInterativo from "../PerfilInterativo";

const servicos = [
  { id: "s1", servico: "Pintor", categoria: "Construção e Reforma", ordem: 0 },
  { id: "s2", servico: "Barbeiro", categoria: "Beleza e Moda", ordem: 1 },
];

const outrosPorCategoria = {
  "Construção e Reforma": [
    { id: "p2", nome: "Marcos Pedreiro", profissional_servicos: [{ servico: "Pedreiro" }] },
  ],
  "Beleza e Moda": [
    { id: "p3", nome: "Ana Cabeleireira", profissional_servicos: [{ servico: "Cabeleireira" }] },
  ],
};

function renderPerfil(props = {}) {
  return render(
    <PerfilInterativo
      servicos={servicos}
      outrosPorCategoria={outrosPorCategoria}
      cidade="Jacareí"
      {...props}
    >
      <p>miolo server-rendered</p>
    </PerfilInterativo>
  );
}

describe("PerfilInterativo", () => {
  it("renderiza o miolo (children) entre as seções", () => {
    renderPerfil();
    expect(screen.getByText("miolo server-rendered")).toBeInTheDocument();
  });

  it("inicia mostrando os 'Outros' da categoria do serviço primário", () => {
    renderPerfil();
    expect(screen.getByText("Outros de Construção e Reforma")).toBeInTheDocument();
    expect(screen.getByText("Marcos Pedreiro")).toBeInTheDocument();
    expect(screen.queryByText("Ana Cabeleireira")).not.toBeInTheDocument();
  });

  it("troca a seção 'Outros' ao selecionar um serviço de outra categoria", () => {
    renderPerfil();
    fireEvent.click(screen.getByRole("button", { name: /Barbeiro/ }));

    expect(screen.getByText("Outros de Beleza e Moda")).toBeInTheDocument();
    expect(screen.getByText("Ana Cabeleireira")).toBeInTheDocument();
    expect(screen.queryByText("Marcos Pedreiro")).not.toBeInTheDocument();
  });

  it("aponta o link 'Ver todos' para a categoria ativa", () => {
    renderPerfil();
    fireEvent.click(screen.getByRole("button", { name: /Barbeiro/ }));
    const link = screen.getByRole("link", { name: /Ver todos/ });
    expect(link).toHaveAttribute("href", "/catalogo?cat=" + encodeURIComponent("Beleza e Moda"));
  });

  it("omite a seção 'Outros' quando a categoria ativa não tem outros", () => {
    renderPerfil({ outrosPorCategoria: { "Construção e Reforma": [] } });
    expect(screen.queryByText(/^Outros de/)).not.toBeInTheDocument();
  });
});
