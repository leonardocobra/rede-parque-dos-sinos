import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DivulgarPorCanal from "../DivulgarPorCanal";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
vi.mock("../../../lib/eventos", () => ({ registrarEvento: vi.fn() }));

let copiado;
beforeEach(() => {
  copiado = [];
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn((t) => (copiado.push(t), Promise.resolve())) },
  });
});

describe("DivulgarPorCanal", () => {
  it("renderiza o botão primário e os 4 canais com dica", () => {
    render(<DivulgarPorCanal id="abc" />);
    expect(screen.getByRole("button", { name: "Copiar meu link" })).toBeInTheDocument();
    expect(screen.getByText("Bio do Insta")).toBeInTheDocument();
    expect(screen.getByText("cole na bio/post")).toBeInTheDocument();
    expect(screen.getByText("Status / Stories")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
  });

  it("o link genérico sai taggeado com utm_source=perfil", async () => {
    render(<DivulgarPorCanal id="abc" />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar meu link" }));
    expect(await screen.findByText("Link copiado ✓")).toBeInTheDocument();
    expect(copiado[0]).toContain("/profissional/abc");
    expect(copiado[0]).toContain("utm_source=perfil");
  });

  it("o link por canal sai com o utm_source do canal", async () => {
    render(<DivulgarPorCanal id="abc" />);
    fireEvent.click(screen.getByText("Bio do Insta"));
    await screen.findByText("copiado ✓");
    expect(copiado[0]).toContain("utm_source=instagram");
  });
});
