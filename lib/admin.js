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
