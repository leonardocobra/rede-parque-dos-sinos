// Geração de links com UTM para divulgação por canal.
// Resolve o ponto fraco da atribuição: o Instagram (e outros apps) costuma
// abrir links sem `referrer`, então um link puro vira "direto". Com utm_source
// explícito a origem é contada certo — e o utm_source tem precedência sobre o
// referrer na captura (ver lib/eventos.js). Ver docs/observabilidade-spec.md.

// Source do link genérico ("Copiar meu link"): quando o dono compartilha sem
// escolher um canal, o tráfego ainda chega identificado (bucket próprio "perfil"
// no /admin) em vez de virar "direto".
export const FONTE_PERFIL = "perfil";

// Canais que o profissional divulga, com o utm_source correspondente e uma dica
// curta de onde colar. O `source` precisa casar com o vocabulário de origem do
// /admin — não mudar sem alinhar a atribuição.
export const CANAIS_DIVULGACAO = [
  { id: "instagram", rotulo: "Bio do Insta", source: "instagram", dica: "cole na bio/post" },
  { id: "status", rotulo: "Status / Stories", source: "status", dica: "no status do zap" },
  { id: "whatsapp", rotulo: "WhatsApp", source: "whatsapp", dica: "mandar pra alguém" },
  { id: "facebook", rotulo: "Facebook", source: "facebook", dica: "post ou grupo" },
];

// Acrescenta utm_source (e opcionalmente medium/campaign) a uma URL absoluta,
// preservando a query existente e sem duplicar parâmetros.
export function adicionarUtm(url, source, { medium, campaign } = {}) {
  if (!source) return url;
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  if (medium) u.searchParams.set("utm_medium", medium);
  if (campaign) u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
