import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Pilulas from "../ui/Pilulas";

const secoes = [
  { id: "a", label: "Oferta" },
  { id: "b", label: "Tráfego" },
  { id: "c", label: "Desempenho" },
];

describe("Pilulas", () => {
  it("renderiza todas as seções", () => {
    render(<Pilulas secoes={secoes} ativo="a" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Oferta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tráfego" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desempenho" })).toBeInTheDocument();
  });

  it("marca apenas a pílula ativa via aria-pressed", () => {
    render(<Pilulas secoes={secoes} ativo="b" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Tráfego" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Oferta" })).toHaveAttribute("aria-pressed", "false");
  });

  it("chama onChange com o id ao clicar", () => {
    const onChange = vi.fn();
    render(<Pilulas secoes={secoes} ativo="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Desempenho" }));
    expect(onChange).toHaveBeenCalledWith("c");
  });
});
