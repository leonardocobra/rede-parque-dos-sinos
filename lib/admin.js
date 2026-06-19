// Suporte ao painel interno /admin (Frente 3, fase 1 — Leonardo como piloto).
// Gate por allowlist de e-mail (env ADMIN_EMAILS, server-only) e agregações da
// "visão da oferta". Ver docs/observabilidade-spec.md (P0.2, P0.3).

// Lista de e-mails autorizados, normalizada (minúsculas, sem espaços/vazios).
// ADMIN_EMAILS é uma env do SERVIDOR (sem NEXT_PUBLIC) — nunca vai ao cliente.
export function parseAdminEmails(raw = process.env.ADMIN_EMAILS || "") {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// É admin se o e-mail (da sessão verificada no servidor) está na allowlist.
// Sem allowlist configurada, NINGUÉM é admin (fail-closed).
export function isAdmin(email, raw = process.env.ADMIN_EMAILS || "") {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.trim().toLowerCase());
}

// Agrega a "visão da oferta" a partir das linhas de profissionais e serviços.
// Função pura (sem I/O) para ser testável. Datas comparadas contra `agora`.
//   profissionais: [{ id, foto_url, user_id, verificado, criado_em }]
//   servicos:      [{ profissional_id, categoria }]
export function computeVisaoOferta(profissionais = [], servicos = [], agora = new Date()) {
  const total = profissionais.length;
  const comConta = profissionais.filter((p) => p.user_id).length;
  const comFoto = profissionais.filter((p) => p.foto_url).length;
  const verificados = profissionais.filter((p) => p.verificado).length;

  const desde = (dias) => {
    const t = agora.getTime() - dias * 24 * 60 * 60 * 1000;
    return profissionais.filter((p) => p.criado_em && new Date(p.criado_em).getTime() >= t).length;
  };

  // Cadastros distintos por categoria (um profissional pode ter vários serviços
  // na mesma categoria; conta o profissional uma vez por categoria).
  const porCategoriaSet = new Map(); // categoria -> Set(profissional_id)
  for (const s of servicos) {
    if (!s.categoria) continue;
    if (!porCategoriaSet.has(s.categoria)) porCategoriaSet.set(s.categoria, new Set());
    porCategoriaSet.get(s.categoria).add(s.profissional_id);
  }
  const porCategoria = [...porCategoriaSet.entries()]
    .map(([categoria, set]) => ({ categoria, total: set.size }))
    .sort((a, b) => b.total - a.total);

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return {
    total,
    comConta,
    anonimos: total - comConta,
    comFoto,
    pctComFoto: pct(comFoto),
    verificados,
    novos30: desde(30),
    novos90: desde(90),
    porCategoria,
  };
}

// Classifica a rota de um page_view numa etapa do funil.
// perfil = /profissional/...; catalogo = /catalogo (inclui categorias).
function etapaDaRota(rota = "") {
  if (rota === "/") return "home";
  if (rota.startsWith("/profissional")) return "perfil";
  if (rota.startsWith("/catalogo")) return "catalogo";
  return null;
}

// Agrega os eventos da camada de analytics para o /admin (fase 1).
// Função pura (sem I/O) para ser testável.
//   eventos: [{ tipo, rota, canal, origem, sessao_id, criado_em }]
// Retorna KPIs, quebra por canal de origem e funil da jornada.
export function computeAnalyticsEventos(eventos = []) {
  const sessoes = new Set();
  let visitas = 0; // page_views
  let perfilViews = 0;
  let contatos = 0;

  // canal -> { visitas, contatos, sessoes:Set }
  const canalMap = new Map();
  const garanteCanal = (origem) => {
    const k = origem || "(desconhecido)";
    if (!canalMap.has(k)) canalMap.set(k, { origem: k, visitas: 0, contatos: 0, sessoes: new Set() });
    return canalMap.get(k);
  };

  // Funil: conjuntos de sessões que alcançaram cada etapa.
  const funilSets = { topo: sessoes, catalogo: new Set(), perfil: new Set(), contato: new Set() };

  for (const e of eventos) {
    const s = e.sessao_id || null;
    if (s) sessoes.add(s);
    const canal = garanteCanal(e.origem);
    if (s) canal.sessoes.add(s);

    if (e.tipo === "page_view") {
      visitas += 1;
      canal.visitas += 1;
      const etapa = etapaDaRota(e.rota || "");
      if (etapa === "catalogo" && s) funilSets.catalogo.add(s);
      if (etapa === "perfil" && s) funilSets.perfil.add(s);
    } else if (e.tipo === "profile_view") {
      perfilViews += 1;
      if (s) funilSets.perfil.add(s);
    } else if (e.tipo === "contact_click") {
      contatos += 1;
      canal.contatos += 1;
      if (s) funilSets.contato.add(s);
    }
  }

  const visitantes = sessoes.size;
  const pctDe = (n) => (visitantes ? Math.round((n / visitantes) * 100) : 0);

  const porCanal = [...canalMap.values()]
    .map((c) => ({
      origem: c.origem,
      visitas: c.visitas,
      visitantes: c.sessoes.size,
      contatos: c.contatos,
      pctContato: c.sessoes.size ? Math.round((c.contatos / c.sessoes.size) * 100) : 0,
    }))
    .sort((a, b) => b.visitantes - a.visitantes);

  const funil = [
    { etapa: "Visitantes", sessoes: visitantes, pct: 100 },
    { etapa: "Catálogo", sessoes: funilSets.catalogo.size, pct: pctDe(funilSets.catalogo.size) },
    { etapa: "Perfil", sessoes: funilSets.perfil.size, pct: pctDe(funilSets.perfil.size) },
    { etapa: "Contato", sessoes: funilSets.contato.size, pct: pctDe(funilSets.contato.size) },
  ];

  return {
    visitas,
    visitantes,
    perfilViews,
    contatos,
    taxaContato: pctDe(contatos), // contatos por visitante
    porCanal,
    funil,
  };
}
