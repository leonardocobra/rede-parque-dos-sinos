import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Nav from "../Nav";

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

describe("Nav", () => {
  it("renderiza o logo com o texto correto", () => {
    render(<Nav />);
    expect(screen.getByText("Parque dos Sinos")).toBeInTheDocument();
  });

  it("renderiza todos os links de navegação", () => {
    render(<Nav />);
    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
    expect(screen.getByText("Cadastrar")).toBeInTheDocument();
    expect(screen.getByText("Sobre")).toBeInTheDocument();
  });
});
