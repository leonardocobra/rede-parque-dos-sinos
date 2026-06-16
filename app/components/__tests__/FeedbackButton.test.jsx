import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FeedbackButton from "../FeedbackButton";

const insert = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogo",
}));

vi.mock("../../../lib/supabase", () => ({
  supabase: { from: () => ({ insert: (...args) => insert(...args) }) },
}));

async function enviarUm(mensagem) {
  fireEvent.click(screen.getByText("Bug"));
  fireEvent.change(screen.getByPlaceholderText(/O que aconteceu/i), {
    target: { value: mensagem },
  });
  fireEvent.click(screen.getByText("Enviar Feedback"));
  await screen.findByText("Obrigado pelo feedback!");
}

describe("FeedbackButton", () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
  });

  it("permite enviar vários feedbacks sem reabrir a janela", async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByLabelText("Reportar feedback"));

    await enviarUm("Primeiro problema relatado");
    expect(insert).toHaveBeenCalledTimes(1);

    // Tela de sucesso oferece novo envio em destaque, sem fechar.
    fireEvent.click(screen.getByText("Enviar outro feedback"));

    // Formulário limpo e pronto para novo envio.
    expect(screen.getByPlaceholderText(/O que aconteceu/i)).toHaveValue("");
    await enviarUm("Segundo problema relatado");
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("não fecha a janela automaticamente após o envio", async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByLabelText("Reportar feedback"));
    await enviarUm("Mensagem de teste");

    // Continua na tela de sucesso aguardando ação manual.
    expect(screen.getByText("Enviar outro feedback")).toBeInTheDocument();
    expect(screen.getByText("Fechar")).toBeInTheDocument();
  });

  it("fecha a janela manualmente pelo botão Fechar", async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByLabelText("Reportar feedback"));
    await enviarUm("Mensagem de teste");

    fireEvent.click(screen.getByText("Fechar"));
    await waitFor(() =>
      expect(screen.queryByText("Obrigado pelo feedback!")).not.toBeInTheDocument()
    );
  });
});
