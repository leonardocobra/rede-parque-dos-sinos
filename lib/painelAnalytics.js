// Função pura para analytics de perfil no /painel — métricas que o dono vê
// sobre o próprio cadastro. Sem I/O, para ser testável com Vitest.
//
// Entrada: eventos já filtrados por profissional_id e janela de datas.
//   eventos: [{ tipo, origem, criado_em }]
//   tipos esperados: "profile_view" | "contact_click"

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
// Retorna: { perfilViews, contatos, fontes, serie }
//   fontes: [{ origem, total }] — ordenado por total desc
//   serie:  [{ dia, perfilViews, contatos }] — 30 pontos
export function computaAnaliticasPerfil(eventos = [], { dias = 30, agora = new Date() } = {}) {
  let perfilViews = 0;
  let contatos = 0;
  const fonteMap = new Map();

  for (const e of eventos) {
    const origem = e.origem || "direto";
    if (!fonteMap.has(origem)) fonteMap.set(origem, { origem, perfilViews: 0, contatos: 0 });
    const b = fonteMap.get(origem);
    if (e.tipo === "profile_view") {
      perfilViews++;
      b.perfilViews++;
    } else if (e.tipo === "contact_click") {
      contatos++;
      b.contatos++;
    }
  }

  const fontes = [...fonteMap.values()]
    .map((f) => ({ origem: f.origem, total: f.perfilViews + f.contatos }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // exibe até 5 fontes

  return {
    perfilViews,
    contatos,
    fontes,
    serie: serieDiaria(eventos, dias, agora),
  };
}
