// Lógica de estatísticas e ordenação do catálogo.
// Mantida fora do componente para ser testável de forma isolada (sem React/Supabase).

// Calcula as estatísticas de avaliação de um profissional a partir da lista de
// avaliações. Retorna null quando o profissional ainda não tem avaliações.
export function computeStats(profId, avals) {
  const m = (avals || []).filter((a) => a.profissional_id === profId);
  if (!m.length) return null;
  const avg = m.reduce((s, a) => s + a.nota, 0) / m.length;
  const pct = (pred) => Math.round((m.filter(pred).length / m.length) * 100);
  const novamente = pct((a) => a.novamente);
  return {
    avg: Math.round(avg * 10) / 10,
    count: m.length,
    pontual: pct((a) => a.pontual),
    novamente,
    conforme: pct((a) => a.conforme),
    // Selo calculado: 80%+ "contrataria novamente" e no mínimo 3 avaliações.
    recomendado: novamente >= 80 && m.length >= 3,
  };
}

// Opções de ordenação oferecidas na UI do catálogo.
export const ORDENACOES = [
  { value: "relevancia", label: "Relevância" },
  { value: "avaliacao", label: "Melhor avaliados" },
  { value: "recentes", label: "Mais recentes" },
];

export const ORDENACAO_PADRAO = "relevancia";

// Timestamp de criação como número (0 quando ausente/ inválido), para comparação.
function tempo(p) {
  const t = p && p.criado_em ? new Date(p.criado_em).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

// Ordena os profissionais de acordo com o modo escolhido.
// Não muta o array de entrada.
//
// - "recentes": mais novos primeiro (comportamento histórico do catálogo).
// - "avaliacao": maior média primeiro; empate vai para mais avaliações e depois
//   mais recente. Profissionais sem avaliação ficam no fim (não têm média a exibir).
// - "relevancia" (padrão): recomendados primeiro; dentro de cada grupo, mais
//   recentes primeiro. Equilibra qualidade comprovada com exposição de quem
//   acabou de entrar — importante numa rede comunitária pequena.
export function sortProfissionais(profs, avals, mode = ORDENACAO_PADRAO) {
  const lista = [...(profs || [])];
  const statsDe = (p) => computeStats(p.id, avals);

  if (mode === "recentes") {
    return lista.sort((a, b) => tempo(b) - tempo(a));
  }

  if (mode === "avaliacao") {
    return lista.sort((a, b) => {
      const sa = statsDe(a);
      const sb = statsDe(b);
      // Sem avaliação vai para o fim.
      if (!sa && !sb) return tempo(b) - tempo(a);
      if (!sa) return 1;
      if (!sb) return -1;
      if (sb.avg !== sa.avg) return sb.avg - sa.avg;
      if (sb.count !== sa.count) return sb.count - sa.count;
      return tempo(b) - tempo(a);
    });
  }

  // relevancia (padrão)
  return lista.sort((a, b) => {
    const ra = statsDe(a)?.recomendado ? 1 : 0;
    const rb = statsDe(b)?.recomendado ? 1 : 0;
    if (rb !== ra) return rb - ra;
    return tempo(b) - tempo(a);
  });
}
