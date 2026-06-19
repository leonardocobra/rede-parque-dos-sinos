// Função pura para calcular o score de maturidade digital de um profissional.
// Sem I/O — testável com Vitest.
//
// Entrada:
//   perfil — objeto da tabela profissionais (com profissional_servicos[].profissional_itens[])
//   auto   — sinais auto-declarados { temGoogle, temFotosGoogle, temOutroDiretorio,
//              instagramAtivo, temFotosTrabalho, linkNaBio, usaWhatsappBusiness,
//              fezMetaAds, fezGoogleAds }
//
// Saída:
//   { pontos, nivel, barra, proximosPassos }
//   nivel: "Bronze" | "Prata" | "Ouro"
//   barra: { min, max } — intervalo do nível atual (para % de progresso visual)
//   proximosPassos: [{ id, label, dica, pts }] — itens pendentes, ordenados por pts desc

export const NIVEIS = [
  { nome: "Bronze", min: 0, max: 39 },
  { nome: "Prata", min: 40, max: 69 },
  { nome: "Ouro", min: 70, max: 100 },
];

// Critérios verificados automaticamente pelo app (60 pts total)
// e auto-declarados pelo profissional (40 pts total). Soma = 100.
export const CRITERIOS = [
  // — Verificados automaticamente —
  {
    id: "foto",
    pts: 15,
    label: "Adicione uma foto de perfil",
    dica: "Profissionais com foto recebem até 3× mais cliques no catálogo. Use uma foto clara do seu rosto ou de um trabalho concluído.",
    auto: false,
    conquistado: (p) => !!p.foto_url,
  },
  {
    id: "descricao",
    pts: 10,
    label: "Escreva sua apresentação (bio)",
    dica: "É o primeiro texto que o cliente lê. Conte quem você é, o que faz de especial e por que escolher você. Não precisa ser longo — 3 linhas já fazem diferença.",
    auto: false,
    conquistado: (p) => !!(p.descricao || "").trim(),
  },
  {
    id: "instagram",
    pts: 10,
    label: "Adicione seu Instagram",
    dica: "Com o Instagram preenchido, clientes podem conferir seus trabalhos antes de entrar em contato — aumenta a confiança antes mesmo do primeiro clique.",
    auto: false,
    conquistado: (p) => !!(p.instagram || "").trim(),
  },
  {
    id: "itens",
    pts: 10,
    label: "Adicione pelo menos 1 item com preço a um serviço",
    dica: "Profissionais com preços cadastrados convertem melhor — o cliente já chega sabendo o que esperar e tem menos motivo para pesquisar concorrentes.",
    auto: false,
    conquistado: (p) =>
      (p.profissional_servicos || []).some(
        (s) => (s.profissional_itens || []).length > 0
      ),
  },
  {
    id: "experiencia",
    pts: 5,
    label: "Informe seu tempo de experiência",
    dica: "Clientes valorizam experiência comprovada. Informe quantos anos você atua na área — é um dos primeiros filtros que as pessoas aplicam.",
    auto: false,
    conquistado: (p) => !!(p.experiencia || "").trim(),
  },
  {
    id: "verificado",
    pts: 10,
    label: "Solicite a verificação de identidade",
    dica: "O selo Verificado confirma que você é um profissional real da região. Entre em contato com A Rede para solicitar — o processo é rápido.",
    auto: false,
    conquistado: (p) => !!p.verificado,
  },

  // — Auto-declarados pelo profissional —
  {
    id: "google",
    pts: 8,
    label: "Crie seu perfil no Google Meu Negócio",
    dica: "É a principal fonte que o Google, ChatGPT e Perplexity usam para recomendar serviços locais. Criar é gratuito em business.google.com — leva cerca de 10 minutos.",
    auto: true,
    autoKey: "temGoogle",
    conquistado: (_, a) => !!(a?.temGoogle),
  },
  {
    id: "fotos_google",
    pts: 3,
    label: "Adicione fotos do seu trabalho no Google",
    dica: "Perfis com fotos no Google recebem até 42% mais pedidos de contato. Adicione pelo menos 3 fotos reais de serviços concluídos.",
    auto: true,
    autoKey: "temFotosGoogle",
    conquistado: (_, a) => !!(a?.temFotosGoogle),
  },
  {
    id: "diretorio",
    pts: 2,
    label: "Cadastre-se em outro diretório online",
    dica: "Mais plataformas = mais canais de descoberta orgânica. Sugestões: GetNinjas, OLX Serviços ou Habitissimo. Quanto mais citações, mais relevância.",
    auto: true,
    autoKey: "temOutroDiretorio",
    conquistado: (_, a) => !!(a?.temOutroDiretorio),
  },
  {
    id: "instagram_ativo",
    pts: 4,
    label: "Mantenha seu Instagram ativo",
    dica: "Perfis sem postagens recentes passam a impressão de que o profissional parou de trabalhar. Um post por semana — mesmo uma foto simples — já é suficiente para manter o perfil vivo.",
    auto: true,
    autoKey: "instagramAtivo",
    conquistado: (_, a) => !!(a?.instagramAtivo),
  },
  {
    id: "fotos_trabalho",
    pts: 3,
    label: "Publique fotos de antes e depois do seu trabalho",
    dica: "É o formato com maior engajamento para serviços locais: mostra o problema resolvido de forma concreta. Vale para qualquer área — pintura, instalação, limpeza, etc.",
    auto: true,
    autoKey: "temFotosTrabalho",
    conquistado: (_, a) => !!(a?.temFotosTrabalho),
  },
  {
    id: "link_na_bio",
    pts: 2,
    label: "Coloque seu link da A Rede na bio do Instagram",
    dica: "Seu link está disponível na aba Visão geral do painel. Ao colocá-lo na bio, qualquer pessoa que achar seu Instagram chega direto ao seu perfil completo com avaliações e contato.",
    auto: true,
    autoKey: "linkNaBio",
    conquistado: (_, a) => !!(a?.linkNaBio),
  },
  {
    id: "whatsapp_business",
    pts: 4,
    label: "Use o WhatsApp Business",
    dica: "Gratuito e profissional: cadastre horário de atendimento, catálogo de serviços e mensagem automática de ausência. Clientes que recebem resposta automática têm muito mais chance de aguardar em vez de procurar outro profissional.",
    auto: true,
    autoKey: "usaWhatsappBusiness",
    conquistado: (_, a) => !!(a?.usaWhatsappBusiness),
  },
  {
    id: "meta_ads",
    pts: 7,
    label: "Faça uma campanha no Meta Ads (Facebook / Instagram)",
    dica: "Permite segmentar por cidade, bairro e tipo de serviço. Mesmo com R$ 5/dia por uma semana você alcança clientes locais que nunca te encontrariam organicamente — e começa a entender quais anúncios funcionam.",
    auto: true,
    autoKey: "fezMetaAds",
    conquistado: (_, a) => !!(a?.fezMetaAds),
  },
  {
    id: "google_ads",
    pts: 7,
    label: "Faça uma campanha no Google Ads",
    dica: "Quem busca 'eletricista perto de mim' já quer contratar — é a maior intenção de compra entre todos os canais digitais. Campanhas de pesquisa local têm investimento inicial a partir de R$ 10/dia.",
    auto: true,
    autoKey: "fezGoogleAds",
    conquistado: (_, a) => !!(a?.fezGoogleAds),
  },
];
// Soma verificados: 15+10+10+10+5+10 = 60 pts
// Soma auto-declarados: 8+3+2+4+3+2+4+7+7 = 40 pts
// Total: 100 pts

export function computaScore(perfil = {}, auto = {}) {
  let pontos = 0;
  const proximosPassos = [];

  for (const c of CRITERIOS) {
    if (c.conquistado(perfil, auto)) {
      pontos += c.pts;
    } else {
      proximosPassos.push({ id: c.id, label: c.label, dica: c.dica, pts: c.pts });
    }
  }

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
