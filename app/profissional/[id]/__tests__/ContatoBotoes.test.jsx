import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ContatoBotoes from "../ContatoBotoes";

// Isola o teste das camadas de telemetria/eventos (sem rede, sem analytics).
vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
vi.mock("../../../lib/eventos", () => ({ registrarEvento: vi.fn() }));

const props = (over = {}) => ({
  id: "p1",
  nome: "João Pintor",
  servico: "Pintor",
  whatsapp: "https://wa.me/5511999999999",
  instagram: "https://instagram.com/joaopintor",
  ...over,
});

const linkAvaliar = () => screen.getByRole("link", { name: "Avaliar" });
const linkWhats = () => screen.queryByRole("link", { name: "Contato via WhatsApp" });
const linkInsta = () => screen.queryByRole("link", { name: "Perfil no Instagram" });

describe("ContatoBotoes", () => {
  it("com WhatsApp e Instagram: renderiza os três na ordem fixa", () => {
    render(<ContatoBotoes {...props()} />);
    expect(linkWhats()).toBeInTheDocument();
    expect(linkInsta()).toBeInTheDocument();
    expect(linkAvaliar()).toBeInTheDocument();

    // Ordem: WhatsApp → Instagram → Avaliar.
    const links = screen.getAllByRole("link");
    const labels = links.map((l) => l.getAttribute("aria-label") || l.textContent);
    const idxWa = labels.indexOf("Contato via WhatsApp");
    const idxIg = labels.indexOf("Perfil no Instagram");
    const idxAv = labels.indexOf("Avaliar");
    expect(idxWa).toBeLessThan(idxIg);
    expect(idxIg).toBeLessThan(idxAv);
  });

  it("sem Instagram: esconde o botão do Instagram, mantém WhatsApp e Avaliar", () => {
    render(<ContatoBotoes {...props({ instagram: null })} />);
    expect(linkInsta()).not.toBeInTheDocument();
    expect(linkWhats()).toBeInTheDocument();
    expect(linkAvaliar()).toBeInTheDocument();
  });

  it("sem WhatsApp utilizável: esconde o botão do WhatsApp, mantém Avaliar", () => {
    render(<ContatoBotoes {...props({ whatsapp: null })} />);
    expect(linkWhats()).not.toBeInTheDocument();
    expect(linkAvaliar()).toBeInTheDocument();
  });

  it("sem WhatsApp e sem Instagram: Avaliar continua sempre presente", () => {
    render(<ContatoBotoes {...props({ whatsapp: null, instagram: null })} />);
    expect(linkWhats()).not.toBeInTheDocument();
    expect(linkInsta()).not.toBeInTheDocument();
    expect(linkAvaliar()).toBeInTheDocument();
  });

  it("aponta o WhatsApp e o Avaliar para os destinos corretos", () => {
    render(<ContatoBotoes {...props()} />);
    expect(linkWhats()).toHaveAttribute("href", "https://wa.me/5511999999999");
    expect(linkAvaliar()).toHaveAttribute("href", "/avaliar?id=p1&nome=Jo%C3%A3o%20Pintor");
  });
});
