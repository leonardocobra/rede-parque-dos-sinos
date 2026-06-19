// Painel interno /admin — Frente 3, fase 1 (Leonardo como piloto).
// Rota protegida por DUAS barreiras no servidor:
//   1) sessão válida (cookie) — senão vai para /entrar;
//   2) e-mail na allowlist ADMIN_EMAILS — senão 404 (não revela a rota).
// Mostra a "visão da oferta" (P0.3) e o analytics de eventos (P0.4/P0.5),
// este último lido via service_role (SELECT de `eventos` é fechado).
// Ver docs/observabilidade-spec.md.
import { redirect, notFound } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import SairButton from "../painel/SairButton";
import { getServerSupabase } from "../../lib/supabase/server";
import { getServiceSupabase } from "../../lib/supabase/service";
import { isAdmin, computeVisaoOferta, computeAnalyticsEventos } from "../../lib/admin";

export const dynamic = "force-dynamic";

const JANELA_DIAS = 30;

// Lê os eventos dos últimos JANELA_DIAS via service_role. Retorna null se a
// chave não estiver configurada (o /admin degrada com uma mensagem).
async function lerEventos() {
  const service = getServiceSupabase();
  if (!service) return null;
  const desde = new Date(Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("eventos")
    .select("tipo, rota, canal, origem, sessao_id, criado_em")
    .gte("criado_em", desde)
    .limit(50000); // suficiente para o piloto; acima disso, paginar.
  return data || [];
}

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
  // Eventos vêm via service_role (SELECT fechado a anon/authenticated).
  const [{ data: profissionais }, { data: servicos }, eventos] = await Promise.all([
    supabase.from("profissionais").select("id, foto_url, user_id, verificado, criado_em"),
    supabase.from("profissional_servicos").select("profissional_id, categoria"),
    lerEventos(),
  ]);

  const v = computeVisaoOferta(profissionais || [], servicos || []);
  const a = eventos ? computeAnalyticsEventos(eventos) : null;

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

        <div className="flex items-baseline justify-between mt-7 mb-2">
          <h2 className="font-display text-[16px]">Tráfego e jornada</h2>
          <span className="text-[11px] text-brand-grey-light">últimos {JANELA_DIAS} dias</span>
        </div>

        {a === null ? (
          <p className="text-[13px] text-brand-grey-light">
            Configure <code className="text-brand-text">SUPABASE_SERVICE_ROLE_KEY</code> para ver o
            tráfego e a conversão da jornada.
          </p>
        ) : a.visitas === 0 ? (
          <p className="text-[13px] text-brand-grey-light">
            Ainda sem eventos registrados nesta janela. Assim que houver navegação, os números
            aparecem aqui.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Stat valor={a.visitantes} rotulo="Visitantes" sub={`${a.visitas} visitas`} />
              <Stat valor={a.perfilViews} rotulo="Views de perfil" />
              <Stat
                valor={a.contatos}
                rotulo="Contatos"
                sub={`${a.taxaContato}% dos visitantes`}
              />
            </div>

            <h3 className="font-display text-[14px] mt-5 mb-2">Por canal</h3>
            <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-[10px] text-brand-grey-light uppercase tracking-[0.5px]">
                <span>Origem</span>
                <span className="text-right w-16">Visitantes</span>
                <span className="text-right w-16">Contatos</span>
              </div>
              {a.porCanal.map((c) => (
                <div
                  key={c.origem}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 items-center"
                >
                  <span className="text-[13px] text-brand-text truncate">{c.origem}</span>
                  <span className="text-[13px] text-brand-grey text-right w-16">{c.visitantes}</span>
                  <span className="text-[13px] font-bold text-brand-text text-right w-16">
                    {c.contatos}
                    <span className="text-[11px] font-normal text-brand-grey-light">
                      {" "}
                      ({c.pctContato}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <h3 className="font-display text-[14px] mt-5 mb-2">Funil da jornada</h3>
            <div className="space-y-1.5">
              {a.funil.map((f) => (
                <div key={f.etapa} className="flex items-center gap-3">
                  <span className="text-[12px] text-brand-grey w-20 shrink-0">{f.etapa}</span>
                  <div className="flex-1 bg-brand-surface rounded-[5px] h-6 overflow-hidden border border-brand-border">
                    <div
                      className="bg-brand-red h-full flex items-center px-2"
                      style={{ width: `${Math.max(f.pct, f.sessoes > 0 ? 6 : 0)}%` }}
                    >
                      <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {f.sessoes}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-brand-grey-light w-10 text-right shrink-0">
                    {f.pct}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="font-display text-[16px] mt-7 mb-2">Desempenho</h2>
        <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
          <p className="text-[13px] text-brand-grey leading-relaxed">
            Os Web Vitals (LCP, INP, CLS) são coletados em campo pelo Vercel Speed Insights, com
            percentis (p75) e quebra por página. Acompanhe a saúde de carregamento e interação no
            dashboard da Vercel.
          </p>
          <a
            href="https://vercel.com/leonardo-cobra/rede-parque-dos-sinos-kwfd/speed-insights"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-[13px] font-bold text-brand-red"
          >
            Abrir Speed Insights na Vercel →
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
}
