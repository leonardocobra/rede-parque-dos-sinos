// Painel do profissional. Rota protegida: sem sessão, manda para /entrar.
// Lista os cadastros do dono (RLS por user_id) e entrega ao cliente para edição.
import { redirect } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import SairButton from "./SairButton";
import PainelClient from "./PainelClient";
import { getServerSupabase } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  // Cadastros que já pertencem a esta conta (RLS deixa o dono ler os seus).
  const { data: meus } = await supabase
    .from("profissionais")
    .select("*")
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[520px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[26px]">Seu painel</h2>
          <SairButton />
        </div>
        <p className="text-[13px] text-brand-grey-light mt-1 mb-5">
          Conectado como <strong>{user.email}</strong>
        </p>

        <PainelClient cadastros={meus || []} />
      </div>
      <Footer />
    </>
  );
}
