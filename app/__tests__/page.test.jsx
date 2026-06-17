import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "../page";
import { REGRAS } from "../config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Home", () => {
  it("exibe as regras básicas completas na home", () => {
    render(<Home />);
    expect(screen.getByText("Regras Básicas")).toBeInTheDocument();
    REGRAS.forEach((r) => expect(screen.getByText(r)).toBeInTheDocument());
  });

  it("mantém a ação rápida de avaliar (ausente no Hero)", () => {
    render(<Home />);
    expect(screen.getByText("Avaliar Profissional")).toBeInTheDocument();
  });

  it("não repete o CTA de ver catálogo (apenas o do Hero)", () => {
    render(<Home />);
    expect(screen.getAllByText("Ver Catálogo")).toHaveLength(1);
  });
});
