// Helpers puros do perfil público do profissional.
// Sem React/Supabase — testáveis de forma isolada e reaproveitados tanto na
// página server-rendered quanto em generateMetadata.

// Cidade fixa exibida em título/descrição (origem da Rede). O bairro é contexto;
// a cidade é o termo de busca real ("eletricista em Jacareí").
export const CIDADE = "Jacareí";

// Tamanho-alvo da meta description (boa prática de SEO ~155-160 caracteres).
const DESCRICAO_MAX = 160;

// Título da aba / SEO: "Nome — Serviço em Jacareí · A Rede".
export function tituloPerfil(prof) {
  if (!prof || !prof.nome) return "Profissional · A Rede";
  return `${prof.nome} — ${prof.servico} em ${CIDADE} · A Rede`;
}

// Meta description: identifica o profissional, o serviço e o local, completando
// com a descrição própria (se houver) ou uma frase padrão da comunidade.
export function descricaoPerfil(prof) {
  if (!prof || !prof.nome) return "Profissional de confiança na Rede.";
  const local = prof.bairro ? `${prof.bairro}, ${CIDADE}` : CIDADE;
  const base = `${prof.nome} — ${prof.servico} em ${local}.`;
  const extra = (prof.descricao || "").trim();
  const txt = extra ? `${base} ${extra}` : `${base} Profissional indicado por vizinhos na Rede.`;
  return txt.length > DESCRICAO_MAX ? txt.slice(0, DESCRICAO_MAX - 1).trimEnd() + "…" : txt;
}

// Monta o link do WhatsApp a partir do telefone (mesma regra do catálogo).
// Retorna null quando não há dígitos utilizáveis.
export function whatsappLink(telefone) {
  const n = (telefone || "").replace(/\D/g, "");
  return n ? "https://wa.me/55" + n : null;
}

// Seleciona outros profissionais da mesma categoria, excluindo o próprio perfil,
// limitado a `limite`. Não muta a entrada.
export function filtrarOutros(profs, categoria, exceptId, limite = 4) {
  if (!categoria) return [];
  return (profs || [])
    .filter((p) => p && p.categoria === categoria && p.id !== exceptId)
    .slice(0, limite);
}
