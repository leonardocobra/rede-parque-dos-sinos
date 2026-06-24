// Agregações puras para a aba "IA" do /admin.
// Recebe as linhas de ai_invocacoes e devolve métricas serializáveis.

function pct(num, denom) {
  if (!denom) return 0;
  return Math.round((num / denom) * 100);
}

function media(valores) {
  if (!valores.length) return 0;
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}

function p95(valores) {
  if (!valores.length) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

export function computeObservabilidadeIA(invocacoes = []) {
  const total = invocacoes.length;
  const sucessos = invocacoes.filter((i) => i.sucesso).length;
  const falhas = total - sucessos;

  const custoTotal = invocacoes.reduce((s, i) => s + (i.custo ?? 0), 0);
  const tokensIn = invocacoes.reduce((s, i) => s + (i.tokens_in ?? 0), 0);
  const tokensOut = invocacoes.reduce((s, i) => s + (i.tokens_out ?? 0), 0);

  const latencias = invocacoes.map((i) => i.latencia_ms ?? 0).filter((v) => v > 0);
  const latenciaMedia = media(latencias);
  const latenciaP95 = p95(latencias);

  // Breakdown por rota
  const rotaMap = new Map();
  for (const inv of invocacoes) {
    const rota = inv.rota || "(desconhecida)";
    if (!rotaMap.has(rota)) {
      rotaMap.set(rota, { rota, total: 0, falhas: 0, custoTotal: 0, tokensTotal: 0, _lats: [] });
    }
    const r = rotaMap.get(rota);
    r.total++;
    if (!inv.sucesso) r.falhas++;
    r.custoTotal += inv.custo ?? 0;
    r.tokensTotal += (inv.tokens_in ?? 0) + (inv.tokens_out ?? 0);
    if (inv.latencia_ms > 0) r._lats.push(inv.latencia_ms);
  }
  const porRota = [...rotaMap.values()]
    .map(({ _lats, custoTotal: c, ...r }) => ({
      ...r,
      custoTotal: parseFloat(c.toFixed(6)),
      latenciaMedia: media(_lats),
    }))
    .sort((a, b) => b.total - a.total);

  // Últimas 5 falhas
  const ultimasFalhas = invocacoes
    .filter((i) => !i.sucesso && i.erro)
    .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
    .slice(0, 5)
    .map(({ id, rota, modelo, erro, criado_em }) => ({ id, rota, modelo, erro, criado_em }));

  // Eval score médio (ignora nulls)
  const scores = invocacoes.map((i) => i.eval_score).filter((v) => v != null);
  const evalMediaScore = scores.length ? parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)) : null;

  return {
    total,
    sucesso: sucessos,
    falhas,
    taxaSucesso: pct(sucessos, total),
    custoTotal: parseFloat(custoTotal.toFixed(6)),
    tokensIn,
    tokensOut,
    latenciaMedia,
    latenciaP95,
    porRota,
    ultimasFalhas,
    evalMediaScore,
  };
}
