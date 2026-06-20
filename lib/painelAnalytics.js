// Função pura para analytics de perfil no /painel — métricas que o dono vê
// sobre o próprio cadastro. Sem I/O, para ser testável com Vitest.
//
// Entrada: eventos já filtrados por profissional_id e janela de datas.
//   eventos: [{ tipo, origem, canal, criado_em }]
//   tipos esperados: "profile_view" | "contact_click"
//                  | "share_perfil" | "share_pos_avaliacao" | "share_pedir_avaliacao"

// Origens cujo tráfego é atribuído a uma indicação (link compartilhado).
// Espelha ORIGENS_INDICACAO de lib/admin.js — mantidos separados para que
// cada módulo seja independente (sem acoplamento cruzado).
const ORIGENS_INDICACAO = new Set(["compartilhado", "whatsapp"]);

function diaKey(criadoEm) {
  if (!criadoEm) return null;
  const d = new Date(criadoEm);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Série temporal contínua de `dias` dias terminando em `agora`, bucketizada
// por dia (UTC). Dias sem evento entram zerados — linha sem buracos no gráfico.
function serieDiaria(eventos, dias, agora) {
  const buckets = new Map();
  const ordem = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(agora.getTime() - i * 24 * 60 * 60 * 1000);
    const k = d.toISOString().slice(0, 10);
    const b = { dia: k, perfilViews: 0, contatos: 0 };
    buckets.set(k, b);
    ordem.push(b);
  }
  for (const e of eventos) {
    const b = buckets.get(diaKey(e.criado_em));
    if (!b) continue;
    if (e.tipo === "profile_view") b.perfilViews += 1;
    else if (e.tipo === "contact_click") b.contatos += 1;
  }
  return ordem;
}

// Agrega eventos de perfil para exibição no /painel do dono.
// Retorna: { perfilViews, contatos, fontes, serie, referral }
//   fontes:  [{ origem, total }] — ordenado por total desc
//   serie:   [{ dia, perfilViews, contatos }] — 30 pontos
//   referral: { shares, sharesPorCanal, visitasIndicacao, contatosIndicacao }
//     shares:            total de eventos share_* emitidos pelo profissional
//     sharesPorCanal:    [{ canal, total }] desc — como ele compartilhou
//     visitasIndicacao:  profile_views recebidos de origem "compartilhado"|"whatsapp"
//     contatosIndicacao: contact_clicks das mesmas origens
export function computaAnaliticasPerfil(eventos = [], { dias = 30, agora = new Date() } = {}) {
  let perfilViews = 0;
  let contatos = 0;
  const fonteMap = new Map();

  // Referral
  let shares = 0;
  const canalShareMap = new Map();
  let visitasIndicacao = 0;
  let contatosIndicacao = 0;

  for (const e of eventos) {
    const origem = e.origem || "direto";
    const viaIndicacao = ORIGENS_INDICACAO.has(e.origem);

    if (e.tipo === "profile_view") {
      perfilViews++;
      if (!fonteMap.has(origem)) fonteMap.set(origem, { origem, perfilViews: 0, contatos: 0 });
      fonteMap.get(origem).perfilViews++;
      if (viaIndicacao) visitasIndicacao++;
    } else if (e.tipo === "contact_click") {
      contatos++;
      if (!fonteMap.has(origem)) fonteMap.set(origem, { origem, perfilViews: 0, contatos: 0 });
      fonteMap.get(origem).contatos++;
      if (viaIndicacao) contatosIndicacao++;
    } else if (
      e.tipo === "share_perfil" ||
      e.tipo === "share_pos_avaliacao" ||
      e.tipo === "share_pedir_avaliacao"
    ) {
      shares++;
      const ck = e.canal || "(desconhecido)";
      canalShareMap.set(ck, (canalShareMap.get(ck) || 0) + 1);
    }
  }

  const fontes = [...fonteMap.values()]
    .map((f) => ({ origem: f.origem, total: f.perfilViews + f.contatos }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // exibe até 5 fontes

  const sharesPorCanal = [...canalShareMap.entries()]
    .map(([canal, total]) => ({ canal, total }))
    .sort((a, b) => b.total - a.total);

  return {
    perfilViews,
    contatos,
    fontes,
    serie: serieDiaria(eventos, dias, agora),
    referral: { shares, sharesPorCanal, visitasIndicacao, contatosIndicacao },
  };
}
