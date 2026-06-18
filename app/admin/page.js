// Painel interno /admin — Frente 3, fase 1 (Leonardo como piloto).
// Rota protegida por DUAS barreiras no servidor:
//   1) sessão válida (cookie) — senão vai para /entrar;
//   2) e-mail na allowlist ADMIN_EMAILS — senão 404 (não revela a rota).
// Mostra a "visão da oferta" (P0.3). Leitura de eventos (service_role) vem
// na próxima fatia. Ver docs/observabilidade-spec.md.
import { redirect, notFound } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import SairButton from "../painel/SairButton";
import { getServerSupabase } from "../../lib/supabase/server";
import { isAdmin, computeVisaoOferta } from "../../lib/admin";

export const dynamic = "force-dynamic";

function Stat({ valor, rotulo, sub }) {
  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
      <div className="font-display text-[28px] leading-none text-brand-text">{valor}</div>
      <div className="text-[11px] text-brand-grey-light uppercase tracking-[0.6px] mt-1.5">
        {rotulo}
      </div>
      {sub && <div className="text-[12px] text-brand-grey mt-1">{sub}</div>}
    </div>
  );
}

export default async function Admin() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");
  if (!isAdmin(user.email)) notFound();

  // Leituras públicas (SELECT liberado nessas tabelas). A agregação é pura.
  const [{ data: profissionais }, { data: servicos }] = await Promise.all([
    supabase.from("profissionais").select("id, foto_url, user_id, verificado, criado_em"),
    supabase.from("profissional_servicos").select("profissional_id, categoria"),
  ]);

  const v = computeVisaoOferta(profissionais || [], servicos || []);

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[680px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[26px]">Painel da Rede</h1>
          <SairButton />
        </div>
        <p className="text-[13px] text-brand-grey-light mt-1 mb-5">
          Visão interna · conectado como <strong>{user.email}</strong>
        </p>

        <h2 className="font-display text-[16px] mb-2">Oferta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Stat valor={v.total} rotulo="Profissionais" />
          <Stat
            valor={v.comConta}
            rotulo="Com conta"
            sub={`${v.anonimos} anônimo${v.anonimos === 1 ? "" : "s"}`}
          />
          <Stat valor={`${v.pctComFoto}%`} rotulo="Com foto" sub={`${v.comFoto} de ${v.total}`} />
          <Stat valor={v.verificados} rotulo="Verificados" />
          <Stat valor={v.novos30} rotulo="Novos (30d)" />
          <Stat valor={v.novos90} rotulo="Novos (90d)" />
        </div>

        <h2 className="font-display text-[16px] mt-6 mb-2">Cadastros por categoria</h2>
        {v.porCategoria.length === 0 ? (
          <p className="text-[13px] text-brand-grey-light">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
            {v.porCategoria.map((c) => (
              <div key={c.categoria} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-brand-text">{c.categoria}</span>
                <span className="text-[13px] font-bold text-brand-grey">{c.total}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-brand-grey-light mt-6">
          Próxima fatia: tráfego e conversão da jornada por canal (tabela de eventos, via leitura de
          servidor).
        </p>
      </div>
      <Footer />
    </>
  );
}
