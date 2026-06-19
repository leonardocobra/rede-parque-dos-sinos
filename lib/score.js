// Função pura para calcular o score de maturidade digital de um profissional.
// Sem I/O — testável com Vitest.
//
// Entrada:
//   perfil  — objeto da tabela profissionais (com profissional_servicos[].profissional_itens[])
//   stats   — retorno de computeStats (count, avg, recomendado) ou null
//   auto    — sinais auto-declarados { temGoogle, instagramAtivo }
//
// Saída:
//   { pontos, nivel, barra, proximosPassos }
//   nivel: "Bronze" | "Prata" | "Ouro"
//   barra: { min, max } — intervalo do nível atual (para % de progresso)
//   proximosPassos: [{ label, pts }] — itens ainda não conquistados, ordenados por pts desc

const NIVEIS = [
  { nome: "Bronze", min: 0, max: 39 },
  { nome: "Prata", min: 40, max: 69 },
  { nome: "Ouro", min: 70, max: 100 },
];

// Cada critério: pts = contribuição no score total (soma = 100)
const CRITERIOS = [
  {
    id: "foto",
    pts: 15,
    label: "Adicione uma foto de perfil",
    conquistado: (p) => !!p.foto_url,
  },
  {
    id: "descricao",
    pts: 10,
    label: "Escreva sua apresentação (bio)",
    conquistado: (p) => !!(p.descricao || "").trim(),
  },
  {
    id: "experiencia",
    pts: 5,
    label: "Informe seu tempo de experiência",
    conquistado: (p) => !!(p.experiencia || "").trim(),
  },
  {
    id: "instagram",
    pts: 10,
    label: "Adicione seu Instagram",
    conquistado: (p) => !!(p.instagram || "").trim(),
  },
  {
    id: "itens",
    pts: 10,
    label: "Adicione pelo menos 1 item/preço a um serviço",
    conquistado: (p) =>
      (p.profissional_servicos || []).some(
        (s) => (s.profissional_itens || []).length > 0
      ),
  },
  {
    id: "aval1",
    pts: 5,
    label: "Receba sua 1ª avaliação",
    conquistado: (_, s) => !!(s && s.count >= 1),
  },
  {
    id: "aval3",
    pts: 5,
    label: "Chegue a 3 avaliações",
    conquistado: (_, s) => !!(s && s.count >= 3),
  },
  {
    id: "aval5",
    pts: 5,
    label: "Chegue a 5 avaliações",
    conquistado: (_, s) => !!(s && s.count >= 5),
  },
  {
    id: "nota",
    pts: 5,
    label: "Mantenha nota média ≥ 4,5",
    conquistado: (_, s) => !!(s && s.avg >= 4.5),
  },
  {
    id: "recomendado",
    pts: 10,
    label: "Conquiste o selo Recomendado",
    conquistado: (_, s) => !!(s && s.recomendado),
  },
  {
    id: "verificado",
    pts: 10,
    label: "Solicite a verificação de identidade",
    conquistado: (p) => !!p.verificado,
  },
  {
    id: "google",
    pts: 5,
    label: "Crie seu perfil no Google Meu Negócio",
    conquistado: (_, __, a) => !!(a && a.temGoogle),
  },
  {
    id: "instagram_ativo",
    pts: 5,
    label: "Marque seu Instagram como ativo",
    conquistado: (_, __, a) => !!(a && a.instagramAtivo),
  },
];
// Soma: 15+10+5+10+10+5+5+5+5+10+10+5+5 = 100

export function computaScore(perfil = {}, stats = null, auto = {}) {
  let pontos = 0;
  const proximosPassos = [];

  for (const c of CRITERIOS) {
    if (c.conquistado(perfil, stats, auto)) {
      pontos += c.pts;
    } else {
      proximosPassos.push({ label: c.label, pts: c.pts });
    }
  }

  // Ordenar próximos passos por maior impacto primeiro
  proximosPassos.sort((a, b) => b.pts - a.pts);

  const nivel = NIVEIS.findLast((n) => pontos >= n.min) || NIVEIS[0];
  const proximo = NIVEIS[NIVEIS.indexOf(nivel) + 1] || null;

  return {
    pontos,
    nivel: nivel.nome,
    barra: { min: nivel.min, max: proximo ? proximo.min - 1 : 100 },
    proximosPassos,
  };
}
