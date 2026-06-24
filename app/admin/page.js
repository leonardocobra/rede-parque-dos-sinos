// Painel interno /admin — Frente 3, fase 1 (Leonardo como piloto).
// Rota protegida por DUAS barreiras no servidor:
//   1) sessão válida (cookie) — senão vai para /entrar;
//   2) e-mail na allowlist ADMIN_EMAILS — senão 404 (não revela a rota).
// Mostra a "visão da oferta" (P0.3) e o analytics de eventos (P0.4/P0.5),
// este último lido via service_role (SELECT de `eventos` é fechado).
// A apresentação (pílulas Oferta/Tráfego/Desempenho) fica em AdminClient.
// Ver docs/observabilidade-spec.md.
import { redirect, notFound } from "next/navigation";
import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
import { getServerSupabase } from "../../lib/supabase/server";
import { getServiceSupabase } from "../../lib/supabase/service";
import { isAdmin, computeVisaoOferta, computeAnalyticsEventos, computeScoreDistribuicao } from "../../lib/admin";
import { computaScore } from "../../lib/score";
import { computeObservabilidadeIA } from "../../lib/observabilidade-ia";
import AdminClient from "./AdminClient";

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

async function lerInvocacoes() {
  const service = getServiceSupabase();
  if (!service) return null;
  const desde = new Date(Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("ai_invocacoes")
    .select("id, rota, modelo, tokens_in, tokens_out, custo, latencia_ms, sucesso, erro, eval_score, criado_em")
    .gte("criado_em", desde)
    .limit(10000);
  return data || [];
}

export default async function Admin() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");
  if (!isAdmin(user.email)) notFound();

  // Leituras públicas (SELECT liberado nessas tabelas). A agregação é pura.
  // Itens contam só os ativos (espelha o perfil público). Eventos vêm via
  // service_role (SELECT fechado a anon/authenticated).
  const [{ data: profissionais }, { data: servicos }, { data: itens }, eventos, invocacoes] = await Promise.all(
    [
      supabase.from("profissionais").select(
        "id, foto_url, user_id, verificado, criado_em, descricao, instagram, experiencia, " +
        "tem_google, tem_fotos_google, tem_outro_diretorio, instagram_ativo, " +
        "tem_fotos_trabalho, link_na_bio, usa_whatsapp_business, fez_meta_ads, fez_google_ads, " +
        "profissional_servicos(profissional_itens(id))"
      ),
      supabase.from("profissional_servicos").select("profissional_id, categoria"),
      supabase.from("profissional_itens").select("profissional_id, foto_url, ativo"),
      lerEventos(),
      lerInvocacoes(),
    ]
  );

  const lista = profissionais || [];
  const v = computeVisaoOferta(lista, servicos || [], new Date(), itens || []);
  const a = eventos ? computeAnalyticsEventos(eventos, { dias: JANELA_DIAS }) : null;
  const s = computeScoreDistribuicao(lista, { computaScore });
  const ia = invocacoes ? computeObservabilidadeIA(invocacoes) : null;

  return (
    <>
      <Nav />
      <AdminClient email={user.email} v={v} a={a} s={s} ia={ia} janelaDias={JANELA_DIAS} />
      <Footer />
    </>
  );
}
