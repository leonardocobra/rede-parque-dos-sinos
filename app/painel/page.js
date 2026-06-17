// Painel do profissional (stub do PR B). Rota protegida: sem sessão, manda para
// /entrar. A edição do cadastro + métricas vêm no PR C.
import { redirect } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import SairButton from "./SairButton";
import { getServerSupabase } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[500px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[26px]">Seu painel</h2>
          <SairButton />
        </div>
        <p className="text-[13px] text-brand-grey-light mt-1">
          Conectado como <strong>{user.email}</strong>
        </p>

        <div className="bg-brand-card rounded-[10px] border border-brand-border p-4 mt-5">
          <p className="text-[13px] text-brand-grey leading-relaxed">
            Em breve você poderá editar seu cadastro, atualizar a foto e acompanhar suas avaliações
            por aqui.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
