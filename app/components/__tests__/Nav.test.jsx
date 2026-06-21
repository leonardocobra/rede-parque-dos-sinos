import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Nav from "../features/Nav";
import { BRAND } from "../../brand";

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

// Nav consulta a sessão do Supabase no client; no ambiente de teste não há
// credenciais, então mockamos o cliente para evitar o throw de inicialização.
vi.mock("../../../lib/supabase/client", () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  }),
}));

describe("Nav", () => {
  it("renderiza o logo com a sigla e o wordmark da marca", () => {
    render(<Nav />);
    // O logo usa o wordmark "a_rede." e a sigla quadrada, não o nome por extenso.
    expect(screen.getByText("a_rede.")).toBeInTheDocument();
    expect(screen.getByText(BRAND.sigla)).toBeInTheDocument();
  });

  it("renderiza todos os links de navegação", () => {
    render(<Nav />);
    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
    expect(screen.getByText("Cadastrar")).toBeInTheDocument();
    expect(screen.getByText("Sobre")).toBeInTheDocument();
  });
});
