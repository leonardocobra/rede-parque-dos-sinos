import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Entrar from "../page";

const signInWithOtp = vi.fn();

vi.mock("../../../lib/supabase/client", () => ({
  getBrowserSupabase: () => ({ auth: { signInWithOtp } }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// Nav e Footer não interessam ao teste e tocam outros módulos.
vi.mock("../../components/features/Nav", () => ({ default: () => null }));
vi.mock("../../components/features/Footer", () => ({ default: () => null }));

function preencheEEnvia(email = "ana@exemplo.com") {
  fireEvent.change(screen.getByPlaceholderText("voce@exemplo.com"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /Enviar link de acesso/ }));
}

describe("Entrar", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
  });

  it("mostra confirmação quando o envio dá certo", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<Entrar />);
    preencheEEnvia();
    expect(await screen.findByText("Verifique seu e-mail")).toBeInTheDocument();
  });

  it("mostra mensagem de limite quando o Supabase retorna 429", async () => {
    signInWithOtp.mockResolvedValue({
      error: { status: 429, code: "over_email_send_rate_limit" },
    });
    render(<Entrar />);
    preencheEEnvia();
    expect(await screen.findByText(/muitos links em pouco tempo/i)).toBeInTheDocument();
  });

  it("mostra erro genérico para outras falhas", async () => {
    signInWithOtp.mockResolvedValue({ error: { status: 500, message: "boom" } });
    render(<Entrar />);
    preencheEEnvia();
    expect(
      await screen.findByText("Não foi possível enviar o link. Tente novamente.")
    ).toBeInTheDocument();
  });

  it("não chama o Supabase com e-mail inválido", async () => {
    render(<Entrar />);
    preencheEEnvia("nao-eh-email");
    await waitFor(() => expect(signInWithOtp).not.toHaveBeenCalled());
  });
});
