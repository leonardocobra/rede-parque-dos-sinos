// Painel do profissional. Rota protegida: sem sessão, manda para /entrar.
// Lista os cadastros do dono (RLS por user_id) e entrega ao cliente para edição.
import { redirect } from "next/navigation";
import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
import SairButton from "./SairButton";
import PainelClient from "./PainelClient";
import ClaimPendente from "./ClaimPendente";
import { getServerSupabase } from "../../lib/supabase/server";
import { getAvaliacoesDe } from "../../lib/profissionais";
import { computeStats } from "../../lib/catalogo";

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
    .select(
      "*, profissional_servicos(id, servico, categoria, ordem, descricao, instagram, profissional_itens(*))"
    )
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });

  // Estatísticas de avaliação por cadastro (nº de avaliações, nota média e
  // selo "Recomendado" calculado). A leitura de avaliacoes é pública (RLS).
  const lista = meus || [];
  const stats = {};
  await Promise.all(
    lista.map(async (c) => {
      const avals = await getAvaliacoesDe(c.id);
      stats[c.id] = computeStats(c.id, avals);
    })
  );

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

        <ClaimPendente />
        <PainelClient cadastros={lista} stats={stats} />
      </div>
      <Footer />
    </>
  );
}
